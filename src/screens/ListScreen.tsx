import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, ShoppingCart, ListChecks, Trash2 } from 'lucide-react'
import { Page, GlassButton } from '../components/Page'
import { Section } from '../components/List'
import { PrimaryButton } from '../components/Controls'
import { ItemRow } from '../components/ItemRow'
import { SwipeRow } from '../components/SwipeRow'
import { ItemSheet } from '../components/ItemSheet'
import { ActionSheet } from '../components/Dialog'
import { useStore } from '../store/store'
import { listEstimate } from '../store/selectors'
import type { ListItem } from '../store/types'
import { groupByCategory, guessCategory } from '../lib/categories'
import { SORT_OPTIONS, sortItems } from '../lib/sort'
import { SortMenu } from '../components/SortMenu'
import { JustAdded } from '../components/JustAdded'
import { usePinThenSettle } from '../lib/fly'
import { formatMoney } from '../lib/money'
import { haptic } from '../lib/util'

export function ListScreen({ onStartShopping, addSignal }: { onStartShopping: () => void; addSignal: number }) {
  const list = useStore((s) => s.list)
  const currency = useStore((s) => s.settings.currency)
  const sort = useStore((s) => s.settings.listSort)
  const updateSettings = useStore((s) => s.updateSettings)
  const shopping = useStore((s) => s.activeTrip != null)
  const { addListItem, updateListItem, removeListItem, clearList, addTripItem } = useStore()

  const [quick, setQuick] = useState('')
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; item: ListItem } | null>(null)
  const [menu, setMenu] = useState(false)
  const quickRef = useRef<HTMLInputElement>(null)
  const { pinnedId, pin } = usePinThenSettle()

  const seenSignal = useRef(addSignal)
  useEffect(() => {
    if (addSignal !== seenSignal.current) {
      seenSignal.current = addSignal
      setSheet({ mode: 'add' })
    }
  }, [addSignal])

  // The list is stored oldest-first; sortItems expects newest-first.
  const sections = useMemo(() => {
    // A just-added item sits in the highlight card until it flies into place.
    const shown = list.filter((i) => i.id !== pinnedId)
    const sorted = sortItems(shown.reverse(), sort, (i) => i.estPrice)
    if (sort === 'category')
      return groupByCategory(sorted).map((g) => ({
        key: g.meta.id,
        header: <span style={{ color: g.meta.color }}>{g.meta.label}</span>,
        items: g.items,
      }))
    const label = SORT_OPTIONS.find((o) => o.value === sort)?.label
    return sorted.length ? [{ key: 'all', header: <span>Sorted by {label}</span>, items: sorted }] : []
  }, [list, sort, pinnedId])
  const pinnedItem = pinnedId ? list.find((i) => i.id === pinnedId) : undefined
  const estimate = listEstimate(list)
  const money = (n: number) => formatMoney(n, currency)

  const listRow = (item: ListItem, interactive = true) => (
    <ItemRow
      rowId={interactive ? item.id : undefined}
      category={item.category}
      name={item.name}
      subtitle={
        [item.qty > 1 && `×${item.qty}`, item.estPrice != null && `est. ${money(item.estPrice)}${item.qty > 1 ? ' each' : ''}`]
          .filter(Boolean)
          .join(' · ') || undefined
      }
      trailing={item.estPrice != null ? <span className="text-label-2">{money(item.estPrice * item.qty)}</span> : undefined}
      onClick={interactive ? () => setSheet({ mode: 'edit', item }) : undefined}
    />
  )

  const quickAdd = () => {
    const name = quick.trim()
    if (!name) return
    haptic()
    const id = addListItem({ name, category: guessCategory(name) ?? 'other', qty: 1 })
    setQuick('')
    pin(id)
  }

  const sendToTrip = () => {
    for (const i of list) addTripItem({ name: i.name, category: i.category, qty: i.qty, price: i.estPrice, inCart: false })
    clearList()
    setMenu(false)
    onStartShopping()
  }

  return (
    <>
      <Page
        title="Shopping List"
        trailing={
          list.length > 0 ? (
            <>
              <SortMenu value={sort} onChange={(listSort) => updateSettings({ listSort })} />
              <GlassButton onClick={() => setMenu(true)} label="Clear list">
                <Trash2 size={20} strokeWidth={2.2} />
              </GlassButton>
            </>
          ) : undefined
        }
      >
        {list.length > 0 && (
          <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
            <Stat label="Items" value={String(list.length)} />
            <Stat label="Estimated" value={estimate > 0 ? money(estimate) : '—'} />
          </div>
        )}

        {/* Reminders-style quick add */}
        <Section footer={list.length === 0 ? 'Type an item and press return. Categories are filled in automatically.' : undefined}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              quickAdd()
            }}
            className="flex h-[52px] items-center gap-3 pl-4"
          >
            <button
              type="button"
              aria-label="Add item"
              onClick={() => (quick.trim() ? quickAdd() : quickRef.current?.focus())}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-blue text-white"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
            <input
              ref={quickRef}
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              placeholder="Add an item"
              enterKeyHint="done"
              autoCapitalize="sentences"
              className="h-full min-w-0 flex-1 bg-transparent pr-4 text-[17px] outline-none placeholder:text-label-3"
            />
          </form>
        </Section>

        {list.length === 0 && (
          <div className="flex flex-col items-center px-10 pt-6 text-center">
            <ListChecks size={48} className="text-label-3" strokeWidth={1.5} />
            <p className="mt-3 text-[20px] font-semibold">Plan before you go</p>
            <p className="mt-1 text-[15px] text-label-2">
              Add what you need and estimated prices. When you start a trip, your list comes with you.
            </p>
          </div>
        )}

        <JustAdded id={pinnedItem ? pinnedItem.id : null}>{pinnedItem && listRow(pinnedItem, false)}</JustAdded>

        {sections.map(({ key, header, items }) => (
          <Section key={key} header={header} className="!mb-5">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout="position"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <SwipeRow itemName={item.name} onDelete={() => removeListItem(item.id)}>
                    {listRow(item)}
                  </SwipeRow>
                </motion.div>
              ))}
            </AnimatePresence>
          </Section>
        ))}

        {list.length > 0 && (
          <div className="mx-4 mt-2">
            <PrimaryButton color="var(--green)" onClick={shopping ? sendToTrip : onStartShopping}>
              <ShoppingCart size={20} strokeWidth={2.4} />
              {shopping ? 'Add List to Current Trip' : 'Start Shopping'}
            </PrimaryButton>
          </div>
        )}
      </Page>

      <ItemSheet
        open={sheet?.mode === 'add'}
        onClose={() => setSheet(null)}
        title="New Item"
        confirmLabel="Add"
        priceLabel="Est. price"
        onSubmit={(v) => {
          const id = addListItem({ name: v.name, category: v.category, qty: v.qty, estPrice: v.price })
          setSheet(null)
          pin(id)
        }}
      />
      <ItemSheet
        open={sheet?.mode === 'edit'}
        onClose={() => setSheet(null)}
        title="Edit Item"
        priceLabel="Est. price"
        initial={sheet?.mode === 'edit' ? { ...sheet.item, price: sheet.item.estPrice } : undefined}
        onSubmit={(v) => {
          if (sheet?.mode === 'edit')
            updateListItem(sheet.item.id, { name: v.name, category: v.category, qty: v.qty, estPrice: v.price })
          setSheet(null)
        }}
        onDelete={() => {
          if (sheet?.mode === 'edit') removeListItem(sheet.item.id)
          setSheet(null)
        }}
      />

      <ActionSheet
        open={menu}
        onDismiss={() => setMenu(false)}
        title="Clear your shopping list?"
        actions={[
          {
            label: `Clear ${list.length} ${list.length === 1 ? 'Item' : 'Items'}`,
            style: 'destructive',
            onPress: () => {
              clearList()
              setMenu(false)
            },
          },
        ]}
      />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-card px-4 py-3">
      <div className="text-[13px] font-medium text-label-2">{label}</div>
      <div className="tabular truncate text-[22px] font-bold">{value}</div>
    </div>
  )
}
