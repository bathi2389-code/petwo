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
FIREBASE_PROJECT_ID=petwo-95436
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@petwo-95436.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_STORAGE_BUCKET=petwo-95436.appspot.com

# JWT Authentication
JWT_SECRET=production_grade_high_entropy_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d

# Razorpay Gateway
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_key

# Authentication uses Firebase Email/Password and Firebase email verification links; no OTP sender variables are required.

# Logging & Telemetry
LOG_LEVEL=info
```

### Provider Web (`apps/provider-web/.env.local` / deployment variables)
```bash
NEXT_PUBLIC_API_URL=https://api.petwo.in/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=petwo-95436.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=petwo-95436
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=petwo-95436.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### Admin Web (`apps/admin-web/.env.local` / deployment variables)

Use the same Firebase project (`petwo-95436`) and the admin web app's registered Firebase web-app values. Keep the public API key out of source control.

```bash
NEXT_PUBLIC_API_URL=https://api.petwo.in/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=<copy-from-firebase-console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=petwo-95436.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=petwo-95436
NEXT_PUBLIC_FIREBASE_APP_ID=<admin-web-app-id>
```

---

## 2. Production Deployment Steps

### 2.1 Backend Deployment (Google Cloud Run)
```bash
# 1. Build and push container to Google Artifact Registry
gcloud builds submit --tag asia-south1-docker.pkg.dev/petwo-95436/petwo-repo/backend:latest ./backend

# 2. Deploy to Cloud Run (Mumbai Region: asia-south1)
gcloud run deploy petwo-backend \
  --image asia-south1-docker.pkg.dev/petwo-95436/petwo-repo/backend:latest \
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
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project petwo-95436
```

### 2.3 Provider & Admin Web Apps (Firebase App Hosting)
```bash
# Deploy Next.js apps with automated SSR
npx firebase-tools apphosting:backends:create --project petwo-95436
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
    --source-database='projects/petwo-95436/databases/(default)' \
    --destination-database='projects/petwo-95436/databases/recovery-db' \
    --recovery-time='2024-11-02T00:00:00Z'
  ```
