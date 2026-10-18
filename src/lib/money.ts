export const CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'INR', label: 'Indian Rupee' },
] as const

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(value: number, currency: string, opts?: { compact?: boolean }) {
  const key = `${currency}:${opts?.compact ? 'c' : 'f'}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      ...(opts?.compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
    })
    formatters.set(key, f)
  }
  return f.format(value)
}

export function currencySymbol(currency: string) {
  return (
    new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? currency
  )
}

/** Parse a user-typed amount; returns undefined for blank/invalid input. */
export function parseAmount(raw: string): number | undefined {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return undefined
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined
}
