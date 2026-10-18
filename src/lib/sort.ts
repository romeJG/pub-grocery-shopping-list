import { ArrowDown01, ArrowDownAZ, ArrowDown10, Clock, LayoutGrid, type LucideIcon } from 'lucide-react'
import { CATEGORIES } from './categories'
import type { Category, SortMode } from '../store/types'

export const SORT_OPTIONS: { value: SortMode; label: string; icon: LucideIcon }[] = [
  { value: 'category', label: 'Category', icon: LayoutGrid },
  { value: 'name', label: 'Name (A–Z)', icon: ArrowDownAZ },
  { value: 'price-desc', label: 'Price: High to Low', icon: ArrowDown10 },
  { value: 'price-asc', label: 'Price: Low to High', icon: ArrowDown01 },
  { value: 'recent', label: 'Recently Added', icon: Clock },
]

const categoryRank = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i])) as Record<Category, number>
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

interface Sortable {
  name: string
  category: Category
  qty: number
}

/**
 * Sort items for display. `items` must be newest-first so "recent" can keep
 * that order; `unitPrice` reads the price (actual or estimated) per item.
 * Unpriced items always sink to the bottom of price sorts.
 */
export function sortItems<T extends Sortable>(items: T[], mode: SortMode, unitPrice: (i: T) => number | undefined): T[] {
  const total = (i: T) => {
    const p = unitPrice(i)
    return p == null ? undefined : p * i.qty
  }
  const byPrice = (dir: 1 | -1) => (a: T, b: T) => {
    const pa = total(a)
    const pb = total(b)
    if (pa == null && pb == null) return collator.compare(a.name, b.name)
    if (pa == null) return 1
    if (pb == null) return -1
    return (pa - pb) * dir || collator.compare(a.name, b.name)
  }

  const out = [...items]
  switch (mode) {
    case 'name':
      return out.sort((a, b) => collator.compare(a.name, b.name))
    case 'price-desc':
      return out.sort(byPrice(-1))
    case 'price-asc':
      return out.sort(byPrice(1))
    case 'category':
      return out.sort((a, b) => categoryRank[a.category] - categoryRank[b.category] || collator.compare(a.name, b.name))
    case 'recent':
      return out
  }
}
