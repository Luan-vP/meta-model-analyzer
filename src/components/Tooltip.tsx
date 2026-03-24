import type { ViolationType } from '../types/analysis'
import { VIOLATION_MAP, CATEGORY_COLORS } from '../data/meta-model'

interface TooltipProps {
  violationType: ViolationType
  challengeQuestion: string
  style?: React.CSSProperties
}

export function Tooltip({ violationType, challengeQuestion, style }: TooltipProps) {
  const info = VIOLATION_MAP.get(violationType)
  if (!info) return null

  const colors = CATEGORY_COLORS[info.category]

  return (
    <div
      className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg"
      style={style}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
        >
          {info.category}
        </span>
        <span className="text-sm font-medium text-zinc-800">{info.displayName}</span>
      </div>
      <p className="text-sm italic text-zinc-600">"{challengeQuestion}"</p>
      {/* Arrow */}
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-zinc-200 bg-white" />
    </div>
  )
}
