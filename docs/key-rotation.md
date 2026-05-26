# Anthropic API Key Rotation Procedure

Secret: `meta-model-analyzer-anthropic-key` (GCP Secret Manager, `us-central1`)

## When to rotate

- Suspected key compromise
- Team member with key access offboards
- Routine schedule (recommended: every 90 days)

## Steps

### 1. Generate a new key

Log in to [console.anthropic.com](https://console.anthropic.com) → API Keys → **Create Key**.
Copy the new key value immediately — it is shown only once.

### 2. Add a new secret version

```bash
printf '%s' '<NEW_API_KEY>' | \
  gcloud secrets versions add meta-model-analyzer-anthropic-key \
    --project="${PROJECT_ID}" \
    --data-file=-
```

This adds a new version without deleting the current one, so existing Cloud Run
revisions continue to work while you deploy the update.

### 3. Deploy the proxy service

Push to `main` (or trigger a manual Cloud Run deployment). Cloud Run will pick up
the **latest** secret version on the next revision.

Alternatively, pin a specific version in the Cloud Run service definition:
```
--set-secrets=ANTHROPIC_API_KEY=meta-model-analyzer-anthropic-key:latest
```

### 4. Verify the new key is active

Check the proxy service logs to confirm requests succeed with the new key.

### 5. Disable the old secret version

Once the new version is confirmed working, disable the previous version:

```bash
# List versions to find the old version number
gcloud secrets versions list meta-model-analyzer-anthropic-key --project="${PROJECT_ID}"

# Disable the old version (e.g. version 1)
gcloud secrets versions disable 1 \
  --secret=meta-model-analyzer-anthropic-key \
  --project="${PROJECT_ID}"
```

### 6. Revoke the old key in Anthropic console

Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → revoke
the old key.

### 7. (Optional) Destroy the old secret version

After confirming the old version is no longer needed:

```bash
gcloud secrets versions destroy 1 \
  --secret=meta-model-analyzer-anthropic-key \
  --project="${PROJECT_ID}"
```

## IAM: who has access

The secret is scoped to the proxy Cloud Run service account via
`roles/secretmanager.secretAccessor`. To review current bindings:

```bash
gcloud secrets get-iam-policy meta-model-analyzer-anthropic-key \
  --project="${PROJECT_ID}"
```

To revoke access from a service account:

```bash
gcloud secrets remove-iam-policy-binding meta-model-analyzer-anthropic-key \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:<SA_EMAIL>" \
  --role="roles/secretmanager.secretAccessor"
```
