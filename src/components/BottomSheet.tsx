import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import { Check, X } from 'lucide-react'
import { GlassButton } from './Page'

const spring = { type: 'spring', damping: 32, stiffness: 360, mass: 0.9 } as const

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Accessible label for the confirm (checkmark) button. */
  confirmLabel?: string
  onConfirm?: () => void
  confirmDisabled?: boolean
  children: ReactNode
}

/**
 * iOS 26 sheet: floats inset from the screen edges with concentric corners,
 * glass material, and circular close / confirm controls.
 */
export function BottomSheet({ open, onClose, title, confirmLabel, onConfirm, confirmDisabled, children }: BottomSheetProps) {
  const drag = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass-strong absolute inset-x-2 bottom-[max(env(safe-area-inset-bottom),8px)] mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top)-24px)] max-w-xl flex-col rounded-[38px]"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={spring}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            <div className="relative z-[2] shrink-0 touch-none" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-label-3" />
              <div className="relative flex h-14 items-center justify-between px-4">
                <GlassButton onClick={onClose} label="Close">
                  <X size={20} strokeWidth={2.4} />
                </GlassButton>
                {title && (
                  <h2 className="pointer-events-none absolute inset-x-20 truncate text-center text-[17px] font-semibold">
                    {title}
                  </h2>
                )}
                {onConfirm ? (
                  <GlassButton
                    onClick={confirmDisabled ? undefined : onConfirm}
                    label={confirmLabel ?? 'Done'}
                    tint={confirmDisabled ? 'var(--label-3)' : 'var(--blue)'}
                  >
                    <Check size={22} strokeWidth={2.8} />
                  </GlassButton>
                ) : (
                  <span className="w-11" />
                )}
              </div>
            </div>
            <div className="no-scrollbar relative z-[2] overflow-y-auto overscroll-contain pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
