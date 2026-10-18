import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { categoryMeta } from '../lib/categories'
import type { Category } from '../store/types'

export function CategoryIcon({ category, size = 32 }: { category: Category; size?: number }) {
  const meta = categoryMeta(category)
  const Icon = meta.icon
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `${meta.color}22`, color: meta.color }}
    >
      <Icon size={size * 0.55} strokeWidth={2.2} />
    </span>
  )
}

interface ItemRowProps {
  category: Category
  name: string
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  /** Renders a round checkbox on the left (Reminders style). */
  check?: { checked: boolean; onToggle: () => void }
  dimmed?: boolean
  /** Lets fly-to-place animations find this row. */
  rowId?: string
}

export function ItemRow({ category, name, subtitle, trailing, onClick, check, dimmed, rowId }: ItemRowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <div data-row-id={rowId} className="relative flex min-h-[58px] w-full items-center bg-card">
      {check && (
        <button
          type="button"
          aria-label={check.checked ? `Remove ${name} from cart` : `Add ${name} to cart`}
          onClick={check.onToggle}
          className="flex h-[58px] w-12 shrink-0 items-center justify-center pl-2"
        >
          <motion.span
            whileTap={{ scale: 0.85 }}
            className={`flex size-[24px] items-center justify-center rounded-full border-[1.5px] transition-colors ${
              check.checked ? 'border-green bg-green text-white' : 'border-label-3'
            }`}
          >
            {check.checked && <Check size={15} strokeWidth={3.5} />}
          </motion.span>
        </button>
      )}
      <Tag
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={`${onClick ? 'pressable' : ''} flex min-h-[58px] min-w-0 flex-1 items-center gap-3 text-left ${check ? '' : 'pl-4'}`}
      >
        <CategoryIcon category={category} />
        <div className="row-inner flex min-h-[58px] min-w-0 flex-1 items-center gap-2 py-2 pr-4">
          <div className={`min-w-0 flex-1 ${dimmed ? 'opacity-50' : ''}`}>
            <div className="truncate text-[17px] leading-[22px]">{name}</div>
            {subtitle && <div className="tabular truncate text-[13px] leading-[18px] text-label-2">{subtitle}</div>}
          </div>
          {trailing && <div className="tabular shrink-0 text-[17px] font-medium">{trailing}</div>}
        </div>
      </Tag>
    </div>
  )
}
