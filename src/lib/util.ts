export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function formatDate(ts: number, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(undefined, opts).format(ts)
}

export function formatRelativeDay(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Today'
  if (same(d, yesterday)) return 'Yesterday'
  const sameYear = d.getFullYear() === today.getFullYear()
  return formatDate(ts, sameYear ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported */
  }
}
