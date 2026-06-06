# Meta-Model Analyzer

Detect linguistic patterns from Bandler & Grinder's Meta-Model of Language. Paste any text and the app highlights violations — deletions, distortions, and generalizations — with hover tooltips showing challenge questions.

Live: <https://meta-model-analyzer-6frhukghgq-uc.a.run.app>

## Providers

| Provider | How it works |
|----------|-------------|
| **Claude** (default) | Requests route through a shared GCP proxy. No API key needed. Subject to per-IP rate limits and a daily spend cap. |
| **Local (WebLLM)** | Runs a quantised model in your browser via WebGPU. No network calls after the initial download. |

## Architecture

```
Browser (React/Vite)
  └─ fetch POST /v1/messages
        └─ Proxy (Hono, Cloud Run)
              ├─ CORS origin allowlist
              ├─ Per-IP token-bucket rate limit  ← Firestore
              ├─ Global daily spend cap          ← Firestore
              ├─ Structured Cloud Logging
              └─ Anthropic API  (key from Secret Manager)
```

## Development

```bash
# Frontend
npm install
npm run dev          # http://localhost:5173

# Proxy (separate terminal)
cd proxy
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev   # http://localhost:8081
```

Set `VITE_PROXY_URL=http://localhost:8081` (or `.env.local`) so the frontend hits your local proxy.

## Deployment

Both services deploy to Google Cloud Run automatically on push to `main`.

| Service | Cloud Run name | Trigger |
|---------|---------------|---------|
| Frontend | `meta-model-analyzer` | root `Dockerfile` + Cloud Build trigger |
| Proxy | `meta-model-analyzer-proxy` | `proxy/cloudbuild.yaml` + Cloud Build trigger |

### Required GCP resources (one-time manual setup)

| Resource | Purpose |
|----------|---------|
| Secret Manager secret `meta-model-analyzer-anthropic-key` | Holds the Anthropic API key |
| Firestore (native mode) | Rate-limit state + daily spend tracking |
| Cloud Build triggers (× 2) | Auto-build on push to `main` |

### Environment variables

**Proxy (Cloud Run)**

| Var | Default | Notes |
|-----|---------|-------|
| `GOOGLE_CLOUD_PROJECT` | — | Required in production |
| `ANTHROPIC_API_KEY` | — | Local dev override (skips Secret Manager) |
| `DAILY_SPEND_CAP_USD` | `5.0` | Hard stop when daily spend exceeds this |
| `PROXY_ALLOWED_ORIGINS` | prod + localhost | Comma-separated origin allowlist |
| `PORT` | `8081` | Listening port |

**Frontend (build-time)**

| Var | Default | Notes |
|-----|---------|-------|
| `VITE_PROXY_URL` | `http://localhost:8081` | Proxy URL injected at build time |

## Claude Code skill: NLP Meta-Model distortions

This repo ships a Claude Code skill at [`.claude/skills/distortions/SKILL.md`](.claude/skills/distortions/SKILL.md) that packages the 13-type Meta-Model distortions catalogue (descriptions, signal words, canonical examples, challenge questions, and the annotation JSON schema). Any `claude` session started inside this repo can load it on demand when asked about meta-model violations, linguistic distortions, or Bandler & Grinder's Meta-Model.
