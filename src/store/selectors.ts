import type { Item, ListItem, Trip } from './types'

export const lineTotal = (i: { qty: number; price?: number }) => (i.price ?? 0) * i.qty

export const tripSpent = (t: Trip) => t.items.filter((i) => i.inCart).reduce((sum, i) => sum + lineTotal(i), 0)

export const tripPlannedRemaining = (t: Trip) =>
  t.items.filter((i) => !i.inCart).reduce((sum, i) => sum + lineTotal(i), 0)

export const listEstimate = (list: ListItem[]) => list.reduce((sum, i) => sum + (i.estPrice ?? 0) * i.qty, 0)

export const itemCount = (items: Item[]) => items.reduce((n, i) => n + i.qty, 0)

export type BudgetLevel = 'ok' | 'warn' | 'over'

export function budgetLevel(spent: number, budget: number): BudgetLevel {
  if (budget <= 0) return 'ok'
  if (spent > budget) return 'over'
  if (spent / budget >= 0.8) return 'warn'
  return 'ok'
}

export const levelColor: Record<BudgetLevel, string> = {
  ok: 'var(--green)',
  warn: 'var(--orange)',
  over: 'var(--red)',
}

export function monthTotal(history: Trip[], ref = new Date()) {
  return history
    .filter((t) => {
      const d = new Date(t.finishedAt ?? t.startedAt)
      return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
    })
    .reduce((sum, t) => sum + tripSpent(t), 0)
}

/** Most recent known price + category for each item name, for autocomplete. */
export function knownItems(history: Trip[], active: Trip | null) {
  const map = new Map<string, Pick<Item, 'name' | 'category' | 'price'>>()
  const trips = active ? [active, ...history] : history
  for (const t of trips) {
    for (const i of t.items) {
      const key = i.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, { name: i.name, category: i.category, price: i.price })
    }
  }
  return [...map.values()]
}
