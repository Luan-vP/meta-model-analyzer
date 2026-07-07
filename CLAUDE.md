# CLAUDE.md

## Deployment

This app is deployed to **GitHub Pages**, served at <https://analyzer.luanvp.info>.

- Build/deploy: the `Deploy to GitHub Pages` GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) builds and deploys on push to `main`. There is no separate "deploy" command — to deploy, push to `main`.
- Custom domain: `analyzer.luanvp.info` is a CNAME to `luan-vp.github.io.`, managed in Google Cloud DNS (`gcloud dns`, managed zone `luanvp-info`).
- HTTPS is required, not optional — GitHub Pages must have **Enforce HTTPS** enabled for the custom domain. WebGPU (used by the in-browser WebLLM provider) and `crypto.randomUUID()` are both secure-context-only; see the README's Deployment section for details.
- An earlier Google Cloud Run deployment (`meta-model-analyzer`, region `us-central1`) has been retired; the old `*.run.app` URL is dead (403).
