#!/usr/bin/env bash
# One-shot GCP bootstrap for issue #16:
# Creates the Anthropic API key secret and grants access to the proxy service account.
#
# Prerequisites:
#   - gcloud CLI authenticated with sufficient permissions
#   - roles/secretmanager.admin (or equivalent) on the project
#   - roles/iam.securityAdmin (or equivalent) on the project
#
# Usage:
#   export PROJECT_ID=<your-gcp-project-id>
#   export SERVICE_ACCOUNT_EMAIL=<proxy-service-account-email>
#   ./infra/setup-gcp.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

: "${PROJECT_ID:?Must set PROJECT_ID}"
: "${SERVICE_ACCOUNT_EMAIL:?Must set SERVICE_ACCOUNT_EMAIL}"

echo "=== Step 1: Create Secret Manager secret ==="
bash "${SCRIPT_DIR}/setup-secret.sh"

echo ""
echo "=== Step 2: Add secret value ==="
echo "Paste your Anthropic API key and press Ctrl+D:"
printf '%s' "$(</dev/stdin)" | \
  gcloud secrets versions add "meta-model-analyzer-anthropic-key" \
    --project="${PROJECT_ID}" \
    --data-file=-

echo ""
echo "=== Step 3: Grant IAM access ==="
bash "${SCRIPT_DIR}/setup-iam.sh"

echo ""
echo "=== Done ==="
echo "Secret 'meta-model-analyzer-anthropic-key' is ready."
echo "The Cloud Run proxy service can mount it via Cloud Run secret volumes"
echo "or reference it with secretmanager.projects.secrets.versions.access."
