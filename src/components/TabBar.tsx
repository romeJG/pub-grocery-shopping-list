import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ShoppingCart, ListChecks, ChartColumn, Settings, Plus } from 'lucide-react'
import { useStore } from '../store/store'
import { haptic } from '../lib/util'
import { TABBAR_MINIMIZE_EVENT } from './Page'
import { pop } from '../lib/gsap'

export type Tab = 'trip' | 'list' | 'history' | 'settings'

const TABS = [
  { id: 'trip', label: 'Shop', icon: ShoppingCart },
  { id: 'list', label: 'List', icon: ListChecks },
  { id: 'history', label: 'History', icon: ChartColumn },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

const spring = { type: 'spring', damping: 30, stiffness: 380, mass: 0.8 } as const

/**
 * iOS 26 floating Liquid Glass tab bar. A glass "lens" slides to the active
 * tab; scrolling down minimizes it to the current tab, and an optional
 * accessory button floats beside it.
 */
export function TabBar({
  tab,
  onChange,
  accessory,
}: {
  tab: Tab
  onChange: (t: Tab) => void
  accessory?: { label: string; onPress: () => void }
}) {
  const listCount = useStore((s) => s.list.length)
  const shopping = useStore((s) => s.activeTrip != null)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    const onMin = (e: Event) => setMinimized((e as CustomEvent<boolean>).detail)
    window.addEventListener(TABBAR_MINIMIZE_EVENT, onMin)
    return () => window.removeEventListener(TABBAR_MINIMIZE_EVENT, onMin)
  }, [])
  useEffect(() => setMinimized(false), [tab])

  const visible = minimized ? TABS.filter((t) => t.id === tab) : TABS

  // Keep the accessory mounted and animate its size, so the tab bar grows and
  // shrinks in step with it instead of snapping when it's added or removed.
  const lastAccessory = useRef(accessory)
  if (accessory) lastAccessory.current = accessory
  const acc = accessory ?? lastAccessory.current
  const shown = accessory != null

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="mx-auto flex max-w-xl items-end px-5">
        <div
          className="glass pointer-events-auto relative flex h-[62px] min-w-0 overflow-hidden rounded-full p-1 transition-[flex-grow,flex-basis] duration-500 ease-[cubic-bezier(0.32,1.25,0.6,1)]"
          style={{ flexGrow: minimized ? 0 : 1, flexBasis: minimized ? 62 : 0 }}
        >
          {visible.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            const badge = id === 'list' && listCount > 0 ? listCount : null
            const dot = id === 'trip' && shopping
            return (
              <button
                key={id}
                type="button"
                onClick={(e) => {
                  if (minimized) return setMinimized(false)
                  if (!active) haptic(5)
                  pop(e.currentTarget.querySelector('[data-tab-icon]'), 0.72)
                  onChange(id)
                }}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className="relative z-[2] flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full"
              >
                {active && !minimized && (
                  <motion.span
                    layoutId="tab-lens"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-[var(--glass-lens)]"
                  />
                )}
                <span data-tab-icon className={`relative transition-colors ${active ? 'text-blue' : 'text-label'}`}>
                  <Icon size={24} strokeWidth={active ? 2.3 : 1.9} />
                  {badge != null && (
                    <span className="absolute -top-1 -right-2.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red px-1 text-[11px] leading-none font-semibold text-white">
                      {badge}
                    </span>
                  )}
                  {dot && <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-green ring-2 ring-[var(--glass-strong)]" />}
                </span>
                {!minimized && (
                  <span className={`text-[10px] font-semibold tracking-[0.1px] ${active ? 'text-blue' : 'text-label'}`}>{label}</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label={acc?.label}
          aria-hidden={!shown}
          tabIndex={shown ? 0 : -1}
          disabled={!shown}
          onClick={() => {
            haptic(8)
            acc?.onPress()
          }}
          style={{
            flexGrow: shown && minimized ? 1 : 0,
            flexBasis: shown && !minimized ? 62 : 0,
            minWidth: shown ? 62 : 0,
            marginLeft: shown ? 12 : 0,
            opacity: shown ? 1 : 0,
            scale: shown ? 1 : 0.6,
          }}
          className={`glass-tint group relative flex h-[62px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-semibold transition-[flex-grow,flex-basis,min-width,margin,opacity,scale] duration-500 ease-[cubic-bezier(0.32,1.25,0.6,1)] ${
            shown ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <span className="relative z-[2] flex items-center gap-2 transition-transform duration-200 group-active:scale-90">
            <Plus size={26} strokeWidth={2.6} />
            {minimized && <span className="whitespace-nowrap">{acc?.label}</span>}
          </span>
        </button>
      </div>
    </nav>
  )
}
