import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

interface PageProps {
  title: string
  /** Shown beside the title once it docks into the bar (e.g. budget %), fading in with the morph. */
  titleAccessory?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  children: ReactNode
}

export const TABBAR_MINIMIZE_EVENT = 'tabbar-minimize'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeX = gsap.parseEase('power1.inOut')
// Morphing accessories shrink early so they're near final size before reaching the title.
const easeShrink = gsap.parseEase('power2.out')

/** Large title 34/41pt bold → inline title 17pt, like UIKit. */
const LARGE_PX = 34
const LINE_PX = 41
const INLINE_SCALE = 17 / LARGE_PX
const SIDE_PX = 20
const ACCESSORY_GAP = 8
/** Scroll distance over which a sourced accessory lifts off its source and docks. */
const ACCESSORY_RANGE = 90

/**
 * Reshape the accessory's mini ring ([data-morph-ring-target]) out of the in-content ring
 * ([data-morph-ring-source]): at q=0 it sits exactly over the source at the same size and stroke
 * proportion (so swapping them is invisible); by q=1 it's back to its own place, size and stroke.
 */
function morphRing(acc: HTMLElement, accScale: number, q: number, hRect: DOMRect) {
  const scroller = acc.closest('.overflow-y-auto')
  const from = scroller?.querySelector<SVGSVGElement>('[data-morph-ring-source]')
  const to = acc.querySelector<SVGSVGElement>('[data-morph-ring-target]')
  if (!from || !to) return

  // Natural position of the mini ring (inside the already-transformed accessory).
  gsap.set(to, { x: 0, y: 0, scale: 1 })
  const natural = to.getBoundingClientRect()
  const source = from.getBoundingClientRect()
  const cx = (r: DOMRect) => r.left + r.width / 2 - hRect.left
  const cy = (r: DOMRect) => r.top + r.height / 2 - hRect.top
  // Offset from its slot in the accessory, closing as fast as it shrinks, so ring and accessory
  // join up early and travel as one. Offsets are in the accessory's local (pre-scale) units.
  const settle = 1 - easeShrink(q)
  gsap.set(to, {
    transformOrigin: '50% 50%',
    x: ((cx(source) - cx(natural)) * settle) / accScale,
    y: ((cy(source) - cy(natural)) * settle) / accScale,
    scale: lerp(source.width / natural.width, 1, easeShrink(q)),
  })

  // Match the stroke proportion: big ring stroke/size → mini ring's own stroke.
  const box = to.viewBox.baseVal.width || 14
  const srcStroke = Number(from.querySelector('circle')?.getAttribute('stroke-width')) || 1
  const srcSize = Number(from.getAttribute('width')) || source.width
  const sw = lerp((box * srcStroke) / srcSize, Number(to.dataset.baseStroke) || 2.5, easeShrink(q))
  const r = (box - sw) / 2
  const c = 2 * Math.PI * r
  const progress = Number(to.dataset.progress) || 0
  to.querySelectorAll('circle').forEach((circle) => {
    circle.setAttribute('r', String(r))
    circle.setAttribute('stroke-width', String(sw))
    if (circle.hasAttribute('data-ring-arc')) {
      circle.setAttribute('stroke-dasharray', String(c))
      circle.setAttribute('stroke-dashoffset', String(c * (1 - progress)))
    }
  })
  // The real ring hides the moment the mini ring takes its place.
  gsap.set(from, { opacity: q > 0 ? 0 : 1 })
}

/**
 * iOS 26-style scroll view: floating glass controls over a scroll-edge blur,
 * a large title that becomes the inline title, and scroll-direction signals so
 * the floating tab bar can minimize.
 *
 * The title is one element scrubbed by scroll position (GSAP): it rides up with
 * the content while shrinking from 34pt to 17pt and gliding from the leading
 * edge to the center of the bar, where it docks. Pulling past the top stretches
 * it, anchored at its leading edge. The in-flow <h1> is an invisible spacer that
 * keeps layout and accessibility; the morphing copy is decorative.
 */
