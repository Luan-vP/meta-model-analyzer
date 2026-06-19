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

// Ports
export type { LLMService } from './application/ports/llm-provider'
