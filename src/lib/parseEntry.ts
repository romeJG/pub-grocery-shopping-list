export interface ParsedEntry {
  name: string
  qty?: number
  /** Unit price. */
  price?: number
}

// Price: "25", "25.50", "1,250" or "1,250.75", optionally prefixed with a currency sign.
const PRICE = String.raw`[₱$€£¥]?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)`
/** "… 3@25", "… 3 @ ₱25.50", "… @25" at the end of the text. */
const QTY_AT_PRICE = new RegExp(String.raw`\s*(?:(\d+)\s*)?@\s*${PRICE}\s*$`)
/** "… x3", "… ×3" or "… 3x" at the end of the text (not "6×500ml": that doesn't end the text). */
const TIMES_QTY = /\s+(?:[x×]\s*(\d+)|(\d+)\s*[x×])\s*$/i

/**
 * Parse quick-entry shorthand typed after an item name:
 *   "candle stick 3@25" → { name: "candle stick", qty: 3, price: 25 }
 *   "eggs @270"        → { name: "eggs", price: 270 }
 *   "coke 1.5L x2"     → { name: "coke 1.5L", qty: 2 }
 * Text without shorthand is returned unchanged (trimmed).
 */
export function parseEntry(raw: string): ParsedEntry {
  let name = raw
  let qty: number | undefined
  let price: number | undefined

  const at = name.match(QTY_AT_PRICE)
  if (at?.index !== undefined) {
    if (at[1]) qty = Number.parseInt(at[1], 10)
    price = Number.parseFloat(at[2].replace(/,/g, ''))
    name = name.slice(0, at.index)
  } else {
    const times = name.match(TIMES_QTY)
    if (times?.index !== undefined) {
      qty = Number.parseInt(times[1] ?? times[2], 10)
      name = name.slice(0, times.index)
    }
  }

  if (qty !== undefined && !(qty >= 1 && qty <= 999)) qty = undefined
  if (price !== undefined && !Number.isFinite(price)) price = undefined
  return { name: name.trim(), qty, price }
}
