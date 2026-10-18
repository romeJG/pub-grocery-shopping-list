import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TabBar, type Tab } from './components/TabBar'
import { TABBAR_MINIMIZE_EVENT } from './components/Page'
import { TripScreen } from './screens/TripScreen'
import { ListScreen } from './screens/ListScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { TripDetailScreen } from './screens/TripDetailScreen'
import { LegalScreen, type LegalDoc } from './screens/LegalScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { Alert } from './components/Dialog'
import { UndoToast } from './components/UndoToast'
import { useStore } from './store/store'
import { requestPersistence, STORAGE_ERROR_EVENT } from './lib/storage'
import { cascadeIn } from './lib/gsap'

function useTheme() {
  const theme = useStore((s) => s.settings.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
        m.setAttribute('content', dark ? '#000000' : '#F2F2F7')
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

/** Once there's data worth keeping, ask the browser not to evict it. */
function usePersistentStorage() {
  const hasData = useStore((s) => s.history.length > 0 || s.list.length > 0 || s.activeTrip != null)
  useEffect(() => {
    if (hasData) void requestPersistence()
  }, [hasData])
}

/** Surface failed saves (storage full) instead of losing changes silently. */
function useStorageErrors() {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const onError = () => setFailed(true)
    window.addEventListener(STORAGE_ERROR_EVENT, onError)
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onError)
  }, [])
  return [failed, () => setFailed(false)] as const
}

export default function App() {
  useTheme()
  usePersistentStorage()
  const [saveFailed, dismissSaveFailed] = useStorageErrors()
  const [tab, setTab] = useState<Tab>('trip')
  // A page pushed over the current tab: a past trip, or a legal document.
  const [detail, setDetail] = useState<{ kind: 'trip'; tripId: string } | { kind: 'legal'; doc: LegalDoc } | null>(null)
  // Bumped by the tab bar's "+" accessory; screens open their add sheet when it changes.
  const [addSignal, setAddSignal] = useState({ trip: 0, list: 0 })
  const shopping = useStore((s) => s.activeTrip != null)

  // Content cascades in when a tab appears (and when Shop swaps between start/active trip).
  const screenRefs = useRef<Partial<Record<Tab, HTMLDivElement | null>>>({})
  useLayoutEffect(() => {
    const content = screenRefs.current[tab]?.querySelector('[data-page-content]')
    if (content) cascadeIn([...content.children].slice(0, 8))
  }, [tab, shopping])

  // Pushing or popping a page brings the minimized tab bar back.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: false }))
  }, [detail])

  const openTrip = (tripId: string) => setDetail({ kind: 'trip', tripId })
  const switchTab = (t: Tab) => {
    setDetail(null)
    setTab(t)
  }

  const screens: Record<Tab, React.ReactNode> = {
    trip: (
      <TripScreen
        onFinished={(id) => {
          setTab('history')
          setDetail({ kind: 'trip', tripId: id })
        }}
        onOpenTrip={openTrip}
        addSignal={addSignal.trip}
      />
    ),
    list: <ListScreen onStartShopping={() => switchTab('trip')} addSignal={addSignal.list} />,
    history: <HistoryScreen onOpenTrip={openTrip} />,
    settings: <SettingsScreen onOpenLegal={(doc) => setDetail({ kind: 'legal', doc })} />,
  }

  return (
    <div className="relative mx-auto h-dvh max-w-xl overflow-hidden">
      {/* Keep tabs mounted so each keeps its scroll position, like UITabBarController */}
      {(Object.keys(screens) as Tab[]).map((t) => (
        <div key={t} ref={(el) => void (screenRefs.current[t] = el)} className="absolute inset-0 isolate" hidden={t !== tab}>
          {screens[t]}
        </div>
      ))}

      <AnimatePresence>
        {detail && (
          <motion.div
            key={detail.kind === 'trip' ? detail.tripId : detail.doc}
            className="absolute inset-0 z-10 bg-bg shadow-[-8px_0_24px_rgba(0,0,0,0.12)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 340 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100 || info.velocity.x > 500) setDetail(null)
            }}
          >
            {detail.kind === 'trip' ? (
              <TripDetailScreen
                tripId={detail.tripId}
                onBack={() => setDetail(null)}
                onShopAgain={() => switchTab('list')}
              />
            ) : (
              <LegalScreen doc={detail.doc} onBack={() => setDetail(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Alert
        open={saveFailed}
        title="Couldn’t save changes"
        message="This device’s storage for the app is full. Export a backup, then delete old trips in History to free up space."
        onDismiss={dismissSaveFailed}
        actions={[
          { label: 'OK', style: 'cancel', onPress: dismissSaveFailed },
          {
            label: 'Settings',
            onPress: () => {
              dismissSaveFailed()
              switchTab('settings')
            },
          },
        ]}
      />

      <UndoToast />

      <TabBar
        tab={tab}
        onChange={switchTab}
        accessory={
          !detail && ((tab === 'trip' && shopping) || tab === 'list')
            ? {
                label: 'Add Item',
                onPress: () => setAddSignal((s) => ({ ...s, [tab]: s[tab as 'trip' | 'list'] + 1 })),
              }
            : undefined
        }
      />
    </div>
  )
}
