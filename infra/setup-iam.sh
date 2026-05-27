#!/usr/bin/env bash
# Grants the proxy Cloud Run service account access to the Anthropic API key secret.
# Usage: PROJECT_ID=<id> SERVICE_ACCOUNT_EMAIL=<email> ./infra/setup-iam.sh
#
# The service account email follows this pattern for the default compute SA:
#   <PROJECT_NUMBER>-compute@developer.gserviceaccount.com
# Or for a dedicated SA:
#   meta-model-analyzer-proxy@<PROJECT_ID>.iam.gserviceaccount.com
set -euo pipefail

: "${PROJECT_ID:?Must set PROJECT_ID}"
: "${SERVICE_ACCOUNT_EMAIL:?Must set SERVICE_ACCOUNT_EMAIL}"

SECRET_NAME="meta-model-analyzer-anthropic-key"

echo "Granting secretAccessor on '${SECRET_NAME}' to '${SERVICE_ACCOUNT_EMAIL}'..."

gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

echo "IAM binding applied."
