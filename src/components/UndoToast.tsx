import { useEffect } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { useUndo } from '../store/undo'
import { haptic } from '../lib/util'

const VISIBLE_MS = 5000

/**
 * iOS 26-style undo banner: a glass capsule floating just above the tab bar.
 * Auto-dismisses after 5s; swipe it down to dismiss early.
 */
export function UndoToast() {
  const toast = useUndo((s) => s.toast)
  const dismiss = useUndo((s) => s.dismiss)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => {
      // Only dismiss if this is still the banner we started the timer for.
      if (useUndo.getState().toast?.id === toast.id) dismiss()
    }, VISIBLE_MS)
    return () => clearTimeout(t)
  }, [toast, dismiss])

  const undo = () => {
    if (!toast) return
    haptic(10)
    toast.undo()
    dismiss()
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),12px)+62px+12px)] z-40 flex justify-center px-5">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            aria-live="polite"
            initial={{ y: 24, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', damping: 26, stiffness: 420 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 30 || info.velocity.y > 300) dismiss()
            }}
            className="glass-strong pointer-events-auto relative flex h-[52px] w-full max-w-md items-center gap-3 rounded-full pr-1.5 pl-5"
          >
            <span className="relative z-[2] min-w-0 flex-1 truncate text-[15px] font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={undo}
              className="press-glass relative z-[2] flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)] px-4 text-[15px] font-semibold text-blue"
            >
              <RotateCcw size={16} strokeWidth={2.6} /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
