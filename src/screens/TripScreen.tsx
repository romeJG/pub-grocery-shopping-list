import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Ellipsis, ShoppingCart, Store as StoreIcon, ChevronRight } from 'lucide-react'
import { Page, GlassButton } from '../components/Page'
import { Section } from '../components/List'
import { PrimaryButton, SecondaryButton, Toggle } from '../components/Controls'
import { BudgetRing } from '../components/BudgetRing'
import { ItemRow } from '../components/ItemRow'
import { SwipeRow } from '../components/SwipeRow'
import { ItemSheet } from '../components/ItemSheet'
import { BottomSheet } from '../components/BottomSheet'
import { Alert } from '../components/Dialog'
import { useStore } from '../store/store'
import {
  budgetLevel,
  itemCount,
  levelColor,
  lineTotal,
  listEstimate,
  tripPlannedRemaining,
  tripSpent,
} from '../store/selectors'
import type { Item, Trip } from '../store/types'
import { groupByCategory } from '../lib/categories'
import { SORT_OPTIONS, sortItems } from '../lib/sort'
import { SortMenu } from '../components/SortMenu'
import { JustAdded } from '../components/JustAdded'
import { usePinThenSettle } from '../lib/fly'
import { currencySymbol, formatMoney, parseAmount } from '../lib/money'
import { formatRelativeDay, haptic } from '../lib/util'

export function TripScreen({
  onFinished,
  onOpenTrip,
  addSignal,
}: {
  onFinished: (id: string) => void
  onOpenTrip: (id: string) => void
  addSignal: number
}) {
  const trip = useStore((s) => s.activeTrip)
  return trip ? (
    <ActiveTrip trip={trip} onFinished={onFinished} addSignal={addSignal} />
  ) : (
    <StartTrip onOpenTrip={onOpenTrip} />
  )
}

/* ───────────────────────── Start ───────────────────────── */

function StartTrip({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const { currency, defaultBudget } = useStore((s) => s.settings)
  const list = useStore((s) => s.list)
  const lastTrip = useStore((s) => s.history[0])
  const startTrip = useStore((s) => s.startTrip)

  const [budget, setBudget] = useState(defaultBudget ? String(defaultBudget) : '')
  const [store, setStore] = useState('')
  const [includeList, setIncludeList] = useState(true)

  const estimate = listEstimate(list)
  const parsedBudget = parseAmount(budget) ?? 0

  const start = () => {
    haptic(15)
    startTrip({ budget: parsedBudget, store, includeList: includeList && list.length > 0 })
  }

  return (
    <Page title="Shop">
      <div className="flex flex-col items-center px-8 pt-2 pb-7 text-center">
        <div className="mb-3 flex size-[72px] items-center justify-center rounded-[22px] bg-gradient-to-b from-[#4CD964] to-[#28A745] text-white shadow-[0_8px_24px_rgba(52,199,89,0.35)]">
          <ShoppingCart size={36} strokeWidth={2.2} />
        </div>
        <h2 className="text-[22px] font-bold tracking-[0.35px]">Ready to shop?</h2>
        <p className="mt-1 text-[15px] text-label-2">Set a budget, then add items as they go in your cart.</p>
      </div>

      <Section header="Budget for this trip">
        <label className="flex h-16 items-center gap-1 px-4">
          <span className="text-[28px] font-semibold text-label-2">{currencySymbol(currency)}</span>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            placeholder="0"
            aria-label="Budget"
            className="tabular h-full min-w-0 flex-1 bg-transparent text-[28px] font-semibold outline-none placeholder:text-label-3"
          />
        </label>
        <label className="row-inner ml-4 flex h-11 items-center gap-3 pr-4 shadow-[inset_0_0.5px_0_var(--separator)]">
          <StoreIcon size={20} className="text-label-2" />
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Store (optional)"
            autoCapitalize="words"
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-3"
          />
        </label>
      </Section>

      {list.length > 0 && (
        <Section
          footer={
            includeList && parsedBudget > 0 && estimate > parsedBudget ? (
              <span className="text-orange">
                Your list is estimated at {formatMoney(estimate, currency)}, which is over this budget.
              </span>
            ) : (
              'Items from your list show up as “To Get” so you can tick them off.'
            )
          }
        >
          <div className="flex min-h-[58px] items-center gap-3 px-4 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[17px]">Use my shopping list</div>
              <div className="text-[13px] text-label-2">
                {list.length} {list.length === 1 ? 'item' : 'items'}
                {estimate > 0 && ` · est. ${formatMoney(estimate, currency)}`}
              </div>
            </div>
            <Toggle checked={includeList} onChange={setIncludeList} label="Use my shopping list" />
          </div>
        </Section>
      )}

      <div className="mx-4 mb-8">
        <PrimaryButton onClick={start} color="var(--green)">
          <ShoppingCart size={20} strokeWidth={2.4} /> Start Shopping
        </PrimaryButton>
      </div>

      {lastTrip && (
        <Section header="Last trip">
          <button type="button" onClick={() => onOpenTrip(lastTrip.id)} className="pressable flex w-full items-center gap-3 px-4 py-3 text-left">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px]">{lastTrip.store || 'Grocery run'}</div>
              <div className="text-[13px] text-label-2">{formatRelativeDay(lastTrip.finishedAt ?? lastTrip.startedAt)}</div>
            </div>
            <div className="tabular text-[17px] font-medium">{formatMoney(tripSpent(lastTrip), currency)}</div>
            <ChevronRight className="size-5 text-label-3" strokeWidth={2.5} />
          </button>
        </Section>
      )}
    </Page>
  )
}

