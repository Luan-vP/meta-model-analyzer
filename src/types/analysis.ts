// Re-exported from the shared hexagon (`@core`). Thin shim so existing
// `../types/analysis` imports keep working; import sites can migrate to
// `@core` directly in a later cleanup.
export type {
  Annotation,
  AnalysisResult,
  ViolationCategory,
  ViolationType,
} from '@core'
