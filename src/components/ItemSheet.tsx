import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { Stepper, PrimaryButton } from './Controls'
import { ActionSheet } from './Dialog'
import { gsap, useGSAP, prefersReducedMotion, pop } from '../lib/gsap'
import { parseEntry } from '../lib/parseEntry'
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
  const [confirmDelete, setConfirmDelete] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Category tiles ripple in as the sheet rises (row by row, left to right).
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-cat-tile]', {
        scale: 0.8,
        autoAlpha: 0,
        duration: 0.42,
        delay: 0.12,
        ease: 'back.out(2)',
        stagger: { each: 0.018, grid: [3, 4], from: 'start' },
        clearProps: 'transform,opacity,visibility',
      })
    },
    { scope: formRef },
  )
  const priceRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => (focusPrice ? priceRef : nameRef).current?.focus(), 350)
    return () => clearTimeout(t)
  }, [focusPrice])

  // Shorthand in the name ("candle stick 3@25") fills quantity and price live.
  const entry = parseEntry(name)
  const shorthand = entry.qty !== undefined || entry.price !== undefined
  // Values from before the shorthand was typed, restored if it's deleted again.
  const beforeShorthand = useRef<{ price: string; qty: number } | null>(null)

  const known = useMemo(() => knownItems(history, activeTrip), [history, activeTrip])
  const suggestions = useMemo(() => {
    const q = entry.name.toLowerCase()
    if (!q || !showSuggestions) return []
    return known.filter((k) => k.name.toLowerCase().includes(q) && k.name.toLowerCase() !== q).slice(0, 6)
  }, [known, entry.name, showSuggestions])

  const onNameChange = (v: string) => {
    setName(v)
    setShowSuggestions(true)
    const parsed = parseEntry(v)
    if (parsed.qty !== undefined || parsed.price !== undefined) {
      beforeShorthand.current ??= { price, qty }
      setQty(parsed.qty ?? beforeShorthand.current.qty)
      setPrice(parsed.price !== undefined ? String(parsed.price) : beforeShorthand.current.price)
    } else if (beforeShorthand.current) {
      setPrice(beforeShorthand.current.price)
      setQty(beforeShorthand.current.qty)
      beforeShorthand.current = null
    }
    if (!categoryTouched) setCategory(guessCategory(parsed.name) ?? 'other')
  }

  /** Strip the shorthand from the field once it's been applied. */
  const commitName = () => {
    if (!shorthand) return
    setName(entry.name)
    beforeShorthand.current = null
  }

  const parsedPrice = parseAmount(price)
  const lineTotal = (parsedPrice ?? 0) * qty
  const valid = entry.name.length > 0

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!valid) return nameRef.current?.focus()
    onSubmit({ name: entry.name, category, qty, price: parsedPrice })
  }

  return (
    <form ref={formRef} id={FORM_ID} onSubmit={submit} className="px-4 pt-2">
      <div className="overflow-hidden rounded-[26px] bg-card">
        <div className="flex h-[50px] items-center pr-3">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={commitName}
            placeholder="Item name, e.g. eggs 2@270"
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitName()
                priceRef.current?.focus()
              }
            }}
            className="h-full min-w-0 flex-1 bg-transparent pl-4 text-[17px] outline-none placeholder:text-label-3"
          />
          {shorthand && (
            // Confirms the shorthand was understood.
            <span className="tabular shrink-0 rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)] px-2.5 py-1 text-[13px] font-semibold text-blue">
              {entry.qty ?? qty} × {entry.price !== undefined ? formatMoney(entry.price, currency) : '—'}
            </span>
          )}
        </div>
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
                beforeShorthand.current = null
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
              data-cat-tile
              type="button"
              aria-pressed={active}
              onClick={(e) => {
                if (!active) pop(e.currentTarget.querySelector('[data-cat-icon]'), 0.7)
                setCategory(c.id)
                setCategoryTouched(true)
              }}
              className={`press-glass flex flex-col items-center gap-1 rounded-[22px] py-2.5 transition-colors ${
                active ? 'bg-card ring-2' : 'bg-transparent'
              }`}
              style={active ? ({ '--tw-ring-color': c.color } as React.CSSProperties) : undefined}
            >
              <span
                data-cat-icon
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
        <>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="press-glass mt-3 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-fill text-[17px] font-semibold text-red"
          >
            <Trash2 size={19} strokeWidth={2.3} /> {deleteLabel ?? 'Delete Item'}
          </button>
          <ActionSheet
            open={confirmDelete}
            // "Delete “Milk”?" / "Remove “Milk”?" — the verb from the button label.
            title={`${(deleteLabel ?? 'Delete').split(' ')[0]} “${initial?.name ?? name}”?`}
            message="This can’t be undone."
            onDismiss={() => setConfirmDelete(false)}
            actions={[
              {
                label: deleteLabel ?? 'Delete Item',
                style: 'destructive',
                onPress: () => {
                  setConfirmDelete(false)
                  onDelete()
                },
              },
            ]}
          />
        </>
      )}
    </form>
  )
}
