export type Category =
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'drinks'
  | 'snacks'
  | 'household'
  | 'personal'
  | 'other'

export interface Item {
  id: string
  name: string
  category: Category
  qty: number
  /** Unit price. Undefined until priced in-store. */
  price?: number
  inCart: boolean
}

export interface ListItem {
  id: string
  name: string
  category: Category
  qty: number
  estPrice?: number
}

export interface Trip {
  id: string
  store?: string
  budget: number
  startedAt: number
  finishedAt?: number
  items: Item[]
}

export type Theme = 'system' | 'light' | 'dark'

export type SortMode = 'category' | 'name' | 'price-desc' | 'price-asc' | 'recent'

export interface Settings {
  currency: string
  defaultBudget: number
  theme: Theme
  listSort: SortMode
  tripSort: SortMode
}

export interface PersistedState {
  settings: Settings
  list: ListItem[]
  activeTrip: Trip | null
  history: Trip[]
}
