// Writes a sample backup you can load via Settings → Import Backup
// (handy for an iPhone: AirDrop the file, then import it in the app).
import { mkdirSync, writeFileSync } from 'node:fs'
import { createMockState } from '../src/dev/mockData.ts'

const out = 'mock/grocery-tracker-sample.json'
const state = createMockState()
mkdirSync('mock', { recursive: true })
writeFileSync(out, JSON.stringify({ app: 'grocery-tracker', exportedAt: new Date().toISOString(), ...state }, null, 2))
console.log(`Wrote ${out}: ${state.history.length} trips, ${state.list.length} list items, trip in progress at ${state.activeTrip?.store}`)
