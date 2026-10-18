import {
  Apple,
  Beef,
  Fish,
  Milk,
  Croissant,
  Package,
  Snowflake,
  CupSoda,
  Cookie,
  SprayCan,
  Sparkles,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '../store/types'

export interface CategoryMeta {
  id: Category
  label: string
  icon: LucideIcon
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'produce', label: 'Produce', icon: Apple, color: '#34C759' },
  { id: 'meat', label: 'Meat', icon: Beef, color: '#FF3B30' },
  { id: 'seafood', label: 'Seafood', icon: Fish, color: '#32ADE6' },
  { id: 'dairy', label: 'Dairy & Eggs', icon: Milk, color: '#5AC8FA' },
  { id: 'bakery', label: 'Bakery', icon: Croissant, color: '#FF9500' },
  { id: 'pantry', label: 'Pantry', icon: Package, color: '#A2845E' },
  { id: 'frozen', label: 'Frozen', icon: Snowflake, color: '#007AFF' },
  { id: 'drinks', label: 'Drinks', icon: CupSoda, color: '#5856D6' },
  { id: 'snacks', label: 'Snacks', icon: Cookie, color: '#FF2D55' },
  { id: 'household', label: 'Household', icon: SprayCan, color: '#30B0C7' },
  { id: 'personal', label: 'Personal Care', icon: Sparkles, color: '#AF52DE' },
  { id: 'other', label: 'Other', icon: ShoppingBasket, color: '#8E8E93' },
]

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<Category, CategoryMeta>

export const categoryMeta = (id: Category) => byId[id] ?? byId.other

/** Group items by category in the canonical category order. */
export function groupByCategory<T extends { category: Category }>(items: T[]) {
  const groups = new Map<Category, T[]>()
  for (const item of items) {
    const arr = groups.get(item.category) ?? []
    arr.push(item)
    groups.set(item.category, arr)
  }
  return CATEGORIES.filter((c) => groups.has(c.id)).map((c) => ({ meta: c, items: groups.get(c.id)! }))
}

const KEYWORDS: [Category, string[]][] = [
  ['produce', ['apple', 'banana', 'orange', 'mango', 'grape', 'lemon', 'lime', 'berry', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'cabbage', 'lettuce', 'spinach', 'pechay', 'kangkong', 'ampalaya', 'eggplant', 'talong', 'sitaw', 'calamansi', 'ginger', 'luya', 'pepper', 'cucumber', 'avocado', 'fruit', 'veg', 'broccoli', 'squash', 'kalabasa', 'sayote', 'okra', 'pineapple', 'papaya', 'melon', 'herb', 'cilantro', 'basil']],
  ['meat', ['chicken', 'pork', 'beef', 'baboy', 'manok', 'liempo', 'ham', 'bacon', 'sausage', 'hotdog', 'longganisa', 'tocino', 'ground', 'steak', 'lamb', 'turkey', 'meat', 'chorizo']],
  ['seafood', ['fish', 'isda', 'shrimp', 'hipon', 'salmon', 'tuna', 'tilapia', 'bangus', 'squid', 'pusit', 'crab', 'clam', 'mussel', 'tahong', 'galunggong', 'dilis', 'sardine', 'prawn']],
  ['frozen', ['frozen', 'ice cream', 'nuggets', 'fries', 'popsicle']],
  ['dairy', ['milk', 'gatas', 'cheese', 'butter', 'yogurt', 'yoghurt', 'cream', 'egg', 'itlog', 'margarine']],
  ['bakery', ['bread', 'tinapay', 'pandesal', 'loaf', 'bun', 'croissant', 'cake', 'muffin', 'bagel', 'tortilla', 'pita']],
  ['drinks', ['water', 'juice', 'soda', 'coke', 'sprite', 'coffee', 'kape', 'tea', 'beer', 'wine', 'drink', 'gatorade', 'milo', 'energy']],
  ['snacks', ['chips', 'chocolate', 'candy', 'cookie', 'biscuit', 'cracker', 'popcorn', 'nuts', 'snack', 'chichirya', 'gum']],
  ['pantry', ['rice', 'bigas', 'pasta', 'noodle', 'pancit', 'flour', 'sugar', 'asukal', 'salt', 'asin', 'oil', 'mantika', 'vinegar', 'suka', 'soy', 'toyo', 'sauce', 'patis', 'ketchup', 'mayo', 'can', 'canned', 'corned', 'spam', 'cereal', 'oat', 'beans', 'spice', 'seasoning', 'magic sarap', 'bouillon', 'cube', 'honey', 'jam', 'peanut butter', 'condensed', 'evaporated']],
  ['household', ['soap', 'detergent', 'sabon', 'bleach', 'tissue', 'toilet', 'paper towel', 'trash', 'garbage', 'sponge', 'dish', 'downy', 'fabric', 'cleaner', 'foil', 'cling', 'battery', 'bulb', 'zonrox']],
  ['personal', ['shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'razor', 'pad', 'napkin', 'diaper', 'vitamin', 'medicine', 'alcohol', 'cotton', 'floss', 'sunscreen', 'body wash']],
]

/** Best-effort category guess from an item name. */
export function guessCategory(name: string): Category | undefined {
  const n = name.toLowerCase()
  let best: { cat: Category; len: number } | undefined
  for (const [cat, words] of KEYWORDS) {
    for (const w of words) {
      // Match at word starts so "rice" isn't "ice" and "shampoo" isn't "ham";
      // the longest keyword wins so "peanut butter" beats "butter".
      if (w.length > (best?.len ?? 0) && new RegExp(`\\b${w}`).test(n)) best = { cat, len: w.length }
    }
  }
  return best?.cat
}