export function Page({ title, titleAccessory, leading, trailing, children }: PageProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const morph = useRef<HTMLDivElement>(null)
  const spacer = useRef<HTMLHeadingElement>(null)
  const accessory = useRef<HTMLDivElement>(null)
  const edge = useRef<HTMLDivElement>(null)
  const lastY = useRef(0)
  const update = useRef<() => void>(() => {})

  useGSAP(
    () => {
      const h = header.current
      const b = bar.current
      const m = morph.current
      const sp = spacer.current
      if (!h || !b || !m || !sp) return
      const setEdge = gsap.quickSetter(edge.current, 'opacity')

      update.current = () => {
        // Hidden tab (display: none): nothing to measure. The ResizeObserver re-runs this once shown.
        if (!h.offsetHeight) return
        // Where the large title would be right now (follows the content, incl. rubber-banding).
        const top = sp.getBoundingClientRect().top - h.getBoundingClientRect().top
        const restTop = h.offsetHeight
        const dockTop = b.offsetTop + b.offsetHeight / 2 - (LINE_PX * INLINE_SCALE) / 2
        const p = clamp01((restTop - top) / (restTop - dockTop))

        const acc = accessory.current
        const accW = acc ? acc.offsetWidth + ACCESSORY_GAP : 0
        const hRect = h.getBoundingClientRect()
        // Optional in-content element the accessory morphs out of (e.g. the ring's "46%"), and the
        // group that fades out as it lifts off (e.g. "46% used").
        const src = acc ? scroller.current?.querySelector<HTMLElement>('[data-title-accessory-source]') : null
        const srcFade = src?.closest<HTMLElement>('[data-title-accessory-fade]') ?? src
        const srcRect = src?.getBoundingClientRect()
        // The docked accessory's vertical center (title is docked by then: half-size at dockTop).
        const dockCenterY = dockTop + (LINE_PX * INLINE_SCALE) / 2
        const srcCenterY = srcRect ? srcRect.top + srcRect.height / 2 - hRect.top : 0
        // Accessory progress: with a source, it docks as the source reaches the bar; otherwise late in the title morph.
        const q = !acc ? 0 : srcRect ? clamp01(1 - (srcCenterY - dockCenterY) / ACCESSORY_RANGE) : clamp01((p - 0.45) / 0.55)

        // Free space in the bar between the leading and trailing controls.
        const hLeft = hRect.left
        const minX = (b.children[0] as HTMLElement).getBoundingClientRect().right - hLeft + 8
        const maxX = (b.children[1] as HTMLElement).getBoundingClientRect().left - hLeft - 8
        // Cap the width so the docked (half-size) title + accessory always fit in that space.
        const maxWidth = Math.min(h.clientWidth - SIDE_PX * 2, (maxX - minX - accW) / INLINE_SCALE)
        if (m.style.maxWidth !== `${maxWidth}px`) m.style.maxWidth = `${maxWidth}px`

        const scale = top > restTop ? 1 + Math.min(top - restTop, 160) / 800 : lerp(1, INLINE_SCALE, p)
        // Center the title together with the accessory, nudged over if one side's controls are wider.
        const groupW = m.offsetWidth * scale + accW * q
        const centered = Math.max(minX, Math.min((h.clientWidth - groupW) / 2, maxX - groupW))
        const x = lerp(SIDE_PX, centered, easeX(p))
        const y = p >= 1 ? dockTop : top
        gsap.set(m, { x, y, scale })

        if (acc && src && srcRect) {
          // Shared-element morph: the accessory starts over its source at the source's size, then
          // shrinks and flies to the title's trailing edge. Parts marked data-morph-fade (background,
          // text) cross-fade with the source; a data-morph-ring-target is reshaped out of the
          // in-content data-morph-ring-source so the ring itself appears to fly up and shrink.
          const aw = acc.offsetWidth
          const ah = acc.offsetHeight
          const dockCenterX = x + m.offsetWidth * scale + ACCESSORY_GAP + aw / 2
          const srcCenterX = srcRect.left + srcRect.width / 2 - hRect.left
          const handoff = clamp01(q / 0.2)
          // Start at the source text's size relative to the accessory's text.
          const fontOf = (el: Element) => Number.parseFloat(getComputedStyle(el).fontSize) || 1
          const accScale = lerp(Math.max(1, fontOf(src) / fontOf(acc.querySelector('span') ?? acc)), 1, easeShrink(q))
          const fades = acc.querySelectorAll('[data-morph-fade]')
          gsap.set(acc, {
            transformOrigin: '50% 50%',
            x: lerp(srcCenterX, dockCenterX, easeX(q)) - aw / 2,
            y: lerp(srcCenterY, dockCenterY, q) - ah / 2,
            scale: accScale,
            // Without fade parts the whole accessory cross-fades; with them it's visible once lifted.
            opacity: fades.length ? (q > 0 ? 1 : 0) : handoff,
          })
          if (fades.length) gsap.set(fades, { opacity: handoff })
          gsap.set(srcFade ?? src, { opacity: 1 - handoff })
          morphRing(acc, accScale, q, hRect)
        } else if (acc) {
          // No source: ride the title's trailing edge and grow in during the second half.
          gsap.set(acc, {
            transformOrigin: '0% 50%',
            x: x + m.offsetWidth * scale + ACCESSORY_GAP,
            y: y + (LINE_PX * scale - acc.offsetHeight) / 2,
            opacity: q,
            scale: lerp(0.6, 1, q),
          })
        }
        setEdge(p)
      }
      update.current()

      // Re-place when the width changes (rotation, resize) or the accessory's text changes size.
      const ro = new ResizeObserver(() => update.current())
      ro.observe(h)
      if (accessory.current) ro.observe(accessory.current)
      return () => ro.disconnect()
    },
    { scope: scroller, dependencies: [title, !!titleAccessory] },
  )

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const y = el.scrollTop
    update.current()
    const atBottom = y + el.clientHeight >= el.scrollHeight - 4
    const dy = y - lastY.current
    if (Math.abs(dy) < 6) return
    lastY.current = y
    // Scrolling down minimizes; scrolling up restores (ignoring the bounce at the bottom).
    if (dy > 0 && y > 80) window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: true }))
    else if (dy < 0 && !atBottom) window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: false }))
  }

  const titleType = 'text-[34px] leading-[41px] font-bold tracking-[0.37px] whitespace-nowrap'

  return (
    <div ref={scroller} className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain" onScroll={onScroll}>
      <header ref={header} className="pt-safe sticky top-0 z-20">
        <div ref={edge} className="scroll-edge opacity-0" aria-hidden />
        <div ref={bar} className="relative flex h-[60px] items-center justify-between px-4">
          <div className="z-10 flex min-w-11 items-center gap-2">{leading}</div>
          <div className="z-10 flex min-w-11 items-center justify-end gap-2">{trailing}</div>
        </div>
        <div
          ref={morph}
          aria-hidden
          className={`pointer-events-none absolute top-0 left-0 z-[5] origin-top-left truncate will-change-transform ${titleType}`}
        >
          {title}
        </div>
        {titleAccessory && (
          <div ref={accessory} className="pointer-events-none absolute top-0 left-0 z-[5] opacity-0">
            {titleAccessory}
          </div>
        )}
      </header>
      <h1 ref={spacer} className={`truncate px-5 pb-3 opacity-0 ${titleType}`}>
        {title}
      </h1>
      <div data-page-content className="pb-[calc(env(safe-area-inset-bottom)+120px)]">
        {children}
      </div>
    </div>
  )
}

/** Floating Liquid Glass button: a circle for icons, a capsule for text. */
export function GlassButton({
  children,
  onClick,
  label,
  tint,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  label?: string
  /** Prominent (tinted) glass, e.g. the confirm action. */
  tint?: string
  className?: string
}) {
  const iconOnly = typeof children !== 'string'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={tint ? ({ '--tint': tint } as React.CSSProperties) : undefined}
      className={`press-glass relative flex h-11 items-center justify-center rounded-full text-[17px] font-medium ${
        tint ? 'glass-tint' : 'glass text-label'
      } ${iconOnly ? 'w-11' : 'px-4'} ${className}`}
    >
      <span className="relative z-[2] flex items-center gap-1">{children}</span>
    </button>
  )
}
