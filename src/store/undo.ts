import { create } from 'zustand'
import type { Undo } from './store'

export interface UndoToast {
  id: number
  message: string
  undo: Undo
}

/** The single "Undo" banner. In memory only: an undo never outlives the session. */
export const useUndo = create<{ toast: UndoToast | null; dismiss: () => void }>((set) => ({
  toast: null,
  dismiss: () => set({ toast: null }),
}))

let seq = 0

/** Show "message · Undo"; a newer action replaces the previous banner. */
export function showUndo(message: string, undo: Undo) {
  useUndo.setState({ toast: { id: ++seq, message, undo } })
}
