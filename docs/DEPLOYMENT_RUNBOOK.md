# PETWO — Production Deployment & Operations Runbook

This guide contains deployment instructions, environment variables configuration, and incident recovery runbooks for running the PETWO platform in production.

---

## 1. Environment Variables Checklist

### Backend API (`backend/.env`)
```bash
# Server Environment
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
API_VERSION=v1
CORS_ORIGINS=https://provider.petwo.in,https://admin.petwo.in,https://petwo.in

# Firebase Enterprise Admin Credentials
FIREBASE_PROJECT_ID=petwo-prod
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@petwo-prod.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_STORAGE_BUCKET=petwo-prod.appspot.com

# JWT Authentication
JWT_SECRET=production_grade_high_entropy_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d

# Razorpay Gateway
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_key

# SMS / OTP
MSG91_AUTH_KEY=your_msg91_key
MSG91_TEMPLATE_ID_OTP=your_template_id
MSG91_SENDER_ID=PETWOI

# Logging & Telemetry
LOG_LEVEL=info
```

### Provider Web (`apps/provider-web/.env.production`)
```bash
NEXT_PUBLIC_API_URL=https://api.petwo.in/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=petwo-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=petwo-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=petwo-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 2. Production Deployment Steps

### 2.1 Backend Deployment (Google Cloud Run)
```bash
# 1. Build and push container to Google Artifact Registry
gcloud builds submit --tag asia-south1-docker.pkg.dev/petwo-prod/petwo-repo/backend:latest ./backend

# 2. Deploy to Cloud Run (Mumbai Region: asia-south1)
gcloud run deploy petwo-backend \
  --image asia-south1-docker.pkg.dev/petwo-prod/petwo-repo/backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 2 \
  --max-instances 20 \
  --memory 1Gi \
  --cpu 1 \
  --env-vars-file backend/.env.yaml
```

### 2.2 Firebase Rules & Indexes Deployment
```bash
# Deploy Firestore security rules and composite indexes
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project petwo-prod
```

### 2.3 Provider & Admin Web Apps (Firebase App Hosting)
```bash
# Deploy Next.js apps with automated SSR
npx firebase-tools apphosting:backends:create --project petwo-prod
```

### 2.4 Mobile App Build (Flutter)
```bash
cd apps/customer-app

# Android App Bundle (AAB) for Google Play Store
flutter build appbundle --release --dart-define=API_URL=https://api.petwo.in/api/v1

# iOS IPA for Apple App Store
flutter build ipa --release --dart-define=API_URL=https://api.petwo.in/api/v1
```

---

## 3. Operations & Incident Response

### 3.1 Health Check Monitoring
- Automated ping to `https://api.petwo.in/health` every 60 seconds.
- Expect HTTP 200:
  ```json
  { "status": "ok", "service": "PETWO API", "version": "1.0.0" }
  ```

### 3.2 Webhook Failure Runbook
**Symptom**: Razorpay webhooks returning HTTP 5xx or signature validation errors.
1. Check Cloud Logging for `Invalid Razorpay webhook signature`.
2. Verify `RAZORPAY_WEBHOOK_SECRET` in Secret Manager against Razorpay Merchant Dashboard.
3. Access Razorpay Dashboard > Webhooks > Filter by `failed` > Click **"Retry Webhooks"** to re-dispatch events idempotently.

### 3.3 Database Point-in-Time Recovery (PITR)
- Cloud Firestore Enterprise mode maintains continuous backups with a 7-day retention window.
- In the event of catastrophic data corruption, execute restore via gcloud:
  ```bash
  gcloud firestore databases restore \
    --source-database='projects/petwo-prod/databases/(default)' \
    --destination-database='projects/petwo-prod/databases/recovery-db' \
    --recovery-time='2024-11-02T00:00:00Z'
  ```
