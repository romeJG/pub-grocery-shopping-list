import { useCallback, useEffect, useRef, useState } from 'react'
import { popCheck } from './gsap'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const destFor = (id: string) =>
  document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]:not([data-flying-src])`)

// Ease-out with a touch of overshoot, so the row "lands" like a UIKit spring.
const easeOutBack = (t: number) => {
  const c = 1.2
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

/**
 * Fly a snapshot of `source` to wherever the row `data-row-id={id}` ends up
 * after the next render. The destination is re-measured every frame, so it
 * stays correct while surrounding content expands/collapses or scrolls.
 */
export function flyRow(source: HTMLElement, id: string, { hideSource = false, duration = 560 } = {}) {
  if (reducedMotion()) return
  const from = source.getBoundingClientRect()
  const radius = Number.parseFloat(getComputedStyle(source).borderRadius) || 16
  const ghost = source.cloneNode(true) as HTMLElement
  ghost.removeAttribute('data-row-id')
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '25', // under the floating tab bar, over the content
    pointerEvents: 'none',
    overflow: 'hidden',
    background: 'var(--card)',
    borderRadius: `${radius}px`,
    willChange: 'transform',
  })
  document.body.appendChild(ghost)

  if (hideSource) {
    // The source row is leaving (e.g. To Get → In Cart); the ghost stands in for it.
    source.setAttribute('data-flying-src', '')
    source.style.visibility = 'hidden'
  }

  let dest: HTMLElement | null = null
  const start = performance.now()
  const frame = (now: number) => {
    dest ??= destFor(id)
    if (dest) dest.style.visibility = 'hidden'
    const t = Math.min(1, (now - start) / duration)
    const e = easeOutBack(t)
    const to = dest?.getBoundingClientRect()
    const dx = to ? (to.left - from.left) * e : 0
    const dy = to ? (to.top - from.top) * e : 0
    const lift = Math.sin(Math.PI * Math.min(t, 1))
    ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${1 + 0.035 * lift})`
    ghost.style.boxShadow = `0 ${14 * lift}px ${36 * lift}px rgba(0,0,0,${0.22 * lift})`
    // Square off while landing so it matches the list row it becomes.
    ghost.style.borderRadius = `${radius * (1 - Math.min(1, t * 1.25))}px`
    if (!to) ghost.style.opacity = String(1 - t)

    if (t < 1) return requestAnimationFrame(frame)
    ghost.remove()
    if (dest) {
      dest.style.visibility = ''
      // Landed in the cart: pop the check and draw the tick.
      if (dest.querySelector('[data-check-circle] svg')) popCheck(dest.querySelector('[data-check-circle]'))
    }
  }
  requestAnimationFrame(frame)
}

/**
 * "Just added" choreography: a new item is pinned in a highlighted card at the
 * top, then flies into its sorted position.
 */
export function usePinThenSettle(pinMs = 850) {
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const pinnedRef = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const settle = useCallback(() => {
    window.clearTimeout(timer.current)
    const id = pinnedRef.current
    if (!id) return
    const card = document.querySelector<HTMLElement>(`[data-fly-src="${CSS.escape(id)}"]`)
    if (card) flyRow(card, id)
    pinnedRef.current = null
    setPinnedId(null)
  }, [])

  const pin = useCallback(
    (id: string) => {
      settle() // a quick second add sends the previous one home first
      if (reducedMotion()) return
      pinnedRef.current = id
      setPinnedId(id)
      timer.current = window.setTimeout(settle, pinMs)
    },
    [settle, pinMs],
  )

  /** Fly an existing row to its new home after `mutate` moves it. */
  const move = useCallback((id: string, mutate: () => void) => {
    const src = destFor(id)
    if (src) flyRow(src, id, { hideSource: true })
    mutate()
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { pinnedId, pin, move }
}
