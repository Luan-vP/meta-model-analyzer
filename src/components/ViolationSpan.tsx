import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Annotation } from '../types/analysis'
import { CATEGORY_COLORS } from '../data/meta-model'
import { Tooltip } from './Tooltip'

interface ViolationSpanProps {
  annotation: Annotation
}

// Half the tooltip width (w-72 = 288px) plus a small gutter, used to keep the
// tooltip from spilling past either viewport edge.
const TOOLTIP_HALF = 152

export function ViolationSpan({ annotation }: ViolationSpanProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const colors = CATEGORY_COLORS[annotation.category]
  const showTooltip = hovered || focused

  const updatePosition = useCallback(() => {
    const el = spanRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const center = r.left + r.width / 2
    const left = Math.min(Math.max(center, TOOLTIP_HALF), window.innerWidth - TOOLTIP_HALF)
    setCoords({ left, top: r.top })
  }, [])

  // Keep the portalled tooltip anchored to the span while it's open, even if the
  // page scrolls or resizes underneath it.
  useEffect(() => {
    if (!showTooltip) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [showTooltip, updatePosition])

  return (
    <span className="relative inline" ref={spanRef}>
      <span
        className="cursor-pointer rounded-sm transition-colors"
        style={{
          textDecoration: 'underline',
          textDecorationColor: colors.underline,
          textDecorationStyle: 'wavy',
          textDecorationThickness: '2px',
          textUnderlineOffset: '3px',
          backgroundColor: showTooltip ? colors.badgeBg : 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
        role="button"
        aria-label={`${annotation.category} violation: ${annotation.violationType}`}
      >
        {annotation.text}
      </span>
      {showTooltip &&
        coords &&
        createPortal(
          <Tooltip
            violationType={annotation.violationType}
            challengeQuestion={annotation.challengeQuestion}
            left={coords.left}
            top={coords.top}
          />,
          document.body,
        )}
    </span>
  )
}
