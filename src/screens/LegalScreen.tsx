import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Page, GlassButton } from '../components/Page'

export type LegalDoc = 'privacy' | 'terms'

const EFFECTIVE = 'October 18, 2026'
const CONTACT_URL = 'https://github.com/romeJG/pub-grocery-shopping-list/issues'

interface Block {
  heading: string
  body: ReactNode
}

const Contact = () => (
  <>
    Questions or requests? Open an issue at{' '}
    <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="text-blue underline-offset-2 hover:underline">
      github.com/romeJG/pub-grocery-shopping-list
    </a>
    .
  </>
)

const DOCS: Record<LegalDoc, { title: string; summary: string; blocks: Block[] }> = {
  privacy: {
    title: 'Privacy Policy',
    summary:
      'Grocery Tracker keeps your data on your device. There are no accounts, no analytics, no ads and no tracking, and we never see, collect, share or sell what you enter.',
    blocks: [
      {
        heading: 'What the app stores',
        body: 'Your shopping list, trips (items, prices, quantities, store names, budgets and dates) and your settings (currency, default budget and theme).',
      },
      {
        heading: 'Where it’s stored',
        body: 'Only in your browser’s local storage on this device. It isn’t uploaded to a server and isn’t synced between devices or browsers. On iPhone, the Home Screen app and Safari keep separate copies.',
      },
      {
        heading: 'Backups you export',
        body: 'Export Backup creates a file containing your data. You choose where it goes, and it’s handled by that app or service’s own privacy terms. Import Backup reads a file you pick, on your device only.',
      },
      {
        heading: 'Network requests',
        body: 'The app downloads its own files from the website that hosts it and then works offline. Like most websites, that host may keep standard server logs, such as IP address, device type and request time. The app adds no trackers, cookies or third-party scripts.',
      },
      {
        heading: 'Deleting your data',
        body: 'Use Settings → Reset All Data, or clear this website’s data in your browser settings. Removing the Home Screen app also removes its data. Because nothing is stored with us, there’s nothing for us to delete on our side.',
      },
      {
        heading: 'Children',
        body: 'The app doesn’t collect personal information from anyone, including children.',
      },
      {
        heading: 'Changes to this policy',
        body: 'If this policy changes, the updated version will appear here with a new effective date.',
      },
      { heading: 'Contact', body: <Contact /> },
    ],
  },
  terms: {
    title: 'Terms of Use',
    summary:
      'Grocery Tracker is a free personal tool for tracking grocery spending. By using it, you agree to these terms.',
    blocks: [
      {
        heading: 'Using the app',
        body: 'You may use the app for personal, non-commercial purposes. Please don’t try to disrupt, overload or misuse the website that serves it.',
      },
      {
        heading: 'Your data is your responsibility',
        body: 'Everything you enter is stored only on your device. It can be lost if you clear your browser data, your device runs out of storage, or the device is lost or reset. Export a backup regularly if your history matters to you.',
      },
      {
        heading: 'Not financial advice',
        body: 'Budgets, totals and projections are based only on what you enter and are for personal tracking. They may differ from actual store prices, discounts, taxes or receipts. Always check your receipt.',
      },
      {
        heading: 'Provided “as is”',
        body: 'The app is provided as is and as available, without warranties of any kind. It may contain bugs, and features may change or be removed at any time.',
      },
      {
        heading: 'Limitation of liability',
        body: 'To the fullest extent permitted by law, the developer isn’t liable for lost data, overspending, or any indirect or consequential damages from using the app.',
      },
      {
        heading: 'Changes to these terms',
        body: 'These terms may be updated. Continuing to use the app after an update means you accept the new terms.',
      },
      { heading: 'Contact', body: <Contact /> },
    ],
  },
}

export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }) {
  const { title, summary, blocks } = DOCS[doc]
  return (
    <Page
      title={title}
      leading={
        <GlassButton onClick={onBack} label="Back">
          <ChevronLeft size={26} strokeWidth={2.4} className="-ml-0.5" />
        </GlassButton>
      }
    >
      <p className="-mt-2 px-5 pb-5 text-[15px] text-label-2">Effective {EFFECTIVE}</p>

      <div className="mx-4 mb-6 rounded-[26px] bg-card p-5 text-[17px] leading-[24px]">{summary}</div>

      <div className="mx-4 space-y-5 px-1">
        {blocks.map((b) => (
          <section key={b.heading}>
            <h2 className="text-[17px] font-semibold">{b.heading}</h2>
            <p className="mt-1 text-[15px] leading-[22px] text-label-2">{b.body}</p>
          </section>
        ))}
      </div>
    </Page>
  )
}
