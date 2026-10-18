/**
 * Realistic sample data for development: ~5 months of Philippine grocery
 * trips, an in-progress trip and a shopping list. Deterministic (seeded), and
 * dated relative to `now` so it always looks current.
 *
 * Kept free of runtime imports so `npm run mock` can run it directly in Node.
 */
import type { Category, Item, ListItem, PersistedState, Trip } from '../store/types'

interface Product {
  name: string
  category: Category
  price: number
  /** Chance it's bought on a big weekly trip (0–1). */
  freq: number
  qty?: [number, number]
}

const PRODUCTS: Product[] = [
  // Produce
  { name: 'Bananas (lakatan) 1kg', category: 'produce', price: 90, freq: 0.8 },
  { name: 'Tomatoes 1kg', category: 'produce', price: 120, freq: 0.6 },
  { name: 'Red onions 1kg', category: 'produce', price: 160, freq: 0.5 },
  { name: 'Garlic 250g', category: 'produce', price: 70, freq: 0.5 },
  { name: 'Calamansi 250g', category: 'produce', price: 40, freq: 0.4 },
  { name: 'Potatoes 1kg', category: 'produce', price: 110, freq: 0.35 },
  { name: 'Carrots 1kg', category: 'produce', price: 120, freq: 0.35 },
  { name: 'Cabbage', category: 'produce', price: 80, freq: 0.3 },
  { name: 'Pechay', category: 'produce', price: 35, freq: 0.4, qty: [1, 2] },
  { name: 'Mangoes 1kg', category: 'produce', price: 180, freq: 0.25 },
  { name: 'Eggplant 1kg', category: 'produce', price: 100, freq: 0.25 },
  // Meat & seafood
  { name: 'Chicken breast 1kg', category: 'meat', price: 260, freq: 0.7 },
  { name: 'Pork liempo 1kg', category: 'meat', price: 380, freq: 0.45 },
  { name: 'Ground beef 500g', category: 'meat', price: 240, freq: 0.3 },
  { name: 'Chicken wings 1kg', category: 'meat', price: 280, freq: 0.25 },
  { name: 'Longganisa', category: 'meat', price: 165, freq: 0.3 },
  { name: 'Hotdogs 1kg', category: 'meat', price: 230, freq: 0.2 },
  { name: 'Bangus (milkfish)', category: 'seafood', price: 220, freq: 0.35 },
  { name: 'Tilapia 1kg', category: 'seafood', price: 150, freq: 0.25 },
  { name: 'Shrimp 500g', category: 'seafood', price: 300, freq: 0.15 },
  // Dairy & eggs
  { name: 'Eggs (tray of 30)', category: 'dairy', price: 270, freq: 0.75 },
  { name: 'Fresh milk 1L', category: 'dairy', price: 105, freq: 0.7, qty: [1, 3] },
  { name: 'Cheese 440g', category: 'dairy', price: 210, freq: 0.25 },
  { name: 'Butter 225g', category: 'dairy', price: 145, freq: 0.2 },
  { name: 'Yogurt 4-pack', category: 'dairy', price: 120, freq: 0.2 },
  // Bakery
  { name: 'Pandesal (10 pcs)', category: 'bakery', price: 50, freq: 0.6, qty: [1, 2] },
  { name: 'Loaf bread', category: 'bakery', price: 75, freq: 0.5 },
  { name: 'Ensaymada (4 pcs)', category: 'bakery', price: 120, freq: 0.15 },
  // Pantry
  { name: 'Rice 5kg', category: 'pantry', price: 290, freq: 0.4 },
  { name: 'Cooking oil 1L', category: 'pantry', price: 120, freq: 0.25 },
  { name: 'Soy sauce 1L', category: 'pantry', price: 55, freq: 0.2 },
  { name: 'Vinegar 1L', category: 'pantry', price: 45, freq: 0.2 },
  { name: 'Sugar 1kg', category: 'pantry', price: 85, freq: 0.2 },
  { name: 'Instant noodles (6)', category: 'pantry', price: 72, freq: 0.35 },
  { name: 'Canned tuna 155g', category: 'pantry', price: 38, freq: 0.35, qty: [2, 4] },
  { name: 'Corned beef 150g', category: 'pantry', price: 45, freq: 0.3, qty: [2, 3] },
  { name: 'Spaghetti pasta 1kg', category: 'pantry', price: 95, freq: 0.15 },
  { name: '3-in-1 coffee (30)', category: 'pantry', price: 230, freq: 0.3 },
  { name: 'Fish sauce', category: 'pantry', price: 45, freq: 0.12 },
  // Frozen
  { name: 'Frozen fries 1kg', category: 'frozen', price: 180, freq: 0.15 },
  { name: 'Ice cream 1.5L', category: 'frozen', price: 260, freq: 0.15 },
  { name: 'Chicken nuggets 400g', category: 'frozen', price: 190, freq: 0.15 },
  // Drinks
  { name: 'Bottled water 6×500ml', category: 'drinks', price: 90, freq: 0.4 },
  { name: 'Coke 1.5L', category: 'drinks', price: 85, freq: 0.4, qty: [1, 2] },
  { name: 'Orange juice 1L', category: 'drinks', price: 110, freq: 0.2 },
  { name: 'Iced tea powder', category: 'drinks', price: 65, freq: 0.15 },
  // Snacks
  { name: 'Potato chips', category: 'snacks', price: 75, freq: 0.35 },
  { name: 'Crackers', category: 'snacks', price: 60, freq: 0.3 },
  { name: 'Chocolate bar', category: 'snacks', price: 55, freq: 0.25 },
  { name: 'Roasted peanuts', category: 'snacks', price: 50, freq: 0.15 },
  // Household & personal
  { name: 'Dishwashing liquid', category: 'household', price: 99, freq: 0.25 },
  { name: 'Laundry detergent 1kg', category: 'household', price: 150, freq: 0.2 },
  { name: 'Fabric conditioner', category: 'household', price: 120, freq: 0.15 },
  { name: 'Toilet paper (12 rolls)', category: 'household', price: 220, freq: 0.2 },
  { name: 'Trash bags', category: 'household', price: 85, freq: 0.15 },
  { name: 'Shampoo 180ml', category: 'personal', price: 165, freq: 0.15 },
  { name: 'Toothpaste', category: 'personal', price: 120, freq: 0.15 },
  { name: 'Bath soap (3 bars)', category: 'personal', price: 110, freq: 0.15 },
]

