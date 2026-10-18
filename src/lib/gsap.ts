import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

// iOS-like defaults: quick, decelerating, never linear.
gsap.defaults({ ease: 'power3.out', duration: 0.45 })

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Springy "pop" used for confirmations (checks, tab icons). */
export function pop(el: Element | null | undefined, from = 0.6) {
  if (!el || prefersReducedMotion()) return
  gsap.fromTo(
    el,
    { scale: from },
    { scale: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.45)', overwrite: true, clearProps: 'scale,transform' },
  )
}

/** Pop a check circle and draw its tick, for "it's in the cart". */
export function popCheck(circle: Element | null | undefined) {
  if (!circle || prefersReducedMotion()) return
  pop(circle, 0.5)
  const path = circle.querySelector<SVGPathElement>('path')
  if (!path) return
  const len = path.getTotalLength()
  gsap.fromTo(
    path,
    { strokeDasharray: len, strokeDashoffset: len },
    { strokeDashoffset: 0, duration: 0.35, delay: 0.06, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' },
  )
}

/** Horizontal "no" shake, like a wrong passcode. */
export function shake(el: Element | null | undefined) {
  if (!el || prefersReducedMotion()) return
  gsap.fromTo(
    el,
    { x: 0 },
    { keyframes: { x: [0, -9, 8, -6, 4, -2, 0] }, duration: 0.55, ease: 'power1.inOut', overwrite: true },
  )
}

/** Cascade elements in (used when a screen becomes visible). */
export function cascadeIn(targets: Element[] | NodeListOf<Element>) {
  if (prefersReducedMotion() || !targets.length) return
  gsap.fromTo(
    targets,
    { y: 16, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity,visibility', overwrite: true },
  )
}

export { gsap, useGSAP }
