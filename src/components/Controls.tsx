import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { haptic } from '../lib/util'

const spring = { type: 'spring', damping: 28, stiffness: 420 } as const

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = useId()
  return (
    <div className="flex h-9 rounded-full bg-fill p-[3px]" role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="relative flex-1 text-[14px] font-medium"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-card shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_0.5px_0_rgba(255,255,255,0.9)] dark:bg-[#5a5a5e] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.25)]"
                transition={spring}
              />
            )}
            <span className={`relative ${active ? 'font-semibold' : ''}`}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  const set = (v: number) => {
    haptic()
    onChange(Math.max(min, v))
  }
  return (
    <div className="flex h-9 items-center rounded-full bg-fill p-[3px]">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className="press-glass flex size-[30px] items-center justify-center rounded-full disabled:opacity-30"
      >
        <Minus size={17} strokeWidth={2.6} />
      </button>
      <motion.span
        key={value}
        initial={{ scale: 1.25, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="tabular min-w-9 text-center text-[17px] font-semibold"
      >
        {value}
      </motion.span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => set(value + 1)}
        className="press-glass flex size-[30px] items-center justify-center rounded-full"
      >
        <Plus size={17} strokeWidth={2.6} />
      </button>
    </div>
  )
}

/** iOS 26 switch: wider track, capsule knob that stretches while pressed. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => {
        haptic()
        onChange(!checked)
      }}
      className={`relative h-7 w-[63px] shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-green' : 'bg-fill-2'}`}
    >
      <motion.span
        className="absolute top-[2px] h-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.04)]"
        initial={false}
        animate={{ width: pressed ? 46 : 39, left: checked ? (pressed ? 15 : 22) : 2 }}
        transition={spring}
      />
    </button>
  )
}

export function PrimaryButton({
  children,
  onClick,
  color = 'var(--blue)',
  disabled,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  color?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ '--tint': color } as React.CSSProperties}
      className={`glass-tint press-glass relative flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold disabled:opacity-40 ${className}`}
    >
      <span className="relative z-[2] flex items-center gap-2">{children}</span>
    </button>
  )
}

/** Secondary capsule on a plain fill (e.g. "Finish Trip"). */
export function SecondaryButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press-glass flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-card text-[17px] font-semibold text-blue ${className}`}
    >
      {children}
    </button>
  )
}
