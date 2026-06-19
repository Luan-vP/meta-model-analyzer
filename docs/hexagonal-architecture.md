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
- **Phase 3 — extension onto `core/` ✅** Brought the MV3 extension over from the
  pre-hexagon `fix/extension-mv3-build` lineage. Deleted its duplicated
  `prompt.ts`/`ollama-service.ts`; `types.ts` slimmed to extension message shapes
  + `@core` re-exports; `background.ts` calls `analyzeText(new OllamaProvider(...))`.
  Build switched from per-file `tsc` to **esbuild** (background/popup ESM, content
  IIFE) with `@core`/`@adapters` aliases inlining the hexagon. Verified by build +
  bundle inspection (not live-loaded in a browser here).
- **Phase 4 — Obsidian plugin ✅** New `obsidian/` driving adapter: esbuild CJS
  bundle that externalizes `obsidian` + node builtins and inlines `@core` +
  `@adapters/providers/{ollama,claude}`. Command "Analyze selection / current
  note", right-sidebar `ItemView` with challenge-question tooltips, settings
  (default **Ollama**, URL/model, optional Claude key), `OLLAMA_ORIGINS`
  guidance for the `app://obsidian.md` origin. No WebLLM (WebGPU is unreliable in
  Obsidian's Electron). Verified by build + `tsc --noEmit` (not live-tested in
  Obsidian — no runtime available here).

## Per-surface builds

| Surface | Location | Bundler | Output |
| --- | --- | --- | --- |
| Desktop | `src/` + root | Vite (`npm run build`) | `dist/` (GitHub Pages) |
| Extension | `extension/` | esbuild (`npm run build` in `extension/`) | `extension/dist/` (load unpacked) |
| Obsidian | `obsidian/` | esbuild (`npm run build` in `obsidian/`) | `obsidian/main.js` (copy into a vault's plugins dir) |

All three consume the same `core/` + `adapters/providers/*` via the `@core` /
`@adapters` aliases.

## Remaining / future cleanup

- **Live-test** the extension (load unpacked in Chrome) and the Obsidian plugin
  (copy `obsidian/` into a vault) — neither could be run in the build environment.
- Migrate the Phase 1 desktop shims' import sites to `@core` and delete the shims.
- Optionally promote `core/` + `adapters/` to npm workspaces.

## Notes

- `CLAUDE.md` documents an earlier Cloud Run deployment; the live deployment is
  GitHub Pages (see `README.md` → Deployment). HTTPS enforcement is required —
  WebGPU and `crypto.randomUUID` are secure-context-only.
- The shims from Phase 1 are transitional; a cleanup pass can repoint import
  sites at `@core`/`@adapters` and remove them.
