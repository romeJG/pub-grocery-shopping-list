import { useRef, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { haptic } from '../lib/util'

const ACTION_W = 80

/** Swipe left to reveal Delete; a long swipe deletes immediately (like Mail). */
export function SwipeRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const x = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const actionOpacity = useTransform(x, [-ACTION_W, -20, 0], [1, 0.6, 0])

  const settle = (to: number) => animate(x, to, { type: 'spring', damping: 32, stiffness: 400 })

  const remove = () => {
    haptic(12)
    const w = ref.current?.offsetWidth ?? 400
    animate(x, -w, { duration: 0.2 }).then(onDelete)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const w = ref.current?.offsetWidth ?? 400
    if (info.offset.x < -w * 0.5 || info.velocity.x < -900) return remove()
    settle(x.get() < -ACTION_W / 2 ? -ACTION_W : 0)
  }

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.button
        type="button"
        aria-label="Delete"
        onClick={remove}
        style={{ opacity: actionOpacity }}
        className="absolute inset-y-0 right-0 flex w-full items-center justify-end bg-red pr-6 text-white"
      >
        <Trash2 size={22} />
      </motion.button>
      <motion.div
        drag="x"
        style={{ x }}
        dragDirectionLock
        dragConstraints={{ left: -10_000, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
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
            e.stopPropagation()
            settle(0)
          }
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}
