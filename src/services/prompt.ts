// Re-exported from the shared hexagon (`@core`). Thin shim so existing
// `../services/prompt` imports keep working; import sites can migrate to
// `@core` directly in a later cleanup.
export {
  SYSTEM_PROMPT,
  ANNOTATION_JSON_SCHEMA,
  buildUserMessage,
  resolveOffsets,
  parseAnnotationsJSON,
} from '@core'
