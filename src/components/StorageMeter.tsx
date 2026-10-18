import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Section, IconBadge } from './List'
import { STORAGE_KEY, useStore } from '../store/store'
import { byteSize, formatBytes, isPersisted, QUOTA_BYTES, requestPersistence } from '../lib/storage'
import { haptic } from '../lib/util'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone Storage–style meter for the app's data, plus eviction protection status. */
export function StorageMeter() {
  const history = useStore((s) => s.history)
  const list = useStore((s) => s.list)
  const activeTrip = useStore((s) => s.activeTrip)
  // Subscribe to settings too so the total refreshes on every save.
  useStore((s) => s.settings)

  const [persisted, setPersisted] = useState<boolean | null | undefined>(undefined)
  useEffect(() => {
    void isPersisted().then(setPersisted)
  }, [])

  // The store writes synchronously, so this is what's on disk right now.
  const total = ((localStorage.getItem(STORAGE_KEY)?.length ?? 0) + STORAGE_KEY.length) * 2
  const pct = total / QUOTA_BYTES
  const parts = [
    {
      key: 'trip',
      label: 'Current trip',
      detail: activeTrip ? `${activeTrip.items.length} ${activeTrip.items.length === 1 ? 'item' : 'items'}` : 'None',
      bytes: byteSize(activeTrip),
      color: 'var(--meter-trip)',
    },
    {
      key: 'history',
      label: 'Trip history',
      detail: `${history.length} ${history.length === 1 ? 'trip' : 'trips'}`,
      bytes: byteSize(history),
      color: 'var(--meter-history)',
    },
    {
      key: 'list',
      label: 'Shopping list',
      detail: `${list.length} ${list.length === 1 ? 'item' : 'items'}`,
      bytes: byteSize(list),
      color: 'var(--meter-list)',
    },
  ]

  const protect = async () => {
    haptic()
    setPersisted(await requestPersistence())
  }

  const low = pct >= 0.8
  const footer = low ? (
    <span className="text-orange">
      Storage is {pct >= 0.95 ? 'almost full' : 'running low'}. Export a backup, then delete old trips in History.
    </span>
  ) : persisted ? (
    'Your data won’t be cleared when this device runs low on space. Export a backup now and then to be safe.'
  ) : isStandalone() ? (
    'This browser hasn’t granted protection yet; it decides automatically based on how often you use the app. Export a backup now and then to be safe.'
  ) : (
    'Your data could be cleared if this device runs low on space, or after 7 days unused in Safari. On iPhone, add the app to your Home Screen to protect it.'
  )

  return (
    <Section header="Storage" footer={footer}>
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="tabular text-[22px] font-bold">
            {formatBytes(total)}
            <span className="ml-1.5 text-[15px] font-normal text-label-2">of ~{formatBytes(QUOTA_BYTES)}</span>
          </div>
          <div className={`tabular text-[13px] font-semibold ${low ? 'text-orange' : 'text-label-2'}`}>
            {pct < 0.001 ? '<0.1' : (pct * 100).toFixed(pct < 0.1 ? 1 : 0)}% used
          </div>
        </div>

        {/* Stacked bar against the full quota; tiny segments keep a visible minimum. */}
        <div
          className="mt-2.5 flex h-3 gap-[2px] overflow-hidden rounded-full bg-fill"
          role="img"
          aria-label={`${formatBytes(total)} of about ${formatBytes(QUOTA_BYTES)} used`}
        >
          {parts
            .filter((p) => p.bytes > 0)
            .map((p) => (
              <div
                key={p.key}
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `max(6px, ${(p.bytes / QUOTA_BYTES) * 100}%)`, background: p.color }}
              />
            ))}
        </div>

        <ul className="mt-3 space-y-1.5">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center gap-2 text-[15px]">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
              <span>{p.label}</span>
              <span className="text-label-2">· {p.detail}</span>
              <span className="tabular ml-auto text-label-2">{formatBytes(p.bytes)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-h-[52px] items-center gap-3 pl-4">
        <IconBadge icon={ShieldCheck} color={persisted ? '#34C759' : '#8E8E93'} />
        <div className="row-inner flex min-h-[52px] flex-1 items-center justify-between gap-3 pr-4">
          <span className="text-[17px]">Protected from cleanup</span>
          {persisted === undefined ? null : persisted ? (
            <span className="text-[17px] text-label-2">On</span>
          ) : persisted === null ? (
            <span className="text-[17px] text-label-2">Not available</span>
          ) : (
            <button
              type="button"
              onClick={protect}
              className="press-glass h-8 rounded-full bg-fill px-3.5 text-[15px] font-semibold text-blue"
            >
              Turn On
            </button>
          )}
        </div>
      </div>
    </Section>
  )
}
