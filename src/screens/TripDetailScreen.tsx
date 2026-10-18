import { useMemo, useState } from 'react'
import { ChevronLeft, RotateCcw, Trash2 } from 'lucide-react'
import { Page, GlassButton } from '../components/Page'
import { Section } from '../components/List'
import { CategoryIcon, ItemRow } from '../components/ItemRow'
import { BudgetRing } from '../components/BudgetRing'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { Alert } from '../components/Dialog'
import { useStore } from '../store/store'
import { budgetLevel, itemCount, levelColor, lineTotal, tripSpent } from '../store/selectors'
import { groupByCategory } from '../lib/categories'
import { formatMoney } from '../lib/money'
import { formatDate } from '../lib/util'

export function TripDetailScreen({
  tripId,
  onBack,
  onShopAgain,
}: {
  tripId: string
  onBack: () => void
  onShopAgain: () => void
}) {
  const trip = useStore((s) => s.history.find((t) => t.id === tripId))
  const currency = useStore((s) => s.settings.currency)
  const { deleteHistoryTrip, addListItem } = useStore()
  const [confirm, setConfirm] = useState<'delete' | 'again' | null>(null)

  const groups = useMemo(() => (trip ? groupByCategory(trip.items) : []), [trip])
  if (!trip) return null

  const money = (n: number) => formatMoney(n, currency)
  const spent = tripSpent(trip)
  const level = budgetLevel(spent, trip.budget)
  const pct = trip.budget > 0 ? spent / trip.budget : 0
  const delta = trip.budget - spent
  const end = trip.finishedAt ?? trip.startedAt
  const minutes = Math.max(1, Math.round((end - trip.startedAt) / 60000))

  const breakdown = groups
    .map((g) => ({ meta: g.meta, total: g.items.reduce((s, i) => s + lineTotal(i), 0) }))
    .sort((a, b) => b.total - a.total)
  const maxCat = Math.max(...breakdown.map((b) => b.total), 1)

  return (
    <>
      <Page
        title={trip.store || 'Grocery run'}
        leading={
          <GlassButton onClick={onBack} label="Back">
            <ChevronLeft size={26} strokeWidth={2.4} className="-ml-0.5" />
          </GlassButton>
        }
      >
        <p className="-mt-2 px-5 pb-5 text-[15px] text-label-2">
          {formatDate(end, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
          {formatDate(trip.startedAt, { hour: 'numeric', minute: '2-digit' })} · {minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} hr`}
        </p>

        <div className="mx-4 mb-8 flex items-center gap-5 rounded-[32px] bg-card p-4">
          <BudgetRing progress={pct} color={levelColor[level]} size={96} stroke={12}>
            <span className="tabular text-[17px] font-bold">{Math.round(pct * 100)}%</span>
          </BudgetRing>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-label-2">Total spent</div>
            <AnimatedNumber countUp value={spent} format={money} className="tabular block truncate text-[28px] leading-[34px] font-bold" />
            <div className="tabular text-[15px] text-label-2">Budget {money(trip.budget)}</div>
            {trip.budget > 0 && (
              <div className={`tabular mt-1 text-[13px] font-semibold ${delta >= 0 ? 'text-green' : 'text-red'}`}>
                {delta >= 0 ? `▼ ${money(delta)} under budget` : `▲ ${money(-delta)} over budget`}
              </div>
            )}
          </div>
        </div>

        {breakdown.length > 1 && (
          <Section header="By category">
            {breakdown.map(({ meta, total }) => (
              <div key={meta.id} className="flex items-center gap-3 pl-4">
                <CategoryIcon category={meta.id} size={28} />
                <div className="row-inner flex min-w-0 flex-1 flex-col gap-1.5 py-2.5 pr-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px]">{meta.label}</span>
                    <span className="tabular text-[15px] text-label-2">
                      {money(total)} · {Math.round((total / Math.max(spent, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-fill">
                    <div className="h-full rounded-full" style={{ width: `${(total / maxCat) * 100}%`, background: meta.color }} />
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section header={`${itemCount(trip.items)} ${itemCount(trip.items) === 1 ? 'item' : 'items'}`}>
          {groups.flatMap(({ items }) =>
            items.map((i) => (
              <ItemRow
                key={i.id}
                category={i.category}
                name={i.name}
                subtitle={i.qty > 1 && i.price != null ? `${i.qty} × ${money(i.price)}` : undefined}
                trailing={money(lineTotal(i))}
              />
            )),
          )}
        </Section>

        <Section>
          <button type="button" onClick={() => setConfirm('again')} className="pressable flex h-11 w-full items-center gap-3 px-4 text-[17px] text-blue">
            <RotateCcw size={20} /> Add Items to Shopping List
          </button>
          <button
            type="button"
            onClick={() => setConfirm('delete')}
            className="pressable row-inner flex h-11 w-full items-center gap-3 px-4 text-[17px] text-red"
          >
            <Trash2 size={20} /> Delete Trip
          </button>
        </Section>
      </Page>

      <Alert
        open={confirm === 'again'}
        title="Shop again?"
        message={`${trip.items.length} items will be added to your shopping list with these prices as estimates.`}
        onDismiss={() => setConfirm(null)}
        actions={[
          { label: 'Cancel', style: 'cancel', onPress: () => setConfirm(null) },
          {
            label: 'Add',
            onPress: () => {
              for (const i of trip.items) addListItem({ name: i.name, category: i.category, qty: i.qty, estPrice: i.price })
              setConfirm(null)
              onShopAgain()
            },
          },
        ]}
      />
      <Alert
        open={confirm === 'delete'}
        title="Delete this trip?"
        message="This can’t be undone."
        onDismiss={() => setConfirm(null)}
        actions={[
          { label: 'Cancel', style: 'cancel', onPress: () => setConfirm(null) },
          {
            label: 'Delete',
            style: 'destructive',
            onPress: () => {
              setConfirm(null)
              onBack()
              deleteHistoryTrip(trip.id)
            },
          },
        ]}
      />
    </>
  )
}
