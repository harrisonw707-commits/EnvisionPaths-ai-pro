#!/bin/bash
# One-time setup: Create secrets in Google Secret Manager for EnvisionPaths Cloud Run
# Run this once from Google Cloud Shell before deploying via Cloud Build.
#
# Usage:
#   chmod +x setup-secrets.sh
#   ./setup-secrets.sh
#
# You will be prompted to enter each secret value securely.

set -e

PROJECT_ID="envisionpaths"
REGION="us-west1"
SERVICE_ACCOUNT="$(gcloud run services describe envisionpaths-ai-pro --region=$REGION --project=$PROJECT_ID --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo '')"

echo "=== EnvisionPaths Secret Manager Setup ==="
echo "Project: $PROJECT_ID"
echo ""

create_or_update_secret() {
  local SECRET_NAME="$1"
  local PROMPT="$2"

  echo -n "Enter value for $PROMPT: "
  read -s SECRET_VALUE
  echo ""

  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "  Updating existing secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
      --data-file=- \
      --project="$PROJECT_ID"
  else
    echo "  Creating new secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
  fi
  echo "  ✓ Done: $SECRET_NAME"
  echo ""
}

create_or_update_secret "GEMINI_API_KEY" "GEMINI_API_KEY (your Google AI Studio key)"
create_or_update_secret "STRIPE_SECRET_KEY" "STRIPE_SECRET_KEY"
create_or_update_secret "STRIPE_PRICE_BEGINNER_ID" "STRIPE_PRICE_BEGINNER_ID"
create_or_update_secret "STRIPE_PRICE_PRO_ID" "STRIPE_PRICE_PRO_ID"
create_or_update_secret "APP_URL" "APP_URL (e.g. https://envisionpaths-ai-pro-36560900479.us-west1.run.app)"

echo "=== Granting Secret Manager access to Cloud Run service account ==="

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "⚠️  Could not auto-detect service account. Using default compute SA."
  PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

echo "Service account: $SERVICE_ACCOUNT"

for SECRET in GEMINI_API_KEY STRIPE_SECRET_KEY STRIPE_PRICE_BEGINNER_ID STRIPE_PRICE_PRO_ID APP_URL; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet
  echo "  ✓ Access granted for: $SECRET"
done

echo ""
echo "=== Setup Complete! ==="
echo "All secrets created and permissions granted."
echo "You can now deploy via Cloud Build or run:"
echo ""
echo "  gcloud run services update envisionpaths-ai-pro \\"
echo "    --region=us-west1 \\"
echo "    --project=envisionpaths \\"
echo "    --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest"
echo ""
echo "Then test with:"
echo "  curl https://envisionpaths-ai-pro-36560900479.us-west1.run.app/api/debug/env"
