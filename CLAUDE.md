# CLAUDE.md

## Deployment

This app is deployed to **Google Cloud Run** as two separate services.

### Frontend

- Service: `meta-model-analyzer` (region `us-central1`)
- URL: <https://meta-model-analyzer-6frhukghgq-uc.a.run.app>
- Container: built from the root `Dockerfile` (Vite build → `serve` on port 8080)
- Trigger: Cloud Build trigger watches `Luan-vP/meta-model-analyzer` and rebuilds + deploys on push to `main`. There is no separate "deploy" command — to deploy, push to `main`.
- Build-time env: `VITE_PROXY_URL` must be set to the proxy Cloud Run URL.

### Proxy

- Service: `meta-model-analyzer-proxy` (region `us-central1`)
- Container: built from `proxy/Dockerfile` (TypeScript → Node.js on port 8081)
- Trigger: `proxy/cloudbuild.yaml` — Cloud Build trigger watches `proxy/` for changes on `main`.
- Runtime env: `GOOGLE_CLOUD_PROJECT`, `DAILY_SPEND_CAP_USD`, `PROXY_ALLOWED_ORIGINS`
- API key stored in Secret Manager as `meta-model-analyzer-anthropic-key` (not in env directly).

## Architecture

The frontend never holds an Anthropic API key. All Claude requests go through the proxy, which enforces per-IP rate limits and a global daily spend cap backed by Firestore.
