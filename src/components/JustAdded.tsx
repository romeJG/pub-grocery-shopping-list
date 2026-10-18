import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/**
 * Highlighted card at the top of a list that holds a just-added item for a
 * moment before it flies into place (see usePinThenSettle).
 */
export function JustAdded({ id, children }: { id: string | null; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {id && (
        <motion.div
          key={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          // Hide instantly (the flying ghost takes over) and close the gap smoothly.
          exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.45, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0 } } }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="overflow-hidden"
        >
          <div className="px-4 pt-1 pb-6">
            <motion.div
              data-fly-src={id}
              initial={{ scale: 0.9, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 380 }}
              className="pointer-events-none relative overflow-hidden rounded-[26px] bg-card shadow-[0_0_0_2px_color-mix(in_srgb,var(--blue)_55%,transparent),0_10px_30px_rgba(0,122,255,0.18)]"
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
