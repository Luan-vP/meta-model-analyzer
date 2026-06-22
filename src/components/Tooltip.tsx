import type { ViolationType } from '../types/analysis'
import { VIOLATION_MAP, CATEGORY_COLORS } from '../data/meta-model'

interface TooltipProps {
  violationType: ViolationType
  challengeQuestion: string
  /** Viewport coordinates of the anchor's horizontal centre and top edge. */
  left: number
  top: number
}

export function Tooltip({ violationType, challengeQuestion, left, top }: TooltipProps) {
  const info = VIOLATION_MAP.get(violationType)
  if (!info) return null

  const colors = CATEGORY_COLORS[info.category]

  // Rendered in a portal with `fixed` positioning so it escapes the iteration
  // card's `overflow-hidden` (which otherwise clips it at the card boundary).
  return (
    <div
      className="fixed z-50 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg"
      style={{ left, top, transform: 'translate(-50%, calc(-100% - 8px))', pointerEvents: 'none' }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
        >
          {info.category}
        </span>
        <span className="text-xs text-zinc-500">{info.displayName}</span>
      </div>
      <p className="text-sm text-zinc-800">"{challengeQuestion}"</p>
      {/* Arrow */}
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-zinc-200 bg-white" />
    </div>
  )
}
