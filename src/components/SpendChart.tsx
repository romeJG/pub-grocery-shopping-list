import { useState } from 'react'
import { motion } from 'motion/react'
import type { Trip } from '../store/types'
import { tripSpent } from '../store/selectors'
import { formatMoney } from '../lib/money'
import { formatDate } from '../lib/util'

const H = 150
const GAP = 10

/**
 * Spend per trip (single series, one hue) with each trip's budget as a
 * recessive tick. Tap a bar for details.
 */
export function SpendChart({ trips, currency }: { trips: Trip[]; currency: string }) {
  const data = trips
    .slice(0, 8)
    .reverse()
    .map((t) => ({ id: t.id, date: t.finishedAt ?? t.startedAt, spent: tripSpent(t), budget: t.budget }))
  const [selected, setSelected] = useState<string | null>(data.at(-1)?.id ?? null)

  if (data.length === 0) return null
  const max = Math.max(...data.flatMap((d) => [d.spent, d.budget]), 1) * 1.1
  const sel = data.find((d) => d.id === selected) ?? data.at(-1)!
  const y = (v: number) => H - (v / max) * H

  return (
    <div className="px-4 pt-3 pb-3">
      <div className="mb-3 min-h-[48px]">
        <div className="text-[13px] font-medium text-label-2">{formatDate(sel.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div className="tabular text-[22px] font-bold">
          {formatMoney(sel.spent, currency)}
          <span className="ml-1.5 text-[15px] font-normal text-label-2">of {formatMoney(sel.budget, currency)}</span>
        </div>
      </div>

      <div className="relative" style={{ height: H }}>
        {/* recessive gridlines */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-separator" style={{ top: H * f }} />
        ))}
        <div className="absolute inset-0 flex items-end" style={{ gap: GAP }}>
          {data.map((d) => {
            const active = d.id === sel.id
            return (
              <button
                key={d.id}
                type="button"
                aria-label={`${formatDate(d.date)}: spent ${formatMoney(d.spent, currency)} of ${formatMoney(d.budget, currency)}`}
                onClick={() => setSelected(d.id)}
                onPointerEnter={() => setSelected(d.id)}
                className="relative h-full flex-1"
              >
                {d.budget > 0 && (
                  <span
                    className="absolute inset-x-0 h-[2px] rounded-full bg-label-2"
                    style={{ top: y(d.budget) - 1, opacity: active ? 0.9 : 0.35 }}
                  />
                )}
                <motion.span
                  className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-blue"
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(2, H - y(d.spent)), opacity: active ? 1 : 0.45 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 160 }}
                />
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex" style={{ gap: GAP }}>
        {data.map((d) => (
          <span key={d.id} className={`flex-1 truncate text-center text-[11px] ${d.id === sel.id ? 'font-semibold' : 'text-label-2'}`}>
            {formatDate(d.date, { month: 'numeric', day: 'numeric' })}
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[12px] text-label-2">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-blue" /> Spent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[2px] w-3 rounded-full bg-label-2" /> Budget
        </span>
      </div>
    </div>
  )
}
