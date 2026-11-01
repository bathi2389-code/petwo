# PETCO — Production-Grade PetCare Marketplace & Multi-Tenant SaaS Platform

[![CI/CD](https://github.com/petco/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/petco/platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/node->=20.0.0-green.svg)](https://nodejs.org/)
[![Flutter: 3.x](https://img.shields.io/badge/flutter-3.x-blue.svg)](https://flutter.dev/)

**PETCO** is an enterprise-ready, multi-tenant digital marketplace connecting pet owners with verified veterinary professionals, diagnostic centers, groomers, boarders, and pet-care service businesses.

- **Initial Launch Market**: India (Flagship launch in **Hyderabad** — Banjara Hills, Jubilee Hills, Gachibowli, Madhapur, Kondapur, Secunderabad).
- **Core Business Model**: Commission take-rates on bookings (12–20%), provider SaaS tier subscriptions (Starter, Growth, Pro), featured listing placements, and promotional coupons.

> [!TIP]
> **Don't want to install Node, Flutter, or Android Studio on your laptop?**
> See [**Running Without Local Installs**](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/RUN_WITHOUT_LOCAL_INSTALLS.md) to run everything 100% in your browser using **GitHub Codespaces** or free cloud deployment.

---

## 1. System Architecture & Technical Documentation

The platform is backed by comprehensive engineering specifications in the [`docs/`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs) directory:

| Document | Path | Core Focus |
|---|---|---|
| **Architecture Design** | [`docs/ARCHITECTURE.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/ARCHITECTURE.md) | Distributed topology, multi-tenancy isolation, edge routing & C4 system model |
| **API Specification** | [`docs/API_REFERENCE.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/API_REFERENCE.md) | 19 endpoint groups, JSON payloads, headers, error codes & rate limits |
| **Database Schema** | [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/DATABASE_SCHEMA.md) | Firestore collections, composite indexes, integer paisa & DPDPA consents |
| **Working Flows** | [`docs/WORKFLOWS.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/WORKFLOWS.md) | 15 detailed Mermaid sequence diagrams covering end-to-end business flows |
| **Security & Compliance** | [`docs/SECURITY_COMPLIANCE.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/SECURITY_COMPLIANCE.md) | DPDPA 2023, VCI licensure rules, HMAC verification, RBAC & OWASP controls |
| **Financial & Unit Economics** | [`docs/FINANCIAL_MODEL.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/FINANCIAL_MODEL.md) | 18% GST partitioning, commission take-rates, SaaS tiers & Hyderabad unit economics |
| **Zero-Install Run Guide** | [`docs/RUN_WITHOUT_LOCAL_INSTALLS.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/RUN_WITHOUT_LOCAL_INSTALLS.md) | Run 100% in browser via GitHub Codespaces, Render, Railway, or Vercel |
| **Deployment Runbook** | [`docs/DEPLOYMENT_RUNBOOK.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/DEPLOYMENT_RUNBOOK.md) | Production launch checklist, environment secrets, CI/CD, and rollback steps |
| **Product Roadmap** | [`docs/ROADMAP_AND_EXTENSIONS.md`](file:///c:/Users/shaik/OneDrive/Desktop/PETCO/docs/ROADMAP_AND_EXTENSIONS.md) | Next-gen features, expansion cities (Bengaluru, Mumbai, Delhi-NCR), and AI agents |

The repository is structured as a TypeScript/Dart monorepo supporting three unified client applications and an enterprise backend:

```
PETCO/
├── apps/
│   ├── customer-app/          # Flutter 3.x Mobile App (iOS & Android)
│   ├── provider-web/          # Next.js 14 (App Router) Provider SaaS Portal
│   └── admin-web/             # Next.js 14 Central Marketplace Administration
├── backend/
│   ├── src/
│   │   ├── api/routes/        # REST Route Handlers (Auth, Bookings, Payments, etc.)
│   │   ├── config/            # Firebase, Environment, and Security Settings
│   │   ├── middleware/        # Auth (Firebase JWT + Roles), Auditing, Rate-Limiting
│   │   └── utils/             # Financial Math, Validation, Indian Localization
│   ├── scripts/               # Firestore Seed Script with Hyderabad Providers
│   └── Dockerfile             # Production Alpine Container
├── shared/
│   ├── types/                 # Shared TypeScript Type Definitions (API Contracts)
│   └── constants/             # Enums, Business Rules, Limits, India Localizations
├── infrastructure/
│   └── firebase/
│       ├── firestore.rules    # Role-based Granular Security Rules
│       └── firestore.indexes.json # Composite Indexes
├── docker-compose.yml         # Local Full-Stack Orchestration
└── .github/workflows/ci.yml   # Multi-project CI/CD Pipeline
```

---

## 2. Applications

### A. Customer Mobile Application (`apps/customer-app`)
*Built with Flutter 3.x, Riverpod, Dio, and Razorpay SDK.*

- **Authentication**: Phone number OTP sign-in with SMS auto-detection.
- **Multiple Pet Profiles**: Track name, breed, species, gender, weight, allergy alerts, and special behavioral notes.
- **Health Records**: View vaccination due dates and veterinary consultation histories.
- **Discovery**: Location-aware search across Hyderabad neighborhoods, filtering by ratings, facility type, and distance.
- **Booking Flow**: Multi-step slot selection with real-time capacity checks, dynamic promo coupon applications, and Razorpay UPI/Card checkout.
- **Visits History**: Reschedule appointments, cancel within free-cancellation windows, and write verified reviews.

### B. Provider Web Portal (`apps/provider-web`)
*Built with Next.js 14 App Router, React 18, Tailwind CSS, Lucide, and TanStack Query.*

- **Business Onboarding**: Registration workflow with VCI/State Council licensure, PAN, and GSTIN collection.
- **Multi-Location Management**: Configure individual branch operating hours and amenities.
- **Service Catalogue**: Manage pricing (Fixed, Hourly, Starting-from), durations, and species applicability with tier limit guards.
- **Appointment Calendar**: Queue management for Pending, Confirmed, In Progress, and Completed visits.
- **Earnings & Settlements**: Weekly payout ledger with UTR reference numbers, GST breakdowns, and net credited sums.
- **Review Center**: Direct public responses to verified customer feedback.

### C. Marketplace Admin Application (`apps/admin-web`)
*Built with Next.js 14 App Router and Tailwind CSS.*

- **Provider Verification Desk**: Review practice credentials, licenses, and business documents before approving listings.
- **Booking Surveillance**: Cross-marketplace appointment tracking, cancellation oversight, and dispute intervention.
- **Dynamic Commission Engine**: Real-time take-rate policy tuning across service categories (e.g. 15% Vet, 18% Grooming).
- **Promotions Management**: Create and track platform or provider-funded promo coupons.
- **Audit Trails**: Non-repudiable audit logs recording all sensitive state mutations.

---

## 3. Financial & Localization Engine

- **Currency Integrity**: All currency math is executed in integer **paisa** ($\text{₹}1 = 100\text{ paisa}$) to eliminate floating-point precision loss.
- **Tax Compliance**: In compliance with Indian taxation laws, 18% GST is accurately partitioned on platform commission earnings.
- **Phone & Regional Formatters**: Native validation for Indian 10-digit mobile numbers (`+91`), 6-digit postal PIN codes, and GSTINs.
- **Payment Processing**: Direct integration with Razorpay Orders, Signatures, Refunds, and Webhook events.

---

## 4. Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Flutter SDK >= 3.22.x (for mobile development)
- Docker & Docker Compose (optional, for containerized run)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/petco/platform.git
   cd PETCO
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Populate your Firebase Admin credentials and Razorpay test keys in backend/.env
   ```

3. **Build shared types package:**
   ```bash
   npm run build --workspace=@petco/shared
   ```

4. **Seed Database with Hyderabad Launch Providers & Categories:**
   ```bash
   npm run db:seed --workspace=@petco/backend
   ```

5. **Run backend and web apps concurrently:**
   ```bash
   # Terminal 1: Backend API on port 4000
   npm run dev:backend

   # Terminal 2: Provider Web on port 3000
   npm run dev:provider

   # Terminal 3: Admin Web on port 3001
   npm run dev:admin
   ```

6. **Run Customer Mobile App (Flutter):**
   ```bash
   cd apps/customer-app
   flutter pub get
   flutter run
   ```

---

## 5. Automated Tests

Run backend unit and integration test suites:
```bash
npm run test --workspace=@petco/backend
```

---

## 6. Docker Deployment

Launch all services via Docker Compose:
```bash
docker-compose up --build
```
- **Backend API**: `http://localhost:4000` (Swagger documentation at `http://localhost:4000/docs`)
- **Provider Portal**: `http://localhost:3000`
- **Admin Center**: `http://localhost:3001`

---

## 7. Security & Compliance

- **Role-Based Access Control**: Strict tier separation between `customer`, `provider`, `admin`, and `super_admin`.
- **Database Rules**: Deny-by-default Firestore security policies restricting write operations on payments and bookings exclusively to authenticated server-side transactions.
- **Webhook Integrity**: HMAC-SHA256 signature verification on Razorpay events.
- **Audit Logging**: Destructive and financial mutations logged to `auditLogs` with actor ID, IP address, and before/after state diffs.
