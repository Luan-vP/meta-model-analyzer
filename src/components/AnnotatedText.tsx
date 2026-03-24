import type { AnalysisResult } from '../types/analysis'
import { ViolationSpan } from './ViolationSpan'
import { CATEGORY_COLORS } from '../data/meta-model'
import type { ViolationCategory } from '../types/analysis'

interface AnnotatedTextProps {
  result: AnalysisResult
}

export function AnnotatedText({ result }: AnnotatedTextProps) {
  const { originalText, annotations } = result

  if (annotations.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-zinc-500">No Meta-Model violations detected in this text.</p>
      </div>
    )
  }

  // Build segments
  const segments: React.ReactNode[] = []
  let cursor = 0

  for (const annotation of annotations) {
    if (cursor < annotation.startOffset) {
      segments.push(
        <span key={`plain-${cursor}`}>{originalText.slice(cursor, annotation.startOffset)}</span>,
      )
    }
    segments.push(<ViolationSpan key={`v-${annotation.startOffset}`} annotation={annotation} />)
    cursor = annotation.endOffset
  }

  if (cursor < originalText.length) {
    segments.push(<span key={`plain-${cursor}`}>{originalText.slice(cursor)}</span>)
  }

  // Count violations by category
  const counts = annotations.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-zinc-600">
          {annotations.length} violation{annotations.length !== 1 ? 's' : ''} found
        </span>
        <div className="flex gap-3">
          {(Object.entries(counts) as [ViolationCategory, number][]).map(([category, count]) => {
            const colors = CATEGORY_COLORS[category]
            return (
              <span key={category} className="inline-flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors.underline }}
                />
                <span className="capitalize text-zinc-600">
                  {category} ({count})
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Annotated text */}
      <div className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-6 text-base leading-relaxed text-zinc-800">
        {segments}
      </div>
    </div>
  )
}
