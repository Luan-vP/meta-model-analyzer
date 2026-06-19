import type { Annotation } from '../domain/annotation'
import type { LlmProvider } from './ports/llm-provider'
import {
  SYSTEM_PROMPT,
  ANNOTATION_JSON_SCHEMA,
  buildUserMessage,
  parseAnnotationsJSON,
  resolveOffsets,
  type RawAnnotation,
} from './prompt'

const VALID_TYPES = ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.violationType
  .enum as readonly string[]
const VALID_CATEGORIES = ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.category
  .enum as readonly string[]

/**
 * Keep only well-formed annotations whose violationType/category are valid
 * enum members. Centralised here so every provider gets identical validation
 * (previously Claude validated strictly while WebLLM did not).
 */
export function validateAnnotations(raw: unknown): RawAnnotation[] {
  const arr = Array.isArray(raw) ? raw : []
  return arr.filter(
    (a): a is RawAnnotation =>
      typeof a === 'object' &&
      a !== null &&
      typeof (a as Record<string, unknown>).text === 'string' &&
      typeof (a as Record<string, unknown>).violationType === 'string' &&
      typeof (a as Record<string, unknown>).category === 'string' &&
      typeof (a as Record<string, unknown>).challengeQuestion === 'string' &&
      VALID_TYPES.includes((a as Record<string, string>).violationType) &&
      VALID_CATEGORIES.includes((a as Record<string, string>).category),
  )
}

/**
 * Inbound (driving) use case: run a Meta-Model analysis through any provider.
 * Builds the prompt, asks the provider to complete, then parses + validates +
 * resolves offsets — the provider-agnostic pipeline.
 */
export async function analyzeText(provider: LlmProvider, text: string): Promise<Annotation[]> {
  const raw = await provider.complete({
    system: SYSTEM_PROMPT,
    user: buildUserMessage(text),
    schema: ANNOTATION_JSON_SCHEMA,
  })

  const parsed = parseAnnotationsJSON(raw) as { annotations?: unknown }
  const rawAnnotations = parsed.annotations ?? parsed
  return resolveOffsets(text, validateAnnotations(rawAnnotations))
}
