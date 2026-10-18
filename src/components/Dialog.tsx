import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

export interface DialogAction {
  label: string
  onPress: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

function actionClass(style: DialogAction['style']) {
  if (style === 'cancel') return 'bg-fill text-label'
  if (style === 'destructive') return 'bg-fill text-red'
  return 'glass-tint'
}

function ActionButton({ a }: { a: DialogAction }) {
  return (
    <button
      type="button"
      onClick={a.onPress}
      className={`press-glass relative h-[50px] min-w-0 flex-1 rounded-full px-4 text-[17px] font-semibold ${actionClass(a.style)}`}
    >
      <span className="relative z-[2] block truncate">{a.label}</span>
    </button>
  )
}

/** iOS 26 alert: rounded glass card, leading-aligned text, capsule buttons. */
export function Alert({
  open,
  title,
  message,
  actions,
  onDismiss,
}: {
  open: boolean
  title: string
  message?: ReactNode
  actions: DialogAction[]
  onDismiss: () => void
}) {
  const stacked = actions.length > 2 || actions.some((a) => a.label.length > 12)
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8" role="alertdialog" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          <motion.div
            className="glass-strong relative w-full max-w-[320px] rounded-[34px] p-[22px]"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 420 }}
          >
            <div className="relative z-[2]">
              <h2 className="text-[17px] leading-[22px] font-semibold">{title}</h2>
              {message && <div className="mt-1 text-[15px] leading-5 text-label-2">{message}</div>}
              <div className={`mt-5 flex gap-2.5 ${stacked ? 'flex-col-reverse' : ''}`}>
                {actions.map((a) => (
                  <ActionButton key={a.label} a={a} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** iOS 26 action sheet: a floating glass card of capsule actions. */
export function ActionSheet({
  open,
  title,
  message,
  actions,
  onDismiss,
}: {
  open: boolean
  title?: string
  message?: ReactNode
  actions: DialogAction[]
  onDismiss: () => void
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          <motion.div
            className="glass-strong absolute inset-x-2 bottom-[max(env(safe-area-inset-bottom),8px)] mx-auto max-w-md rounded-[38px] p-5"
            initial={{ y: '115%' }}
            animate={{ y: 0 }}
            exit={{ y: '115%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
          >
            <div className="relative z-[2]">
              {(title || message) && (
                <div className="px-1 pb-4">
                  {title && <div className="text-[17px] font-semibold">{title}</div>}
                  {message && <div className="mt-0.5 text-[15px] text-label-2">{message}</div>}
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {actions.map((a) => (
                  <ActionButton key={a.label} a={a} />
                ))}
                <ActionButton a={{ label: 'Cancel', style: 'cancel', onPress: onDismiss }} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
