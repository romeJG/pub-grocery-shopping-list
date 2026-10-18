import { useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type PanInfo } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { ActionSheet } from './Dialog'
import { haptic } from '../lib/util'

/** Resting width of the revealed action area. */
const ACTION_W = 78
/** Inset of the pill from the row edges. */
const GAP = 8

/**
 * iOS 26 swipe-to-delete: swiping left reveals a red glass pill that
 * stretches as you pull. Deleting always asks for confirmation first, whether
 * you tap the pill or swipe all the way.
 */
export function SwipeRow({ children, onDelete, itemName }: { children: ReactNode; onDelete: () => void; itemName: string }) {
  const x = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const [confirming, setConfirming] = useState(false)
  const [armed, setArmed] = useState(false)

  const pillW = useTransform(x, (v) => Math.max(0, -v - GAP * 2))
  const pillOpacity = useTransform(x, [-36, -10], [1, 0])
  const iconScale = useTransform(x, [-ACTION_W, -24], [1, 0.4])

  const fullSwipe = () => (ref.current?.offsetWidth ?? 400) * 0.55

  // A tick when a long swipe crosses the "will ask to delete" threshold.
  useMotionValueEvent(x, 'change', (v) => {
    const past = -v > fullSwipe()
    if (past !== armed) {
      setArmed(past)
      if (past) haptic(10)
    }
  })

  const settle = (to: number) => animate(x, to, { type: 'spring', damping: 32, stiffness: 400 })

  const askToDelete = () => {
    haptic(8)
    settle(-ACTION_W)
    setConfirming(true)
  }

  const cancel = () => {
    setConfirming(false)
    settle(0)
  }

  const remove = () => {
    setConfirming(false)
    haptic(14)
    const w = ref.current?.offsetWidth ?? 400
    animate(x, -w, { duration: 0.22, ease: [0.32, 0.72, 0, 1] }).then(onDelete)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Only a deliberate long swipe asks to delete; a flick just reveals the pill.
    if (-x.get() > fullSwipe()) return askToDelete()
    const open = x.get() < -ACTION_W / 2 || info.velocity.x < -500
    settle(open && info.velocity.x < 500 ? -ACTION_W : 0)
  }

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.button
        type="button"
        aria-label={`Delete ${itemName}`}
        onClick={askToDelete}
        style={{ width: pillW, opacity: pillOpacity, top: GAP, bottom: GAP, right: GAP }}
        className="glass-tint absolute flex items-center justify-center overflow-hidden rounded-full [--tint:var(--red)]"
      >
        <motion.span style={{ scale: iconScale }} className="relative z-[2] flex items-center gap-1.5 text-[15px] font-semibold">
          <Trash2 size={20} strokeWidth={2.3} />
          {armed && <span className="whitespace-nowrap">Delete</span>}
        </motion.span>
      </motion.button>
      <motion.div
        drag="x"
        style={{ x }}
        dragDirectionLock
        dragConstraints={{ left: -10_000, right: 0 }}
        dragElastic={{ left: 0.12, right: 0 }}
        dragMomentum={false}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={(e, info) => {
          onDragEnd(e, info)
          setTimeout(() => (dragged.current = false), 0)
        }}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation()
            e.preventDefault()
          } else if (x.get() < 0) {
            // Tapping an open row closes it instead of opening the item.
            e.stopPropagation()
            settle(0)
          }
        }}
        className="relative"
      >
        {children}
      </motion.div>

      <ActionSheet
        open={confirming}
        title={`Delete “${itemName}”?`}
        message="This can’t be undone."
        onDismiss={cancel}
        actions={[{ label: 'Delete Item', style: 'destructive', onPress: remove }]}
      />
    </div>
  )
}
