import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export function Section({
  header,
  footer,
  children,
  className = '',
}: {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mx-4 mb-8 ${className}`}>
      {header && (
        <div className="flex items-end justify-between px-5 pb-2 text-[15px] font-semibold tracking-[-0.2px] text-label-2">
          {header}
        </div>
      )}
      <div className="ios-list overflow-hidden rounded-[26px] bg-card">{children}</div>
      {footer && <p className="px-5 pt-2 text-[13px] leading-[18px] text-label-2">{footer}</p>}
    </section>
  )
}

interface RowProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  chevron?: boolean
  onClick?: () => void
  destructive?: boolean
  accent?: boolean
  className?: string
}

/** A UITableViewCell-style row. Separators are inset to the text, like iOS. */
export function Row({ leading, title, subtitle, trailing, chevron, onClick, destructive, accent, className = '' }: RowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative flex min-h-[52px] w-full items-center gap-3 bg-card pl-4 text-left ${
        onClick ? 'pressable' : ''
      } ${className}`}
    >
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}
      <div className="row-inner flex min-h-[52px] min-w-0 flex-1 items-center gap-2 py-2.5 pr-4">
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[17px] leading-[22px] ${destructive ? 'text-red' : accent ? 'text-blue' : ''}`}
          >
            {title}
          </div>
          {subtitle && <div className="truncate text-[15px] leading-5 text-label-2">{subtitle}</div>}
        </div>
        {trailing && <div className="tabular shrink-0 text-[17px] text-label-2">{trailing}</div>}
        {chevron && <ChevronRight className="-mr-1 size-5 shrink-0 text-label-3" strokeWidth={2.5} />}
      </div>
    </Tag>
  )
}

export function IconBadge({ icon: Icon, color, size = 30 }: { icon: React.ElementType; color: string; size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-[9px] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.5)]"
      style={{ background: color, width: size, height: size }}
    >
      <Icon size={size * 0.6} strokeWidth={2.2} />
    </span>
  )
}
