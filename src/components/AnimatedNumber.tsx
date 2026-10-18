import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/**
 * Text that counts smoothly to its new value (budget left, totals) instead of
 * jumping. The DOM text is owned by GSAP, so React only renders the wrapper.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  style,
  countUp,
  ...rest
}: {
  value: number
  format: (n: number) => string
  className?: string
  style?: React.CSSProperties
  /** Count up from 0 on first appearance instead of starting at the value. */
  countUp?: boolean
} & Record<`data-${string}`, string | boolean | undefined>) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef<number | null>(countUp ? 0 : null)
  const formatRef = useRef(format)
  formatRef.current = format

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = current.current
    // First paint, or nothing to animate: just set the text.
    if (from == null || from === value || prefersReducedMotion()) {
      current.current = value
      el.textContent = format(value)
      return
    }
    el.textContent = format(from) // no blank frame before the first tick
    const state = { n: from }
    const tween = gsap.to(state, {
      n: value,
      duration: Math.min(0.9, 0.35 + Math.abs(value - from) / 4000),
      ease: 'power2.out',
      onUpdate: () => {
        current.current = state.n
        el.textContent = formatRef.current(state.n)
      },
      onComplete: () => {
        current.current = value
        el.textContent = formatRef.current(value)
      },
    })
    return () => {
      tween.kill()
    }
  }, [value, format])

  return <span ref={ref} className={className} style={style} aria-label={format(value)} {...rest} />
}
