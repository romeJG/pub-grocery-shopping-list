import { useMemo } from 'react'
import { ChartColumn, ChevronRight } from 'lucide-react'
import { Page } from '../components/Page'
import { Section } from '../components/List'
import { SpendChart } from '../components/SpendChart'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { useStore } from '../store/store'
import { monthTotal, tripSpent } from '../store/selectors'
import type { Trip } from '../store/types'
import { formatMoney } from '../lib/money'
import { formatDate, formatRelativeDay } from '../lib/util'

export function HistoryScreen({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const unsorted = useStore((s) => s.history)
  const history = useMemo(
    () => [...unsorted].sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt)),
    [unsorted],
  )
  const currency = useStore((s) => s.settings.currency)
  const money = (n: number) => formatMoney(n, currency)

  const now = new Date()
  const thisMonth = monthTotal(history, now)
  const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = monthTotal(history, lastMonthRef)
  const monthTrips = history.filter((t) => {
    const d = new Date(t.finishedAt ?? t.startedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const byMonth = useMemo(() => {
    const groups: { key: string; label: string; trips: Trip[]; total: number }[] = []
    for (const t of history) {
      const d = new Date(t.finishedAt ?? t.startedAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      let g = groups.at(-1)
      if (!g || g.key !== key) {
        g = { key, label: formatDate(d.getTime(), { month: 'long', year: 'numeric' }), trips: [], total: 0 }
        groups.push(g)
      }
      g.trips.push(t)
      g.total += tripSpent(t)
    }
    return groups
  }, [history])

  if (history.length === 0) {
    return (
      <Page title="History">
        <div className="flex flex-col items-center px-10 pt-24 text-center">
          <ChartColumn size={48} className="text-label-3" strokeWidth={1.5} />
          <p className="mt-3 text-[20px] font-semibold">No trips yet</p>
          <p className="mt-1 text-[15px] text-label-2">Finished trips show up here with your spending over time.</p>
        </div>
      </Page>
    )
  }

  const diff = thisMonth - lastMonth

  return (
    <Page title="History">
      <div className="mx-4 mb-8 rounded-[32px] bg-card p-5">
        <div className="text-[15px] font-semibold text-label-2">Spent this month</div>
        <AnimatedNumber value={thisMonth} format={money} className="tabular block text-[34px] leading-[41px] font-bold tracking-tight" />
        <div className="mt-0.5 text-[15px] text-label-2">
          {monthTrips} {monthTrips === 1 ? 'trip' : 'trips'}
          {lastMonth > 0 && (
            <>
              {' · '}
              {money(Math.abs(diff))} {diff >= 0 ? 'more' : 'less'} than last month
            </>
          )}
        </div>
      </div>

      <Section header={`Last ${Math.min(history.length, 8)} trips`}>
        <SpendChart trips={history} currency={currency} />
      </Section>

      {byMonth.map((g) => (
        <Section
          key={g.key}
          header={
            <>
              <span>{g.label}</span>
              <span className="tabular normal-case">{money(g.total)}</span>
            </>
          }
        >
          {g.trips.map((t) => {
            const spent = tripSpent(t)
            const delta = t.budget - spent
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpenTrip(t.id)}
                className="pressable flex w-full items-center pl-4 text-left"
              >
                <div className="row-inner flex min-h-[60px] min-w-0 flex-1 items-center gap-2 py-2 pr-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[17px]">{t.store || 'Grocery run'}</div>
                    <div className="text-[13px] text-label-2">
                      {formatRelativeDay(t.finishedAt ?? t.startedAt)} · {t.items.length}{' '}
                      {t.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-[17px] font-medium">{money(spent)}</div>
                    {t.budget > 0 && (
                      <div className={`tabular text-[12px] font-medium ${delta >= 0 ? 'text-green' : 'text-red'}`}>
                        {delta >= 0 ? '▼ ' : '▲ '}
                        {money(Math.abs(delta))} {delta >= 0 ? 'under' : 'over'}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-label-3" strokeWidth={2.5} />
                </div>
              </button>
            )
          })}
        </Section>
      ))}
    </Page>
  )
}
