# CLAUDE.md

## Deployment

This app is deployed to **Google Cloud Run**.

- Service: `meta-model-analyzer` (region `us-central1`)
- URL: <https://meta-model-analyzer-6frhukghgq-uc.a.run.app>
- Container: built from the repo `Dockerfile` (Vite build → `serve` on port 8080)
- Trigger: a Cloud Build trigger watches `Luan-vP/meta-model-analyzer` and rebuilds + deploys on push to `main`. There is no separate "deploy" command — to deploy, push to `main`.
