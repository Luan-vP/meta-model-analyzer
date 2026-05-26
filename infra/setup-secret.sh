#!/usr/bin/env bash
# Creates the Anthropic API key secret in GCP Secret Manager.
# Usage: PROJECT_ID=<your-project-id> ./infra/setup-secret.sh
set -euo pipefail

: "${PROJECT_ID:?Must set PROJECT_ID}"

SECRET_NAME="meta-model-analyzer-anthropic-key"
REGION="us-central1"

echo "Creating secret '${SECRET_NAME}' in project '${PROJECT_ID}' (region: ${REGION})..."

gcloud secrets create "${SECRET_NAME}" \
  --project="${PROJECT_ID}" \
  --replication-policy="user-managed" \
  --locations="${REGION}"

echo ""
echo "Secret created. Add the initial secret value:"
echo "  printf '%s' '<YOUR_ANTHROPIC_API_KEY>' | \\"
echo "    gcloud secrets versions add ${SECRET_NAME} --project=${PROJECT_ID} --data-file=-"
echo ""
echo "Or from a file:"
echo "  gcloud secrets versions add ${SECRET_NAME} --project=${PROJECT_ID} --data-file=/path/to/key.txt"
