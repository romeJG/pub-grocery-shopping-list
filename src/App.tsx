import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TabBar, type Tab } from './components/TabBar'
import { TABBAR_MINIMIZE_EVENT } from './components/Page'
import { TripScreen } from './screens/TripScreen'
import { ListScreen } from './screens/ListScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { TripDetailScreen } from './screens/TripDetailScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useStore } from './store/store'

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

export default function App() {
  useTheme()
  const [tab, setTab] = useState<Tab>('trip')
  const [detail, setDetail] = useState<{ tripId: string; from: Tab } | null>(null)
  // Bumped by the tab bar's "+" accessory; screens open their add sheet when it changes.
  const [addSignal, setAddSignal] = useState({ trip: 0, list: 0 })
  const shopping = useStore((s) => s.activeTrip != null)

  // Pushing or popping a page brings the minimized tab bar back.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(TABBAR_MINIMIZE_EVENT, { detail: false }))
  }, [detail])

  const openTrip = (from: Tab) => (tripId: string) => setDetail({ tripId, from })
  const switchTab = (t: Tab) => {
    setDetail(null)
    setTab(t)
  }

  const screens: Record<Tab, React.ReactNode> = {
    trip: (
      <TripScreen
        onFinished={(id) => {
          setTab('history')
          setDetail({ tripId: id, from: 'history' })
        }}
        onOpenTrip={openTrip('trip')}
        addSignal={addSignal.trip}
      />
    ),
    list: <ListScreen onStartShopping={() => switchTab('trip')} addSignal={addSignal.list} />,
    history: <HistoryScreen onOpenTrip={openTrip('history')} />,
    settings: <SettingsScreen />,
  }

  return (
    <div className="relative mx-auto h-dvh max-w-xl overflow-hidden">
      {/* Keep tabs mounted so each keeps its scroll position, like UITabBarController */}
      {(Object.keys(screens) as Tab[]).map((t) => (
        <div key={t} className="absolute inset-0 isolate" hidden={t !== tab}>
          {screens[t]}
        </div>
      ))}

      <AnimatePresence>
        {detail && (
          <motion.div
            key={detail.tripId}
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
            <TripDetailScreen
              tripId={detail.tripId}
              onBack={() => setDetail(null)}
              onShopAgain={() => switchTab('list')}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
