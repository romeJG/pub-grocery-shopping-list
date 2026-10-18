import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { uid } from '../lib/util'
import { safeLocalStorage } from '../lib/storage'
import type { Category, Item, ListItem, PersistedState, Settings, Trip } from './types'

export const STORAGE_KEY = 'grocery-tracker:v1'

const defaultSettings: Settings = {
  currency: 'PHP',
  defaultBudget: 2000,
  theme: 'system',
  listSort: 'category',
  tripSort: 'category',
}

const initialState: PersistedState = {
  settings: defaultSettings,
  list: [],
  activeTrip: null,
  history: [],
}

export interface NewItem {
  name: string
  category: Category
  qty: number
  price?: number
}

interface Actions {
  updateSettings: (patch: Partial<Settings>) => void

  /** Returns the new item's id. */
  addListItem: (item: Omit<ListItem, 'id'>) => string
  updateListItem: (id: string, patch: Partial<ListItem>) => void
  removeListItem: (id: string) => void
  clearList: () => void
  replaceList: (items: Omit<ListItem, 'id'>[]) => void

  startTrip: (opts: { budget: number; store?: string; includeList: boolean }) => void
  updateTrip: (patch: Partial<Pick<Trip, 'budget' | 'store'>>) => void
  /** Returns the new item's id. */
  addTripItem: (item: NewItem & { inCart?: boolean }) => string
  updateTripItem: (id: string, patch: Partial<Item>) => void
  removeTripItem: (id: string) => void
  /** Mark as in-cart and move to the top so the cart reads newest-first. */
  moveToCart: (id: string, patch?: Partial<Item>) => void
  finishTrip: () => void
  cancelTrip: () => void

  deleteHistoryTrip: (id: string) => void

  importData: (data: unknown) => void
  resetAll: () => void
}

export type Store = PersistedState & Actions

const mapTrip = (s: PersistedState, fn: (t: Trip) => Trip): Partial<PersistedState> =>
  s.activeTrip ? { activeTrip: fn(s.activeTrip) } : {}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addListItem: (item) => {
        const id = uid()
        set((s) => ({ list: [...s.list, { ...item, id }] }))
        return id
      },
      updateListItem: (id, patch) =>
        set((s) => ({ list: s.list.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      removeListItem: (id) => set((s) => ({ list: s.list.filter((i) => i.id !== id) })),
      clearList: () => set({ list: [] }),
      replaceList: (items) => set({ list: items.map((i) => ({ ...i, id: uid() })) }),

      startTrip: ({ budget, store, includeList }) =>
        set((s) => ({
          activeTrip: {
            id: uid(),
            budget,
            store: store?.trim() || undefined,
            startedAt: Date.now(),
            items: includeList
              ? s.list.map((l) => ({
                  id: uid(),
                  name: l.name,
                  category: l.category,
                  qty: l.qty,
                  price: l.estPrice,
                  inCart: false,
                }))
              : [],
          },
          list: includeList ? [] : s.list,
        })),
      updateTrip: (patch) => set((s) => mapTrip(s, (t) => ({ ...t, ...patch }))),
      addTripItem: (item) => {
        const id = uid()
        set((s) => mapTrip(s, (t) => ({ ...t, items: [{ id, inCart: true, ...item }, ...t.items] })))
        return id
      },
      updateTripItem: (id, patch) =>
        set((s) =>
          mapTrip(s, (t) => ({ ...t, items: t.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
        ),
      removeTripItem: (id) =>
        set((s) => mapTrip(s, (t) => ({ ...t, items: t.items.filter((i) => i.id !== id) }))),
      moveToCart: (id, patch) =>
        set((s) =>
          mapTrip(s, (t) => {
            const item = t.items.find((i) => i.id === id)
            if (!item) return t
            return { ...t, items: [{ ...item, ...patch, inCart: true }, ...t.items.filter((i) => i.id !== id)] }
          }),
        ),
      finishTrip: () =>
        set((s) => {
          if (!s.activeTrip) return {}
          const done: Trip = {
            ...s.activeTrip,
            finishedAt: Date.now(),
            items: s.activeTrip.items.filter((i) => i.inCart),
          }
          // Anything not picked up goes back to the planned list for next time.
          const leftovers: ListItem[] = s.activeTrip.items
            .filter((i) => !i.inCart)
            .map((i) => ({ id: uid(), name: i.name, category: i.category, qty: i.qty, estPrice: i.price }))
          return { activeTrip: null, history: [done, ...s.history], list: [...s.list, ...leftovers] }
        }),
      cancelTrip: () =>
        set((s) => {
          if (!s.activeTrip) return {}
          const back: ListItem[] = s.activeTrip.items.map((i) => ({
            id: uid(),
            name: i.name,
            category: i.category,
            qty: i.qty,
            estPrice: i.price,
          }))
          return { activeTrip: null, list: [...s.list, ...back] }
        }),

      deleteHistoryTrip: (id) => set((s) => ({ history: s.history.filter((t) => t.id !== id) })),

      importData: (data) => {
        const parsed = validateImport(data)
        set(parsed)
      },
      resetAll: () => set({ ...initialState, settings: { ...defaultSettings } }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // Failed writes (storage full) are reported via STORAGE_ERROR_EVENT instead of being lost silently.
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (s): PersistedState => ({
        settings: s.settings,
        list: s.list,
        activeTrip: s.activeTrip,
        history: s.history,
      }),
      migrate: (persisted) => persisted as PersistedState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>
        return { ...current, ...p, settings: { ...defaultSettings, ...p.settings } }
      },
    },
  ),
)

function validateImport(data: unknown): PersistedState {
  if (!data || typeof data !== 'object') throw new Error('File is not valid JSON data.')
  const d = data as Partial<PersistedState>
  if (!Array.isArray(d.list) || !Array.isArray(d.history) || typeof d.settings !== 'object') {
    throw new Error("This doesn't look like a Grocery Tracker backup.")
  }
  return {
    settings: { ...defaultSettings, ...d.settings },
    list: d.list,
    history: d.history,
    activeTrip: d.activeTrip ?? null,
  }
}

export function exportData(): PersistedState {
  const { settings, list, activeTrip, history } = useStore.getState()
  return { settings, list, activeTrip, history }
}
