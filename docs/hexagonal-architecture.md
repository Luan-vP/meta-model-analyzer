# Hexagonal architecture & migration

This repo is being moved to a **hexagonal (ports & adapters)** layout so the
Meta-Model analysis logic lives in one place and is reused across every surface
(desktop web app, browser extension, and a planned Obsidian plugin) instead of
being copy-pasted and drifting.

## The hexagon

```
core/                              # the hexagon — pure TS, no framework/DOM/SDK/fetch assumptions
  domain/
    annotation.ts                  # Annotation, ViolationType, ViolationCategory, AnalysisResult
  application/
    prompt.ts                      # SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, buildUserMessage,
                                   #   resolveOffsets, parseAnnotationsJSON, RawAnnotation
    analyze-text.ts                # inbound use case: analyzeText(provider, text); validateAnnotations
    ports/
      llm-provider.ts              # outbound (driven) port: LlmProvider.complete(CompletionRequest)
  index.ts                         # @core barrel (the public surface)

adapters/
  providers/                       # driven (secondary) adapters — implement LlmProvider
    claude.ts                      # ClaudeProvider (Anthropic SDK) — portable
    ollama.ts                      # OllamaProvider (fetch /api/chat)   — portable
```

**Driving (primary) adapters** are the UIs that call the `analyzeText` use case:

- **desktop** — the React app at `src/` (also hosts the desktop-only
  `WebLLMService` adapter, which needs WebGPU + a worker and so isn't shared).
- **extension** — `extension/` (Phase 3, see below).
- **obsidian** — `obsidian/` (Phase 4, see below).

### Ports

- **Inbound / driving port:** `analyzeText(provider, text): Promise<Annotation[]>`
  (`core/application/analyze-text.ts`). Owns the whole pipeline:
  build prompt → `provider.complete()` → `parseAnnotationsJSON` →
  `validateAnnotations` → `resolveOffsets`.
- **Outbound / driven port:** `LlmProvider.complete(CompletionRequest): Promise<string>`
  (`core/application/ports/llm-provider.ts`). An adapter only runs the model and
  returns raw text; all post-processing is shared in the use case.

### Module aliases

`@core` → `core/index.ts`, `@adapters/*` → `adapters/*`. Configured in
`tsconfig.app.json` (`paths` + `include`) and `vite.config.ts` (`resolve.alias`).
No build/publish step — each surface bundles `core/` + `adapters/` into its own
output. Can be promoted to npm workspaces later without moving files.

## Status

- **Phase 1 — core extraction ✅** Types, prompt/schema, offset+JSON helpers, and
  the provider port moved into `core/`. `src/types/analysis.ts`,
  `src/services/prompt.ts`, `src/types/llm.ts` are thin re-export **shims** so
  existing import sites still work (migrate them to `@core` and delete the shims
  in a later cleanup). `ProviderType` stays desktop-local.
- **Phase 2 — narrow port + Ollama ✅** Port narrowed to `complete()`;
  `AnalyzeText` use case added; Claude moved to `adapters/providers/claude.ts`;
  **new** `adapters/providers/ollama.ts`; WebLLM refactored to the narrow port;
  desktop gained a "Local (Ollama)" provider with URL/model settings. Verified
  end-to-end against a real local Ollama server.

## Remaining work

### Phase 3 — refactor the extension onto `core/`

The extension (`extension/`) currently has its **own** drifted copies of the
prompt, schema, types, and an `OllamaService` that predates the shared core.

- Delete `extension/src/prompt.ts` and `extension/src/types.ts`; import from
  `@core` instead (the extension inherits the richer canonical prompt).
- Replace `extension/src/ollama-service.ts` with the shared
  `OllamaProvider` from `@adapters/providers/ollama` + the `analyzeText` use case.
- `extension/src/background.ts` `handleAnalyze(text, model, url)` becomes:
  `analyzeText(new OllamaProvider(url, model), text)`.
- **Build:** confirm/define the extension's bundler (esbuild) and give it `@core`
  / `@adapters` alias resolution so it inlines `core/` + `adapters/`.
- Result: one source of truth; identical analysis behaviour to the desktop.

### Phase 4 — Obsidian plugin (`obsidian/`, a driving adapter)

A subfolder plugin that analyzes text inside a vault, **defaulting to Ollama**.

- `obsidian/manifest.json` + esbuild bundle (`main.ts`); reuses `@core` +
  `@adapters/providers/{ollama,claude}`. No WebLLM (WebGPU is unreliable in
  Obsidian's Electron; Ollama is the natural local default).
- Settings tab: provider (default **Ollama**), base URL (`http://localhost:11434`),
  model; optional Claude API key.
- A command **"Analyze selection / current note"** that runs `analyzeText` and a
  right-sidebar view rendering the annotated text + challenge-question tooltips.
- **Caveat:** Obsidian requests originate from the `app://obsidian.md` origin, so
  Ollama needs `OLLAMA_ORIGINS` set (same 403 guidance the desktop/extension surface).

## Notes

- `CLAUDE.md` documents an earlier Cloud Run deployment; the live deployment is
  GitHub Pages (see `README.md` → Deployment). HTTPS enforcement is required —
  WebGPU and `crypto.randomUUID` are secure-context-only.
- The shims from Phase 1 are transitional; a cleanup pass can repoint import
  sites at `@core`/`@adapters` and remove them.
