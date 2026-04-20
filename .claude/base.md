# Architecture Base

Single-product React + TypeScript + Vite SPA that detects NLP Meta-Model violations (deletions, generalizations, distortions) in text, with two interchangeable LLM backends: the Anthropic API (browser-direct) and a local MLC WebLLM engine running in a Web Worker. No backend service.

## Pattern

**Provider-strategy SPA.** A single `LLMService` interface is implemented by two services (`ClaudeService`, `WebLLMService`). A `useLLMProvider` hook selects, initializes, and disposes the active service based on user settings. Hooks orchestrate all state; components are presentational. Routes: `/` (analyzer app), `/benchmark` (lazy-loaded evaluation harness).

## Arms

| Arm | Root Path | Role |
|-----|-----------|------|
| entry | `src/main.tsx`, `src/App.tsx`, `index.html` | Bootstraps React root, router, and the analyzer page composition. |
| components | `src/components/` | Presentational React components: `SettingsPanel`, `TextInput`, `AnnotatedText`, `ViolationSpan`, `Tooltip`. No side effects. |
| hooks | `src/hooks/` | State orchestration: `useSettings` (provider + apiKey in localStorage), `useLLMProvider` (lifecycle of the active `LLMService`), `useAnalysis` (run + capture results). |
| services | `src/services/` | LLM backends and prompt plumbing: `claude-service.ts`, `webllm-service.ts`, `webllm-worker.ts`, `prompt.ts` (SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, `resolveOffsets`, `buildUserMessage`). |
| types | `src/types/` | Shared TypeScript contracts: `analysis.ts` (`Annotation`, `AnalysisResult`, `ViolationType`, `ViolationCategory`), `llm.ts` (`LLMService`, `ProviderType`). |
| data | `src/data/` | Static knowledge: `meta-model.ts` (`VIOLATION_CATALOGUE`, `VIOLATION_MAP`, `CATEGORY_COLORS`), `benchmark-dataset.ts` (labelled evaluation set). |
| benchmark | `src/benchmark/` | Lazy-loaded evaluation harness `BenchmarkRunner.tsx` that re-uses `services/prompt` and drives WebLLM across models listed in `AVAILABLE_MODELS`. |
| config | `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `Dockerfile`, `public/` | Build, tooling, and static assets. |

## Connections

```
entry ──> components (renders)
entry ──> hooks (wires state)
entry ──> benchmark (lazy route)

components ──> types (prop types)
components ──> data/meta-model (CATEGORY_COLORS, VIOLATION_MAP)

hooks ──> services (instantiates LLMService)
hooks ──> types (ProviderType, LLMService, Annotation)

services ──> types (LLMService contract, Annotation)
services/prompt ──> types (ViolationType, ViolationCategory)
services/webllm-service ──> services/webllm-worker (new Worker(...))

benchmark ──> services/prompt (SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, resolveOffsets, buildUserMessage)
benchmark ──> data/benchmark-dataset
benchmark ──> types
```

Illegal connections:
- `components` MUST NOT import from `services/` (components are pure; state goes through hooks).
- `data` MUST NOT import from `services`, `hooks`, `components`, or `benchmark`.
- `types` MUST NOT import from any other arm (leaf).
- `services` MUST NOT import from `hooks` or `components`.

## Domain Notes

- **`LLMService` is the stability boundary** between UI and models. Both backends must return a `Promise<Annotation[]>` from `analyze(text)` and both rely on `SYSTEM_PROMPT`, `ANNOTATION_JSON_SCHEMA`, `buildUserMessage`, and `resolveOffsets` from `services/prompt.ts`. Any annotation offset logic lives in `resolveOffsets` — do not duplicate it per backend.
- **Provider selection and API key** are owned by `useSettings` and persisted in `localStorage` under `mma-*` keys. Any new user-configurable setting (model id, etc.) should follow this same pattern: storage key, getter/setter pair, wired through `App` props.
- **Web Worker boundary**: WebLLM must stay off the main thread. `webllm-service.ts` constructs a `new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' })`; do not bypass the worker.
- **Claude browser-direct**: uses `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true` and the `anthropic-dangerous-direct-browser-access` header. There is no backend proxy; the model id is hardcoded in one place today (`claude-service.ts`).
- **Violation taxonomy is canonical** in `src/types/analysis.ts` (`ViolationType`, `ViolationCategory`) and mirrored in `src/data/meta-model.ts` (`VIOLATION_CATALOGUE`), `src/services/prompt.ts` (`VIOLATION_TYPES` and `TYPE_TO_CATEGORY`), and `src/data/benchmark-dataset.ts`. Adding a type requires updating all four.
- **Category correction**: `resolveOffsets` forces `category` to match `TYPE_TO_CATEGORY[violationType]` so model drift on category labels is self-healing.
- **Routing**: `/benchmark` is code-split via `React.lazy`; keep `benchmark` arm free of eager imports from the main analyzer path.
- **Default branch**: `main` (no `dev` branch).