/** Relative price level per store (bulk stores cost a bit more per item). */
const STORES: [string, number][] = [
  ['SM Supermarket', 1],
  ['Puregold', 0.95],
  ['Landers', 1.06],
  ['S&R', 1.08],
  ['Robinsons Supermarket', 1.02],
]

const DAY = 86_400_000

/** Small seeded PRNG (mulberry32) so the sample data is the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createMockState(now = Date.now()): PersistedState {
  const rand = rng(20261018)
  const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  let seq = 0
  const id = () => `mock-${(seq++).toString(36)}`

  /** Price at a store, `weeksAgo` weeks back: ~0.25%/week inflation, ±4% noise, rounded to ₱0.25. */
  const priceFor = (p: Product, storeLevel: number, weeksAgo: number) => {
    const inflation = Math.pow(1.0025, -weeksAgo)
    const noise = 0.96 + rand() * 0.08
    return Math.round(p.price * storeLevel * inflation * noise * 4) / 4
  }
  const qtyFor = (p: Product) => (p.qty ? between(p.qty[0], p.qty[1]) : rand() < 0.12 ? 2 : 1)

  const buy = (p: Product, storeLevel: number, weeksAgo: number, inCart = true): Item => ({
    id: id(),
    name: p.name,
    category: p.category,
    qty: qtyFor(p),
    price: priceFor(p, storeLevel, weeksAgo),
    inCart,
  })

  const total = (items: Item[]) => items.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0)

  // ── History: a big trip most weekends plus the occasional mid-week top-up ──
  const history: Trip[] = []
  for (let week = 21; week >= 1; week--) {
    const saturday = new Date(now - week * 7 * DAY)
    saturday.setDate(saturday.getDate() - ((saturday.getDay() + 1) % 7)) // back to Saturday
    saturday.setHours(between(9, 17), between(0, 59), 0, 0)

    if (rand() < 0.9) {
      const [store, level] = pick(STORES)
      const items = PRODUCTS.filter((p) => rand() < p.freq).map((p) => buy(p, level, week))
      const spent = total(items)
      // Budgets are round numbers; roughly a quarter of trips go over.
      const budget = Math.round((spent * (rand() < 0.25 ? 0.9 : 1.08 + rand() * 0.2)) / 500) * 500 || 500
      const start = saturday.getTime()
      history.push({ id: id(), store, budget, startedAt: start, finishedAt: start + between(25, 75) * 60_000, items })
    }

    if (rand() < 0.45) {
      const wed = saturday.getTime() + between(3, 5) * DAY + between(-2, 3) * 3_600_000
      if (wed < now - DAY) {
        const staples = PRODUCTS.filter((p) => p.freq >= 0.5 || p.category === 'snacks')
        const items = Array.from(new Set(Array.from({ length: between(3, 7) }, () => pick(staples)))).map((p) =>
          buy(p, 1, week),
        )
        history.push({ id: id(), store: 'SM Supermarket', budget: 800, startedAt: wed, finishedAt: wed + between(8, 20) * 60_000, items })
      }
    }
  }
  history.sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt))

  // ── In progress: halfway through a Puregold run ──
  const [tripStore, tripLevel] = STORES[1]
  const byName = (n: string) => PRODUCTS.find((p) => p.name === n)!
  const inCart = [
    'Rice 5kg',
    'Chicken breast 1kg',
    'Eggs (tray of 30)',
    'Fresh milk 1L',
    'Bananas (lakatan) 1kg',
    'Canned tuna 155g',
    'Coke 1.5L',
    'Dishwashing liquid',
  ].map((n) => buy(byName(n), tripLevel, 0))
  const toGet = [
    buy(byName('Pork liempo 1kg'), tripLevel, 0, false), // priced from the list estimate
    buy(byName('Garlic 250g'), tripLevel, 0, false),
    { ...buy(byName('Pandesal (10 pcs)'), tripLevel, 0, false), price: undefined },
    { ...buy(byName('Cheese 440g'), tripLevel, 0, false), price: undefined },
    { ...buy(byName('Toilet paper (12 rolls)'), tripLevel, 0, false), price: undefined },
  ]
  const activeTrip: Trip = {
    id: id(),
    store: tripStore,
    budget: 3000,
    startedAt: now - 24 * 60_000,
    // Newest first, like the app keeps them.
    items: [...inCart.reverse(), ...toGet],
  }

  // ── Planned for next time ──
  const list: ListItem[] = [
    { n: 'Laundry detergent 1kg', est: true },
    { n: 'Bangus (milkfish)', est: true },
    { n: 'Tomatoes 1kg', est: true },
    { n: 'Instant noodles (6)', est: true },
    { n: 'Shampoo 180ml', est: false },
    { n: 'Ice cream 1.5L', est: false },
    { n: 'Calamansi 250g', est: true },
  ].map(({ n, est }) => {
    const p = byName(n)
    return { id: id(), name: p.name, category: p.category, qty: 1, estPrice: est ? Math.round(p.price) : undefined }
  })

  return {
    settings: { currency: 'PHP', defaultBudget: 2500, theme: 'system', listSort: 'category', tripSort: 'category' },
    list,
    activeTrip,
    history,
  }
}
