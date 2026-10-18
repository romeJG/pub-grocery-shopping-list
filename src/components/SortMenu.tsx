import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpDown, Check } from 'lucide-react'
import { GlassButton } from './Page'
import { SORT_OPTIONS } from '../lib/sort'
import { haptic } from '../lib/util'
import type { SortMode } from '../store/types'

/**
 * Sort button + iOS 26 pull-down menu: a glass panel that grows out of the
 * button it was opened from, with a checkmark on the current choice.
 */
export function SortMenu({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useLayoutEffect(() => {
    if (!open || !anchor.current) return
    const r = anchor.current.getBoundingClientRect()
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [open])

  const pick = (v: SortMode) => {
    haptic(6)
    onChange(v)
    setOpen(false)
  }

  return (
    <>
      <div ref={anchor}>
        <GlassButton onClick={() => setOpen(true)} label="Sort" tint={value !== 'category' ? 'var(--blue)' : undefined}>
          <ArrowUpDown size={20} strokeWidth={2.3} />
        </GlassButton>
      </div>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[55]" role="menu" aria-label="Sort by">
              <motion.div
                className="absolute inset-0 bg-black/10 dark:bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="glass-strong absolute w-[250px] overflow-hidden rounded-[26px] py-1.5"
                style={{ top: pos.top, right: pos.right, transformOrigin: 'top right' }}
                initial={{ opacity: 0, scale: 0.3, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                transition={{ type: 'spring', damping: 26, stiffness: 420, mass: 0.7 }}
              >
                <div className="relative z-[2]">
                  <div className="px-5 pt-2 pb-1.5 text-[13px] font-semibold text-label-2">Sort By</div>
                  {SORT_OPTIONS.map(({ value: v, label, icon: Icon }) => (
                    <button
                      key={v}
                      type="button"
                      role="menuitemradio"
                      aria-checked={v === value}
                      onClick={() => pick(v)}
                      className="pressable flex h-11 w-full items-center gap-3 px-5 text-left text-[17px]"
                    >
                      <span className="flex w-4 justify-center text-blue">
                        {v === value && <Check size={17} strokeWidth={3} />}
                      </span>
                      <span className="flex-1">{label}</span>
                      <Icon size={19} strokeWidth={2} className="text-label-2" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