/* ───────────────────────── Active ───────────────────────── */

type SheetState = { mode: 'add' } | { mode: 'price'; item: Item } | { mode: 'edit'; item: Item } | null

function ActiveTrip({ trip, onFinished, addSignal }: { trip: Trip; onFinished: (id: string) => void; addSignal: number }) {
  const currency = useStore((s) => s.settings.currency)
  const { addTripItem, updateTripItem, removeTripItem, moveToCart, finishTrip, cancelTrip, updateTrip } = useStore()

  const [sheet, setSheet] = useState<SheetState>(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [confirm, setConfirm] = useState<'finish' | 'cancel' | null>(null)
  const { pinnedId, pin, move } = usePinThenSettle()

  // The tab bar's "+" accessory asks us to open the add sheet.
  const seenSignal = useRef(addSignal)
  useEffect(() => {
    if (addSignal !== seenSignal.current) {
      seenSignal.current = addSignal
      setSheet({ mode: 'add' })
    }
  }, [addSignal])

  const sort = useStore((s) => s.settings.tripSort)
  const updateSettings = useStore((s) => s.updateSettings)

  // Trip items are kept newest-first, which is what sortItems expects.
  const toGet = useMemo(() => sortItems(trip.items.filter((i) => !i.inCart), sort, (i) => i.price), [trip.items, sort])
  const inCart = useMemo(() => sortItems(trip.items.filter((i) => i.inCart), sort, (i) => i.price), [trip.items, sort])
  // A just-added item sits in the highlight card until it flies into the list.
  const inCartShown = useMemo(() => inCart.filter((i) => i.id !== pinnedId), [inCart, pinnedId])
  const pinnedItem = pinnedId ? trip.items.find((i) => i.id === pinnedId) : undefined
  const toGetSections = useMemo(() => {
    if (sort === 'category')
      return groupByCategory(toGet).map((g) => ({
        key: g.meta.id,
        header: <span style={{ color: g.meta.color }}>{g.meta.label}</span>,
        items: g.items,
      }))
    const label = SORT_OPTIONS.find((o) => o.value === sort)?.label
    return toGet.length ? [{ key: 'all', header: <span>Sorted by {label}</span>, items: toGet }] : []
  }, [toGet, sort])

  const spent = tripSpent(trip)
  const planned = tripPlannedRemaining(trip)
  const remaining = trip.budget - spent
  const level = budgetLevel(spent, trip.budget)
  const color = levelColor[level]
  const pct = trip.budget > 0 ? spent / trip.budget : 0
  const money = (n: number) => formatMoney(n, currency)

  const check = (item: Item) => {
    haptic(10)
    if (item.inCart) return move(item.id, () => updateTripItem(item.id, { inCart: false }))
    if (item.price == null) return setSheet({ mode: 'price', item })
    move(item.id, () => moveToCart(item.id))
  }

  const cartRow = (item: Item, interactive = true) => (
    <ItemRow
      rowId={interactive ? item.id : undefined}
      category={item.category}
      name={item.name}
      subtitle={item.qty > 1 && item.price != null ? `${item.qty} × ${money(item.price)}` : item.price == null ? 'No price' : undefined}
      trailing={money(lineTotal(item))}
      check={{ checked: true, onToggle: () => check(item) }}
      onClick={interactive ? () => setSheet({ mode: 'edit', item }) : undefined}
    />
  )

  const doFinish = () => {
    const id = trip.id
    haptic(20)
    finishTrip()
    setConfirm(null)
    onFinished(id)
  }

  return (
    <>
      <Page
        title={trip.store || 'Shopping'}
        trailing={
          <>
            <SortMenu value={sort} onChange={(tripSort) => updateSettings({ tripSort })} />
            <GlassButton onClick={() => setBudgetOpen(true)} label="Trip options">
              <Ellipsis size={22} strokeWidth={2.4} />
            </GlassButton>
          </>
        }
      >
        {/* Budget hero */}
        <div className="mx-4 mb-8">
          <button
            type="button"
            onClick={() => setBudgetOpen(true)}
            className="press-glass flex w-full items-center gap-5 rounded-[32px] bg-card p-4 text-left"
          >
            <BudgetRing progress={pct} color={color} size={116} stroke={14}>
              <span className="tabular text-[22px] font-bold" style={{ color }}>
                {Math.round(pct * 100)}%
              </span>
              <span className="text-[12px] font-semibold text-label-2">used</span>
            </BudgetRing>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-label-2">{remaining >= 0 ? 'Left to spend' : 'Over budget'}</div>
              <motion.div
                key={Math.round(remaining * 100)}
                initial={{ opacity: 0.4, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="tabular truncate text-[30px] leading-9 font-bold tracking-tight"
                style={{ color }}
              >
                {money(Math.abs(remaining))}
              </motion.div>
              <div className="tabular mt-0.5 text-[15px] text-label-2">
                {money(spent)} of {money(trip.budget)}
              </div>
              {planned > 0 && (
                <div
                  className="tabular mt-2 inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold"
                  style={{
                    color: spent + planned > trip.budget ? 'var(--orange)' : 'var(--label-2)',
                    background: 'var(--fill)',
                  }}
                >
                  Projected {money(spent + planned)}
                </div>
              )}
            </div>
          </button>
        </div>

        <JustAdded id={pinnedItem ? pinnedItem.id : null}>{pinnedItem && cartRow(pinnedItem, false)}</JustAdded>

        {trip.items.length === 0 && (
          <div className="px-10 pt-6 pb-10 text-center">
            <p className="text-[17px] font-semibold">Your cart is empty</p>
            <p className="mt-1 text-[15px] text-label-2">Tap + when you put something in your cart.</p>
          </div>
        )}

        {toGetSections.length > 0 && (
          <>
            <h3 className="px-5 pb-2 text-[22px] font-bold tracking-[0.35px]">
              To Get <span className="font-normal text-label-2">{toGet.length}</span>
            </h3>
            {toGetSections.map(({ key, header, items }) => (
              <Section key={key} header={header} className="!mb-5">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <Collapse key={item.id}>
                      <SwipeRow onDelete={() => removeTripItem(item.id)}>
                        <ItemRow
                          rowId={item.id}
                          category={item.category}
                          name={item.name}
                          subtitle={
                            [item.qty > 1 && `×${item.qty}`, item.price != null && `est. ${money(lineTotal(item))}`]
                              .filter(Boolean)
                              .join(' · ') || 'Tap to price'
                          }
                          check={{ checked: false, onToggle: () => check(item) }}
                          onClick={() => setSheet({ mode: 'price', item })}
                        />
                      </SwipeRow>
                    </Collapse>
                  ))}
                </AnimatePresence>
              </Section>
            ))}
            <div className="h-3" />
          </>
        )}

        {inCartShown.length > 0 && (
          <Section
            header={
              <>
                <span>In Cart · {itemCount(inCart)} {itemCount(inCart) === 1 ? 'item' : 'items'}</span>
                <span className="tabular normal-case">{money(spent)}</span>
              </>
            }
          >
            <AnimatePresence initial={false}>
              {inCartShown.map((item) => (
                <Collapse key={item.id}>
                  <SwipeRow onDelete={() => removeTripItem(item.id)}>{cartRow(item)}</SwipeRow>
                </Collapse>
              ))}
            </AnimatePresence>
          </Section>
        )}

        {trip.items.length > 0 && (
          <div className="mx-4 mb-4">
            <SecondaryButton onClick={() => setConfirm('finish')}>Finish Trip</SecondaryButton>
          </div>
        )}
      </Page>

      <ItemSheet
        open={sheet?.mode === 'add'}
        onClose={() => setSheet(null)}
        title="Add to Cart"
        confirmLabel="Add"
        primaryLabel="Add to Cart"
        onSubmit={(v) => {
          haptic(12)
          const id = addTripItem({ ...v, inCart: true })
          setSheet(null)
          pin(id)
        }}
      />
      <ItemSheet
        open={sheet?.mode === 'price'}
        onClose={() => setSheet(null)}
        title="Add to Cart"
        confirmLabel="Add"
        primaryLabel="Add to Cart"
        focusPrice
        initial={sheet?.mode === 'price' ? sheet.item : undefined}
        onSubmit={(v) => {
          if (sheet?.mode !== 'price') return
          haptic(12)
          moveToCart(sheet.item.id, v)
          setSheet(null)
          pin(sheet.item.id)
        }}
        onDelete={() => {
          if (sheet?.mode === 'price') removeTripItem(sheet.item.id)
          setSheet(null)
        }}
        deleteLabel="Remove from Trip"
      />
      <ItemSheet
        open={sheet?.mode === 'edit'}
        onClose={() => setSheet(null)}
        title="Edit Item"
        initial={sheet?.mode === 'edit' ? sheet.item : undefined}
        onSubmit={(v) => {
          if (sheet?.mode === 'edit') updateTripItem(sheet.item.id, v)
          setSheet(null)
        }}
        onDelete={() => {
          if (sheet?.mode === 'edit') removeTripItem(sheet.item.id)
          setSheet(null)
        }}
      />

      <TripSettingsSheet
        open={budgetOpen}
        trip={trip}
        onClose={() => setBudgetOpen(false)}
        onSave={(patch) => {
          updateTrip(patch)
          setBudgetOpen(false)
        }}
        onCancelTrip={() => {
          setBudgetOpen(false)
          setConfirm('cancel')
        }}
      />

      <Alert
        open={confirm === 'finish'}
        title="Finish this trip?"
        message={
          <>
            You spent {money(spent)} of your {money(trip.budget)} budget.
            {toGet.length > 0 && ` ${toGet.length} unchecked ${toGet.length === 1 ? 'item goes' : 'items go'} back to your list.`}
          </>
        }
        onDismiss={() => setConfirm(null)}
        actions={[
          { label: 'Not Yet', style: 'cancel', onPress: () => setConfirm(null) },
          { label: 'Finish', onPress: doFinish },
        ]}
      />
      <Alert
        open={confirm === 'cancel'}
        title="Cancel this trip?"
        message="It won’t be saved to history. All items will go back to your shopping list."
        onDismiss={() => setConfirm(null)}
        actions={[
          { label: 'Keep Shopping', style: 'cancel', onPress: () => setConfirm(null) },
          {
            label: 'Cancel Trip',
            style: 'destructive',
            onPress: () => {
              cancelTrip()
              setConfirm(null)
            },
          },
        ]}
      />
    </>
  )
}

