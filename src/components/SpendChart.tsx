import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
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

  const max = Math.max(...data.flatMap((d) => [d.spent, d.budget]), 1) * 1.1
  const y = (v: number) => H - (v / max) * H
  const heights = data.map((d) => Math.max(2, H - y(d.spent)))

  // Bars rise in a left-to-right wave each time the chart comes into view
  // (tabs stay mounted while hidden), then tween to new values while visible.
  const chart = useRef<HTMLDivElement>(null)
  const visible = useRef(false)
  const heightsRef = useRef(heights)
  heightsRef.current = heights

  const hasData = data.length > 0
  useEffect(() => {
    const el = chart.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible.current && !prefersReducedMotion()) {
        gsap.fromTo(
          el.querySelectorAll('[data-bar]'),
          { height: 0 },
          { height: (i: number) => heightsRef.current[i], duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)', overwrite: true },
        )
      }
      visible.current = entry.isIntersecting
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasData])

  useGSAP(
    () => {
      const bars = gsap.utils.toArray<HTMLElement>('[data-bar]')
      if (prefersReducedMotion()) return bars.forEach((b, i) => void gsap.set(b, { height: heights[i] }))
      // Visible: glide to the new values. Hidden: wait at 0 for the next wave.
      if (visible.current) bars.forEach((b, i) => void gsap.to(b, { height: heights[i], duration: 0.5, overwrite: true }))
      else gsap.set(bars, { height: 0 })
    },
    { scope: chart, dependencies: [heights.join(',')] },
  )

  if (data.length === 0) return null
  const sel = data.find((d) => d.id === selected) ?? data.at(-1)!

  return (
    <div ref={chart} className="px-4 pt-3 pb-3">
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
                <span
                  data-bar
                  className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-blue transition-opacity duration-200"
                  style={{ opacity: active ? 1 : 0.45 }}
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
