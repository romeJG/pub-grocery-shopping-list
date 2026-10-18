import { useRef, useState, type ReactNode } from 'react'

interface PageProps {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
  children: ReactNode
}

export const TABBAR_MINIMIZE_EVENT = 'tabbar-minimize'

/**
 * iOS 26-style scroll view: floating glass controls over a scroll-edge blur,
 * a large title that hands off to a centered inline title, and scroll-direction
 * signals so the floating tab bar can minimize.
 */
export function Page({ title, leading, trailing, children }: PageProps) {
  const [scrolled, setScrolled] = useState(false)
  const lastY = useRef(0)

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const y = el.scrollTop
    setScrolled(y > 36)
    const atBottom = y + el.clientHeight >= el.scrollHeight - 4
    const dy = y - lastY.current
    if (Math.abs(dy) < 6) return
    lastY.current = y
    // Scrolling down minimizes; scrolling up restores (ignoring the bounce at the bottom).
    if (dy > 0 && y > 80) window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: true }))
    else if (dy < 0 && !atBottom) window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: false }))
  }

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain" onScroll={onScroll}>
      <header className="pt-safe sticky top-0 z-20">
        <div
          className={`scroll-edge transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden
        />
        <div className="relative flex h-[60px] items-center justify-between px-4">
          <div className="z-10 flex min-w-11 items-center gap-2">{leading}</div>
          <div
            className={`pointer-events-none absolute inset-x-24 truncate text-center text-[17px] font-semibold transition-all duration-300 ${
              scrolled ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            {title}
          </div>
          <div className="z-10 flex min-w-11 items-center justify-end gap-2">{trailing}</div>
        </div>
      </header>
      <h1 className="px-5 pb-3 text-[34px] leading-[41px] font-bold tracking-[0.37px]">{title}</h1>
      <div className="pb-[calc(env(safe-area-inset-bottom)+120px)]">{children}</div>
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
