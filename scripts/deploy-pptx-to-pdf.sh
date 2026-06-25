#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${GCP_PROJECT_ID:-warranty-management-common}"
REGION="${GCP_REGION:-asia-northeast3}"
SERVICE_NAME="${GCP_SERVICE_NAME:-pptx-to-pdf-converter}"
ORIGINS="${ALLOWED_ORIGINS:-https://warranty-management-common.web.app,https://warranty-management-common.firebaseapp.com,http://localhost:5174}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI가 필요합니다. 설치: brew install --cask google-cloud-sdk"
  exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "Google Cloud 로그인이 필요합니다."
  gcloud auth login
fi

gcloud config set project "$PROJECT_ID"

echo "Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --quiet

echo "Deploying Cloud Run service..."
ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT
cat > "$ENV_FILE" <<EOF
ALLOWED_ORIGINS: "${ORIGINS}"
EOF
if [[ -n "${API_KEY:-}" ]]; then
  echo "API_KEY: \"${API_KEY}\"" >> "$ENV_FILE"
fi

gcloud run deploy "$SERVICE_NAME" \
  --source "$ROOT_DIR/server/pptx-to-pdf-converter" \
  --region "$REGION" \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 3 \
  --allow-unauthenticated \
  --env-vars-file "$ENV_FILE" \
  --quiet

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo ""
echo "Deployed: ${SERVICE_URL}"
echo ""
echo "Add to .env:"
echo "VITE_PPTX_TO_PDF_API_URL=${SERVICE_URL}"
echo ""
echo "Then rebuild and deploy hosting:"
echo "  npm run build"
echo "  firebase deploy --only hosting"
