import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { Stepper, PrimaryButton } from './Controls'
import { CATEGORIES, guessCategory } from '../lib/categories'
import { currencySymbol, formatMoney, parseAmount } from '../lib/money'
import { useStore } from '../store/store'
import { knownItems } from '../store/selectors'
import type { Category } from '../store/types'

export interface ItemValues {
  name: string
  category: Category
  qty: number
  price?: number
}

interface ItemSheetProps {
  open: boolean
  onClose: () => void
  title: string
  initial?: Partial<ItemValues>
  priceLabel?: string
  /** Header confirm label. */
  confirmLabel?: string
  /** Optional big bottom button (e.g. "Add to Cart"). */
  primaryLabel?: string
  onSubmit: (v: ItemValues) => void
  onDelete?: () => void
  deleteLabel?: string
  /** Focus price instead of name (for pricing a planned item in-store). */
  focusPrice?: boolean
}

const FORM_ID = 'item-form'

export function ItemSheet(props: ItemSheetProps) {
  // Remount the form each time the sheet opens so state starts fresh.
  const [openCount, setOpenCount] = useState(0)
  useEffect(() => {
    if (props.open) setOpenCount((n) => n + 1)
  }, [props.open])

  return (
    <BottomSheet
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      confirmLabel={props.confirmLabel ?? 'Done'}
      onConfirm={() => (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit()}
    >
      <ItemForm key={openCount} {...props} />
    </BottomSheet>
  )
}

function ItemForm({ initial, priceLabel = 'Price', primaryLabel, onSubmit, onDelete, deleteLabel, focusPrice }: ItemSheetProps) {
  const currency = useStore((s) => s.settings.currency)
  const history = useStore((s) => s.history)
  const activeTrip = useStore((s) => s.activeTrip)

  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '')
  const [qty, setQty] = useState(initial?.qty ?? 1)
  const [category, setCategory] = useState<Category>(initial?.category ?? 'other')
  const [categoryTouched, setCategoryTouched] = useState(initial?.category != null)
  const [showSuggestions, setShowSuggestions] = useState(!initial?.name)

  const nameRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => (focusPrice ? priceRef : nameRef).current?.focus(), 350)
    return () => clearTimeout(t)
  }, [focusPrice])

  const known = useMemo(() => knownItems(history, activeTrip), [history, activeTrip])
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    if (!q || !showSuggestions) return []
    return known.filter((k) => k.name.toLowerCase().includes(q) && k.name.toLowerCase() !== q).slice(0, 6)
  }, [known, name, showSuggestions])

  const onNameChange = (v: string) => {
    setName(v)
    setShowSuggestions(true)
    if (!categoryTouched) setCategory(guessCategory(v) ?? 'other')
  }

  const parsedPrice = parseAmount(price)
  const lineTotal = (parsedPrice ?? 0) * qty
  const valid = name.trim().length > 0

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!valid) return nameRef.current?.focus()
    onSubmit({ name: name.trim(), category, qty, price: parsedPrice })
  }

  return (
    <form id={FORM_ID} onSubmit={submit} className="px-4 pt-2">
      <div className="overflow-hidden rounded-[26px] bg-card">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Item name"
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              priceRef.current?.focus()
            }
          }}
          className="h-[50px] w-full bg-transparent px-4 text-[17px] outline-none placeholder:text-label-3"
        />
        <div className="hairline-t ml-4 flex h-[50px] items-center pr-4">
          <label htmlFor="item-price" className="w-28 shrink-0 text-[17px]">
            {priceLabel}
          </label>
          <span className="text-[17px] text-label-2">{currencySymbol(currency)}</span>
          <input
            id="item-price"
            ref={priceRef}
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            placeholder="0.00"
            enterKeyHint="done"
            className="tabular h-full min-w-0 flex-1 bg-transparent pl-1 text-[17px] outline-none placeholder:text-label-3"
          />
        </div>
        <div className="hairline-t ml-4 flex h-[50px] items-center justify-between pr-3">
          <span className="text-[17px]">Quantity</span>
          <Stepper value={qty} onChange={setQty} />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                setName(s.name)
                setCategory(s.category)
                setCategoryTouched(true)
                if (!price && s.price != null) setPrice(String(s.price))
                setShowSuggestions(false)
                priceRef.current?.focus()
              }}
              className="press-glass flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[15px]"
            >
              {s.name}
              {s.price != null && <span className="text-label-2">{formatMoney(s.price, currency)}</span>}
            </button>
          ))}
        </div>
      )}

      {qty > 1 && parsedPrice != null && (
        <p className="tabular px-4 pt-1.5 text-[13px] text-label-2">
          {qty} × {formatMoney(parsedPrice, currency)} = {formatMoney(lineTotal, currency)}
        </p>
      )}

      <div className="px-5 pt-6 pb-2 text-[15px] font-semibold text-label-2">Category</div>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((c) => {
          const active = c.id === category
          const Icon = c.icon
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCategory(c.id)
                setCategoryTouched(true)
              }}
              className={`press-glass flex flex-col items-center gap-1 rounded-[22px] py-2.5 transition-colors ${
                active ? 'bg-card ring-2' : 'bg-transparent'
              }`}
              style={active ? ({ '--tw-ring-color': c.color } as React.CSSProperties) : undefined}
            >
              <span
                className="flex size-9 items-center justify-center rounded-full"
                style={{ background: active ? c.color : `${c.color}22`, color: active ? '#fff' : c.color }}
              >
                <Icon size={19} strokeWidth={2.2} />
              </span>
              <span className={`text-[11px] leading-tight ${active ? 'font-semibold' : 'text-label-2'}`}>
                {c.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {primaryLabel && (
        <PrimaryButton className="mt-6" disabled={!valid} onClick={() => submit()}>
          {primaryLabel}
        </PrimaryButton>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="press-fade mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-[17px] text-red"
        >
          <Trash2 size={18} /> {deleteLabel ?? 'Delete Item'}
        </button>
      )}
    </form>
  )
}
