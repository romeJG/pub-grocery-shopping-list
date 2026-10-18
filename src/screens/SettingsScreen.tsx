import { useRef, useState } from 'react'
import { Banknote, Wallet, Download, Upload, Trash2, Moon, ChevronsUpDown } from 'lucide-react'
import { Page } from '../components/Page'
import { Section, IconBadge } from '../components/List'
import { SegmentedControl } from '../components/Controls'
import { Alert } from '../components/Dialog'
import { exportData, useStore } from '../store/store'
import type { Theme } from '../store/types'
import { CURRENCIES, currencySymbol, parseAmount } from '../lib/money'

export function SettingsScreen() {
  const settings = useStore((s) => s.settings)
  const tripCount = useStore((s) => s.history.length)
  const { updateSettings, importData, resetAll } = useStore()

  const [budget, setBudget] = useState(String(settings.defaultBudget || ''))
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<unknown>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = async () => {
    const json = JSON.stringify({ app: 'grocery-tracker', exportedAt: new Date().toISOString(), ...exportData() }, null, 2)
    const name = `grocery-tracker-${new Date().toISOString().slice(0, 10)}.json`
    const file = new File([json], name, { type: 'application/json' })
    // On iPhone the share sheet is the natural "Save to Files" path.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Grocery Tracker backup' })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPendingImport(JSON.parse(await file.text()))
    } catch {
      setAlert({ title: 'Couldn’t Import', message: 'That file isn’t valid JSON.' })
    }
  }

  const confirmImport = () => {
    try {
      importData(pendingImport)
      setBudget(String(useStore.getState().settings.defaultBudget || ''))
      setAlert({ title: 'Backup Restored', message: 'Your list, trips and settings were imported.' })
    } catch (err) {
      setAlert({ title: 'Couldn’t Import', message: (err as Error).message })
    }
    setPendingImport(null)
  }

  return (
    <Page title="Settings">
      <Section header="Money" footer="The default budget is pre-filled each time you start a trip.">
        <label className="pressable relative flex min-h-11 items-center gap-3 pl-4">
          <IconBadge icon={Banknote} color="#34C759" />
          <div className="row-inner flex min-h-11 flex-1 items-center justify-between pr-4">
            <span className="text-[17px]">Currency</span>
            <span className="flex items-center gap-1 text-[17px] text-label-2">
              {settings.currency} ({currencySymbol(settings.currency)})
              <ChevronsUpDown size={16} />
            </span>
          </div>
          {/* Native picker: on iOS this opens the wheel */}
          <select
            value={settings.currency}
            onChange={(e) => updateSettings({ currency: e.target.value })}
            className="absolute inset-0 opacity-0"
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3 pl-4">
          <IconBadge icon={Wallet} color="#007AFF" />
          <div className="row-inner flex min-h-11 flex-1 items-center justify-between gap-3 pr-4">
            <span className="shrink-0 text-[17px]">Default Budget</span>
            <span className="flex min-w-0 items-center text-[17px] text-label-2">
              {currencySymbol(settings.currency)}
              <input
                value={budget}
                inputMode="decimal"
                placeholder="0"
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))}
                onBlur={() => updateSettings({ defaultBudget: parseAmount(budget) ?? 0 })}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                style={{ width: `${Math.max(budget.length, 1) + 0.5}ch` }}
                className="tabular max-w-32 bg-transparent text-right outline-none"
              />
            </span>
          </div>
        </label>
      </Section>

      <Section header="Appearance">
        <div className="flex min-h-[52px] items-center gap-3 px-4">
          <IconBadge icon={Moon} color="#5856D6" />
          <div className="flex-1">
            <SegmentedControl<Theme>
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'system', label: 'Auto' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section
        header="Data"
        footer="Everything is stored only in this browser on this device. Export a backup to move it or keep it safe."
      >
        <button type="button" onClick={doExport} className="pressable flex min-h-11 w-full items-center gap-3 pl-4 text-left">
          <IconBadge icon={Upload} color="#FF9500" />
          <div className="row-inner flex min-h-11 flex-1 items-center pr-4 text-[17px]">Export Backup</div>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="pressable flex min-h-11 w-full items-center gap-3 pl-4 text-left"
        >
          <IconBadge icon={Download} color="#32ADE6" />
          <div className="row-inner flex min-h-11 flex-1 items-center pr-4 text-[17px]">Import Backup</div>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </Section>

      <Section>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="pressable flex min-h-11 w-full items-center justify-center gap-2 text-[17px] text-red"
        >
          <Trash2 size={18} /> Reset All Data
        </button>
      </Section>

      <p className="px-8 text-center text-[13px] text-label-2">
        Grocery Tracker · {tripCount} {tripCount === 1 ? 'trip' : 'trips'} saved
      </p>

      <Alert
        open={pendingImport != null}
        title="Replace your data?"
        message="Importing a backup replaces your current list, trips and settings."
        onDismiss={() => setPendingImport(null)}
        actions={[
          { label: 'Cancel', style: 'cancel', onPress: () => setPendingImport(null) },
          { label: 'Replace', style: 'destructive', onPress: confirmImport },
        ]}
      />
      <Alert
        open={confirmReset}
        title="Reset all data?"
        message="This deletes your list, current trip, history and settings from this device. Export a backup first if you want to keep them."
        onDismiss={() => setConfirmReset(false)}
        actions={[
          { label: 'Cancel', style: 'cancel', onPress: () => setConfirmReset(false) },
          {
            label: 'Reset',
            style: 'destructive',
            onPress: () => {
              resetAll()
              setBudget(String(useStore.getState().settings.defaultBudget))
              setConfirmReset(false)
            },
          },
        ]}
      />
      <Alert
        open={alert != null}
        title={alert?.title ?? ''}
        message={alert?.message}
        onDismiss={() => setAlert(null)}
        actions={[{ label: 'OK', onPress: () => setAlert(null) }]}
      />
    </Page>
  )
}