function Collapse({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout="position"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

function TripSettingsSheet({
  open,
  trip,
  onClose,
  onSave,
  onCancelTrip,
}: {
  open: boolean
  trip: Trip
  onClose: () => void
  onSave: (patch: { budget: number; store?: string }) => void
  onCancelTrip: () => void
}) {
  const currency = useStore((s) => s.settings.currency)
  const [budget, setBudget] = useState('')
  const [store, setStore] = useState('')
  const [lastOpen, setLastOpen] = useState(false)

  // Re-seed fields whenever the sheet opens.
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setBudget(String(trip.budget))
      setStore(trip.store ?? '')
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Trip"
      confirmLabel="Save"
      onConfirm={() => onSave({ budget: parseAmount(budget) ?? 0, store: store.trim() || undefined })}
    >
      <div className="px-4 pt-2">
        <div className="overflow-hidden rounded-[26px] bg-card">
          <label className="flex h-[50px] items-center pr-4 pl-4">
            <span className="w-24 shrink-0 text-[17px]">Budget</span>
            <span className="text-label-2">{currencySymbol(currency)}</span>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              className="tabular h-full min-w-0 flex-1 bg-transparent pl-1 text-[17px] outline-none"
            />
          </label>
          <label className="hairline-t ml-4 flex h-[50px] items-center pr-4">
            <span className="w-24 shrink-0 text-[17px]">Store</span>
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Optional"
              autoCapitalize="words"
              className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-3"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onCancelTrip}
          className="press-glass mt-6 h-[54px] w-full rounded-full bg-card text-[17px] font-semibold text-red"
        >
          Cancel Trip
        </button>
      </div>
    </BottomSheet>
  )
}
