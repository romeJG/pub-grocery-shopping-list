import type { ReactNode } from 'react'
import { Ellipsis, EllipsisVertical, Share, SquarePlus } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import type { InstallPlatform } from '../lib/install'

const Glyph = ({ icon: Icon }: { icon: React.ElementType }) => (
  <Icon size={18} strokeWidth={2.2} className="mx-0.5 inline-block -translate-y-px align-middle text-blue" />
)

const STEPS: Record<InstallPlatform, ReactNode[]> = {
  ios: [
    <>
      Tap <Glyph icon={Share} /> <b>Share</b> in Safari’s toolbar. If you don’t see it, tap <Glyph icon={Ellipsis} /> first.
    </>,
    <>
      Scroll down and tap <Glyph icon={SquarePlus} /> <b>Add to Home Screen</b>.
    </>,
    <>
      Keep <b>Open as Web App</b> on, then tap <b>Add</b>.
    </>,
  ],
  android: [
    <>
      Tap <Glyph icon={EllipsisVertical} /> in your browser’s toolbar.
    </>,
    <>
      Tap <b>Add to Home screen</b> or <b>Install app</b>.
    </>,
    <>
      Tap <b>Install</b> to confirm.
    </>,
  ],
  other: [
    <>Look for the install icon at the right end of the address bar.</>,
    <>
      Or open the browser menu and choose <b>Install</b> or <b>Add to Home Screen</b>.
    </>,
  ],
}

/** Manual install steps, for browsers with no install prompt (all of iOS). */
export function InstallSheet({ open, onClose, platform }: { open: boolean; onClose: () => void; platform: InstallPlatform }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Add to Home Screen">
      <div className="px-4 pt-2">
        <p className="px-4 pb-4 text-[15px] leading-5 text-label-2">
          Open Grocery Tracker from your Home Screen like a regular app: full screen, works offline, and your data is
          kept safe from automatic cleanup.
        </p>
        <ol className="ios-list overflow-hidden rounded-[26px] bg-card">
          {STEPS[platform].map((step, i) => (
            <li key={i} className="flex items-start gap-3 pl-4">
              <span className="mt-3 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue text-[13px] font-semibold text-white">
                {i + 1}
              </span>
              <div className="row-inner flex-1 py-3 pr-4 text-[17px] leading-6 [&_b]:font-semibold">{step}</div>
            </li>
          ))}
        </ol>
      </div>
    </BottomSheet>
  )
}
