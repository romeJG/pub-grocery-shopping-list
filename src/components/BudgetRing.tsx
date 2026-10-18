import { motion } from 'motion/react'

/** Activity-ring style progress. Overflow past 100% draws a second lap on top. */
export function BudgetRing({
  progress,
  color,
  size = 132,
  stroke = 16,
  children,
}: {
  progress: number
  color: string
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(progress, 2))
  const first = Math.min(clamped, 1)
  const second = Math.max(0, clamped - 1)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - first), stroke: color }}
          transition={{ type: 'spring', damping: 26, stiffness: 120 }}
        />
        {second > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - second) }}
            transition={{ type: 'spring', damping: 26, stiffness: 120 }}
            style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.35))' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
