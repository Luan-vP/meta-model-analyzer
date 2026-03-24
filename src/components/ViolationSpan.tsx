import { useState, useRef } from 'react'
import type { Annotation } from '../types/analysis'
import { CATEGORY_COLORS } from '../data/meta-model'
import { Tooltip } from './Tooltip'

interface ViolationSpanProps {
  annotation: Annotation
}

export function ViolationSpan({ annotation }: ViolationSpanProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const colors = CATEGORY_COLORS[annotation.category]
  const showTooltip = hovered || focused

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
      {showTooltip && (
        <Tooltip violationType={annotation.violationType} challengeQuestion={annotation.challengeQuestion} />
      )}
    </span>
  )
}
