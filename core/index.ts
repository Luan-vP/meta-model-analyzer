// Public barrel for the Meta-Model analysis hexagon (`@core`).
// Driving and driven adapters import everything they need from here.

// Domain
export type {
  Annotation,
  AnalysisResult,
  ViolationCategory,
  ViolationType,
} from './domain/annotation'

// Application services (prompt, schema, annotation parsing/offset resolution)
export {
  SYSTEM_PROMPT,
  ANNOTATION_JSON_SCHEMA,
  buildUserMessage,
  resolveOffsets,
  parseAnnotationsJSON,
} from './application/prompt'
export type { RawAnnotation } from './application/prompt'

// Application use case (inbound / driving port)
export { analyzeText, validateAnnotations } from './application/analyze-text'

// Outbound (driven) provider port
export type { LlmProvider, CompletionRequest } from './application/ports/llm-provider'
