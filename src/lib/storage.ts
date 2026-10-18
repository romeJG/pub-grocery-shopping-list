/**
 * localStorage is capped at ~5 MB per site on iPhone/Safari (and is the
 * tightest of the major browsers), counted as UTF-16, i.e. 2 bytes per char.
 */
export const QUOTA_BYTES = 5 * 1024 * 1024

export const STORAGE_ERROR_EVENT = 'grocery-storage-error'

/** Bytes a value occupies once serialized into localStorage. */
export const byteSize = (value: unknown) => (value == null ? 0 : JSON.stringify(value).length * 2)

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${Number((bytes / 1024 / 1024).toFixed(2))} MB`
}

/** localStorage that reports failed writes (e.g. quota exceeded) instead of throwing. */
export const safeLocalStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: error }))
    }
  },
  removeItem: (key: string) => localStorage.removeItem(key),
}

/** `null` when the browser has no persistent-storage API. */
export async function isPersisted(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null
  try {
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}

/**
 * Ask the browser not to evict our data under storage pressure. Browsers
 * decide silently (Safari grants it to Home Screen apps; Chrome to installed
 * or frequently used sites), so this never shows a prompt on iPhone.
 */
export async function requestPersistence(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return null
  }
}
