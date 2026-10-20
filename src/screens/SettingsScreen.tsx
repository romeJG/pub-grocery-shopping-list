import { useRef, useState } from 'react'
import { Banknote, Wallet, Download, Upload, Trash2, Moon, ChevronsUpDown, Lock, FileText, FlaskConical, SquarePlus, Globe } from 'lucide-react'
import { Page } from '../components/Page'
import { Section, IconBadge, Row } from '../components/List'
import { SegmentedControl } from '../components/Controls'
import { Alert } from '../components/Dialog'
import { StorageMeter } from '../components/StorageMeter'
import { InstallSheet } from '../components/InstallSheet'
import { showUndo } from '../store/undo'
import { exportData, useStore } from '../store/store'
import type { Theme } from '../store/types'
import { CURRENCIES, currencySymbol, parseAmount } from '../lib/money'
import { useInstall } from '../lib/install'
import type { LegalDoc } from './LegalScreen'

export function SettingsScreen({ onOpenLegal }: { onOpenLegal: (doc: LegalDoc) => void }) {
  const settings = useStore((s) => s.settings)
  const tripCount = useStore((s) => s.history.length)
  const { updateSettings, importData, resetAll } = useStore()

  const [budget, setBudget] = useState(String(settings.defaultBudget || ''))
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmSample, setConfirmSample] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const install = useInstall()

  // Chromium can show its own install dialog; everywhere else (all of iOS) gets the manual steps.
  const addToHomeScreen = () => (install.canPrompt ? void install.promptInstall() : setShowInstall(true))

  // Dev only: the mock module is dynamically imported so it never ships in production builds.
  const loadSample = async () => {
    setConfirmSample(false)
    // The DEV check lets the bundler drop this import (and the chunk) from production.
    if (import.meta.env.DEV) {
      const { createMockState } = await import('../dev/mockData')
      importData(createMockState())
      setBudget(String(useStore.getState().settings.defaultBudget))
    }
  }
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

      {!install.installed && (
        <Section footer="Opens full screen like a regular app and works offline.">
          <Row
            leading={<IconBadge icon={SquarePlus} color="#007AFF" />}
            title="Add to Home Screen"
            accent
            onClick={addToHomeScreen}
          />
        </Section>
      )}

      <StorageMeter />

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

      {import.meta.env.DEV && (
        <Section header="Developer" footer="Only shown while running the dev server.">
          <Row
            leading={<IconBadge icon={FlaskConical} color="#FF2D55" />}
            title="Load Sample Data"
            accent
            onClick={() => setConfirmSample(true)}
          />
        </Section>
      )}

      <Section header="About">
        <Row
          leading={<IconBadge icon={Lock} color="#5856D6" />}
          title="Privacy Policy"
          chevron
          onClick={() => onOpenLegal('privacy')}
        />
        <Row
          leading={<IconBadge icon={FileText} color="#8E8E93" />}
          title="Terms of Use"
          chevron
          onClick={() => onOpenLegal('terms')}
        />
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

      <div className="mt-3 flex flex-col items-center gap-1.5 px-8 text-[13px] text-label-2">
        <span>
          © {new Date().getFullYear()} <span className="font-semibold text-label">Justine Rome M. Guillermo</span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/romeJG"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex items-center gap-1 text-blue"
          >
            <GitHubMark /> GitHub
          </a>
          <a
            href="https://romejg.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex items-center gap-1 text-blue"
          >
            <Globe size={14} strokeWidth={2.2} /> Portfolio
          </a>
        </div>
      </div>

      <InstallSheet open={showInstall} onClose={() => setShowInstall(false)} platform={install.platform} />
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
        open={confirmSample}
        title="Load sample data?"
        message="This replaces your current list, trips and settings with about 5 months of sample trips."
        onDismiss={() => setConfirmSample(false)}
        actions={[
          { label: 'Cancel', style: 'cancel', onPress: () => setConfirmSample(false) },
          { label: 'Load', onPress: () => void loadSample() },
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
              const undo = resetAll()
              const syncBudget = () => setBudget(String(useStore.getState().settings.defaultBudget))
              syncBudget()
              setConfirmReset(false)
              showUndo('All data reset', () => {
                undo()
                syncBudget()
              })
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

/** Lucide dropped brand icons, so the GitHub mark is inlined. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
