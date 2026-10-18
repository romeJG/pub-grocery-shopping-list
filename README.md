# Grocery Tracker

Mobile-first, iOS-styled grocery budget tracker. Frontend only — all data lives in `localStorage` (`grocery-tracker:v1`).

```bash
npm install
npm run dev      # http://localhost:5180 (also exposed on your LAN for testing on a phone)
npm run build    # type-check + production build with PWA service worker
npm run preview  # serve the production build
```

Open it on your phone and use **Share → Add to Home Screen** to install it; it works offline in the store.

## Structure

- `src/store/` — zustand store persisted to localStorage, types, derived selectors
- `src/screens/` — Shop (active trip), List, History, Trip detail, Settings
- `src/components/` — iOS-style building blocks (bottom sheet, alerts, swipe-to-delete row, budget ring, segmented control…)
- `src/lib/` — money formatting, categories (+ keyword auto-categorize), utils
# pub-grocery-shopping-list
