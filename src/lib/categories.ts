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
  ['produce', ['apple', 'banana', 'orange', 'mango', 'grape', 'lemon', 'lime', 'berry', 'strawberry', 'blueberry', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'cabbage', 'lettuce', 'spinach', 'pechay', 'kangkong', 'ampalaya', 'eggplant', 'talong', 'sitaw', 'calamansi', 'ginger', 'luya', 'pepper', 'cucumber', 'avocado', 'fruit', 'vegetable', 'veggie', 'broccoli', 'squash', 'kalabasa', 'sayote', 'okra', 'pineapple', 'papaya', 'melon', 'herb', 'cilantro', 'basil']],
  ['meat', ['chicken', 'pork', 'beef', 'baboy', 'manok', 'liempo', 'ham', 'bacon', 'sausage', 'hotdog', 'longganisa', 'tocino', 'ground', 'steak', 'lamb', 'turkey', 'meat', 'chorizo']],
  ['seafood', ['fish', 'isda', 'shrimp', 'hipon', 'salmon', 'tuna', 'tilapia', 'bangus', 'squid', 'pusit', 'crab', 'clam', 'mussel', 'tahong', 'galunggong', 'dilis', 'sardine', 'prawn']],
  ['frozen', ['frozen', 'ice cream', 'nugget', 'fries', 'popsicle']],
  ['dairy', ['milk', 'gatas', 'cheese', 'butter', 'yogurt', 'yoghurt', 'cream', 'egg', 'itlog', 'margarine']],
  ['bakery', ['ensaymada', 'bread', 'tinapay', 'pandesal', 'loaf', 'bun', 'croissant', 'cake', 'muffin', 'bagel', 'tortilla', 'pita']],
  ['drinks', ['water', 'juice', 'soda', 'coke', 'sprite', 'coffee', 'kape', 'tea', 'beer', 'wine', 'drink', 'gatorade', 'milo', 'energy']],
  ['snacks', ['potato chips', 'chips', 'chocolate', 'candy', 'cookie', 'biscuit', 'cracker', 'popcorn', 'nuts', 'peanuts', 'snack', 'chichirya', 'gum']],
  ['pantry', ['rice', 'bigas', 'pasta', 'noodle', 'pancit', 'flour', 'sugar', 'asukal', 'salt', 'asin', 'oil', 'mantika', 'vinegar', 'suka', 'soy', 'toyo', 'sauce', 'patis', 'ketchup', 'mayo', 'mayonnaise', 'canned', 'corned beef', 'spaghetti', 'macaroni', 'oatmeal', 'corned', 'spam', 'cereal', 'oat', 'beans', 'spice', 'seasoning', 'magic sarap', 'bouillon', 'cube', 'honey', 'jam', 'peanut butter', 'condensed', 'evaporated']],
  ['household', ['soap', 'detergent', 'sabon', 'bleach', 'tissue', 'toilet', 'paper towel', 'trash', 'garbage', 'sponge', 'dishwashing', 'dish soap', 'downy', 'fabric', 'fabric conditioner', 'cleaner', 'foil', 'cling', 'battery', 'bulb', 'zonrox']],
  ['personal', ['bath soap', 'body soap', 'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'razor', 'pad', 'napkin', 'diaper', 'vitamin', 'medicine', 'alcohol', 'cotton', 'floss', 'sunscreen', 'body wash']],
]

const patterns = new Map<string, RegExp>()
/** "egg" → eggs, "tomato" → tomatoes, "berry" → berries, as whole words. */
function wordPattern(w: string) {
  let re = patterns.get(w)
  if (!re) {
    const plural = w.endsWith('y') ? `|${w.slice(0, -1)}ies` : ''
    re = new RegExp(`\\b(?:${w}(?:e?s)?${plural})\\b`)
    patterns.set(w, re)
  }
  return re
}

/** Words that decide the category on their own, whatever follows ("canned tuna", "frozen peas"). */
const MODIFIERS: [RegExp, Category][] = [
  [/\bcanned\b/, 'pantry'],
  [/\bfrozen\b/, 'frozen'],
]

/**
 * Best-effort category guess from an item name. The keyword that appears
 * last wins, since the last word usually names the thing ("orange juice" is a
 * drink); at the same spot the longer phrase wins ("peanut butter" over "butter").
 */
export function guessCategory(name: string): Category | undefined {
  const n = name.toLowerCase()
  for (const [re, cat] of MODIFIERS) if (re.test(n)) return cat
  let best: { cat: Category; end: number; len: number } | undefined
  for (const [cat, words] of KEYWORDS) {
    for (const w of words) {
      // Whole words (plurals allowed) so "rice" isn't "ice" and "candle" isn't "can".
      const m = wordPattern(w).exec(n)
      if (!m) continue
      const end = m.index + m[0].length
      if (!best || end > best.end || (end === best.end && w.length > best.len)) best = { cat, end, len: w.length }
    }
  }
  return best?.cat
}
