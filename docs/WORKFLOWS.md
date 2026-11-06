# PETWO — End-to-End Working Flows

This document details the lifecycle and sequence of operations across all core platform interactions.

---

## 1. Customer Authentication & Pet Registration

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant App as Flutter App
    participant Gateway as Fastify API
    participant Auth as Firebase Auth
    participant DB as Cloud Firestore

    Customer->>App: Enters name and email address
    App->>Gateway: Firebase createUserWithEmailAndPassword + sendEmailVerification
    Firebase->>Customer: Send verification link
    Customer->>Firebase: Open verification link

    Customer->>App: Return to PETWO and refresh emailVerified
    App->>Gateway: POST /api/v1/auth/customer/profile with Firebase ID token
    Gateway->>Firebase: Verify signed ID token and email_verified claim
    Gateway->>DB: Upsert users/{uid} & customers/{uid} idempotently

    Customer->>App: Fills Pet Profile (Name, Species, Breed, Allergies)
    App->>Gateway: POST /api/v1/pets
    Gateway->>DB: Write to pets/{petId} linked to customerId
    Gateway-->>App: { petId, status: "created" }
```

---

## 2. Provider Onboarding & Compliance Verification

```mermaid
sequenceDiagram
    autonumber
    actor Provider as 🏥 Clinic / Solo Vet
    participant Web as Provider Web Portal
    participant API as Fastify API
    participant DB as Cloud Firestore
    actor Admin as 🛡️ Platform Admin

    Provider->>Web: Register Practice (Business Name, Type, Phone)
    Web->>API: POST /api/v1/providers/register
    API->>DB: Create providers/{id} with verificationStatus: "pending"
    API-->>Web: Provider profile initialized

    Provider->>Web: Submits VCI Registration, PAN, GSTIN & Branch Locations
    Web->>API: PUT /api/v1/providers/me & POST /locations
    API->>DB: Update providers/{id} & providerLocations/{id}

    Admin->>API: GET /api/v1/admin/providers?status=pending
    API->>DB: Fetch unverified applicants
    API-->>Admin: List of pending provider applications

    Admin->>Admin: Verify credentials against Telangana State Veterinary Council
    Admin->>API: PUT /api/v1/admin/providers/{id}/verify { status: "approved" }
    API->>DB: Set verificationStatus: "approved", verifiedAt: now
    API->>DB: Write immutable audit record to auditLogs/{id}
    API-->>Provider: Notification: "Listing Approved & Public in Hyderabad"
```

---

## 3. Search, Discovery & Slot Booking

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant App as Flutter App
    participant API as Fastify API
    participant DB as Cloud Firestore
    actor Provider as 🏥 Clinic Staff

    Customer->>App: Selects Service Category ("Veterinary Care")
    App->>API: GET /api/v1/providers/search?category=veterinary&lat=17.41&lng=78.43
    API->>DB: Query approved providers near Banjara Hills
    API-->>App: List of verified clinics with ratings & distance

    Customer->>App: Selects Clinic & Service ("General Consultation")
    App->>API: GET /api/v1/providers/{id}/availability?date=2024-11-05
    API->>DB: Load operatingHours from location & exclude conflicting bookings
    API-->>App: Return 30-min available time slots

    Customer->>App: Selects 10:30 AM, Simba (Pet), applies coupon "PAWFIRST"
    App->>API: POST /api/v1/bookings
    API->>DB: Validate slot lock & calculate 20% discount
    API->>DB: Create bookings/{id} with status: "pending_confirmation"
    API-->>App: Booking Created: PTC-20241105-99A1
    API-->>Provider: Real-time notification: New Appointment Requested
```

---

## 4. Payment Escrow & Razorpay Webhook Verification

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant App as Flutter App
    participant API as Fastify API
    participant RZP as Razorpay Gateway
    participant DB as Cloud Firestore

    App->>API: POST /api/v1/payments/orders { bookingId }
    API->>DB: Fetch booking amount (in integer paisa)
    API->>RZP: orders.create({ amount: 76700, currency: "INR" })
    RZP-->>API: { order_id: "order_xyz123" }
    API->>DB: Write payments/{id} with status: "created"
    API-->>App: { orderId, amount, keyId }

    App->>Customer: Opens native Razorpay UPI / Card Checkout
    Customer->>RZP: Completes UPI Payment (₹767)
    RZP-->>App: { razorpay_payment_id, razorpay_signature }

    App->>API: POST /api/v1/payments/verify
    API->>API: Verify HMAC-SHA256 signature against RAZORPAY_KEY_SECRET
    API->>DB: Update payments/{id} to status: "captured"
    API->>DB: Transition booking status: "confirmed"
    API-->>App: Payment Verified & Appointment Locked

    Note over RZP,API: Asynchronous Webhook Redundancy
    RZP->>API: POST /webhooks/razorpay (Event: payment.captured)
    API->>API: Verify X-Razorpay-Signature
    API->>DB: Idempotently ensure booking & payment marked confirmed
```

---

## 5. Settlement Cycle & Weekly Vendor Payouts

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Settlement Engine (Cloud Scheduler)
    participant DB as Cloud Firestore
    participant RZP as Razorpay Route
    participant Bank as Provider Bank Account

    Engine->>DB: Query completed bookings for billing week (Mon-Sun)
    loop For each provider
        Engine->>Engine: Sum gross bookings revenue
        Engine->>Engine: Deduct category platform commission (e.g. 15%)
        Engine->>Engine: Deduct 18% GST on platform commission
        Engine->>Engine: Calculate net payable = Gross - Commission - GST
        Engine->>DB: Write settlements/{id} with status: "processing"
        Engine->>RZP: Create Direct Transfer to Provider Fund Account
        RZP->>Bank: IMPS / NEFT Credit Transfer
        RZP-->>Engine: Transfer success with UTR Number
        Engine->>DB: Update settlements/{id} to "settled" with UTR
    end
```

---

## 6. AI Pet Symptom Triage with Gemini 3.8 Flash

```mermaid
sequenceDiagram
    autonumber
    actor Owner as 📱 Pet Owner
    participant App as Flutter App
    participant API as Fastify API
    participant Gemini as Google Gemini 3.8 Flash
    participant DB as Cloud Firestore

    Owner->>App: Inputs pet symptoms ("Vomited twice, lethargic, no food since morning")
    App->>API: POST /api/v1/ai-triage/assess { petId, symptoms }
    API->>DB: Retrieve pet species, breed, age, and existing allergies
    API->>Gemini: generateContent with clinical prompt & JSON schema
    Gemini-->>API: Structured response: severity ("urgent"), hypotheses, first aid
    API->>DB: Save session record to aiTriageSessions/{id}
    API-->>App: Triage Card with urgency level & direct booking shortcut
```

---

## 7. 24/7 Emergency SOS Dispatch in Hyderabad

```mermaid
sequenceDiagram
    autonumber
    actor Owner as 📱 Pet Owner in Distress
    participant App as Flutter App
    participant API as Fastify API
    participant DB as Cloud Firestore
    participant Hospital as 🏥 24/7 Emergency ICU (Banjara Hills)

    Owner->>App: Taps Red "Emergency SOS" button (e.g. severe trauma/collapse)
    App->>API: POST /api/v1/emergency/sos { petId, coords: { lat, lng } }
    API->>DB: Log emergency incident with high priority
    API->>DB: Match nearest open 24/7 ICU facility with trauma capability
    API->>Hospital: Immediate automated alert dispatch with GPS & ETA
    API-->>App: Display designated hospital hotline, turn-by-turn route & ambulance status
```


---

## 8. IoT Smart Collar Telemetry & Geofence Breach Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Pet as 🐕 Pet with Smart Collar
    participant Device as IoT Collar Hardware
    participant API as Fastify API (/iot)
    participant DB as Cloud Firestore
    actor Owner as 📱 Pet Owner

    Device->>API: POST /api/v1/iot/telemetry/ingest { lat, lng, heartRate, steps, temp }
    API->>DB: Update iotLiveState/{petId}
    API->>DB: Check distance against petGeofences/{petId}
    alt Pet wanders outside designated safe radius (>150m)
        API->>DB: Mark isInsideGeofence: false
        API->>Owner: High-Priority Push Notification: "Simba exited Safe Zone!"
        API->>Owner: WhatsApp Emergency Pin Dispatch with Live Tracking URL
    else Pet within safe zone
        API->>DB: Mark isInsideGeofence: true
    end
    API-->>Device: HTTP 200 { ack: true }
```

---

## 9. In-Clinic Reception TV Waiting Room Queue Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Arriving Customer
    participant Reception as Receptionist / Kiosk
    participant API as Fastify API (/queue)
    participant DB as Cloud Firestore
    participant TV as 📺 Reception TV Screen
    actor Doctor as 🩺 Attending Doctor

    Customer->>Reception: Checks in at clinic reception in Banjara Hills
    Reception->>API: Confirms arrival (transitions booking to "confirmed" / "waiting")
    
    TV->>API: Polls GET /api/v1/queue/{locationId} (Every 5 seconds)
    API->>DB: Query confirmed appointments for today
    API-->>TV: Return { nowServing, upNext: [Token A-99A1, Token A-44BC] }
    TV->>TV: Updates visual queue & estimated wait times

    Doctor->>API: Clicks "Call Next Patient" in Provider Dashboard
    API->>DB: Advances Token A-99A1 to status: "in_progress"
    TV->>API: Poll detects status shift
    TV->>TV: Plays auditory chime & flashes: "NOW SERVING: TOKEN #A-99A1 — ROOM 1"
```

---

## 10. WhatsApp Business Notification & 1-Click Interactive Response

```mermaid
sequenceDiagram
    autonumber
    participant System as Cloud Scheduler / Booking Engine
    participant WA as WhatsApp Service (Meta Cloud API)
    actor Customer as 📱 Pet Owner (WhatsApp)
    participant API as Fastify API (/whatsapp/webhook)

    System->>WA: sendBookingConfirmation() with interactive action buttons
    WA->>Customer: Delivers WhatsApp message with "📍 Directions" and "🔄 Reschedule" buttons
    
    Customer->>Customer: Taps "🔄 Reschedule" button in WhatsApp chat
    Customer->>WA: Interactive reply event dispatched
    WA->>API: POST /api/v1/whatsapp/webhook { button_reply: "RESCHEDULE_PTC-99A1" }
    API->>API: Initiates automated conversational rescheduling bot
    API-->>Customer: WhatsApp prompt: "Please reply with your preferred date & time"
```

---

## 11. Digital Pet Health Passport & DPDPA 2023 Consent Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    actor Clinic as 🏥 Visiting Clinic
    participant API as Fastify API (/health-passport)
    participant DB as Cloud Firestore
    
    Customer->>API: POST /api/v1/health-passport/{petId}/consent { providerId, durationHours: 48, scope: "full" }
    API->>DB: Write medicalConsents record with expiration timestamp & DPDPA signature
    API-->>Customer: Consent token issued with QR verification code
    
    Clinic->>API: GET /api/v1/health-passport/{petId} (Header: Provider Auth)
    API->>DB: Verify active non-expired consent record exists
    alt Valid Active Consent
        API->>DB: Fetch ISO microchip, complete vaccination history, and allergies
        API-->>Clinic: Return full medical dossier & immunization records
    else Consent Expired or Missing
        API-->>Clinic: HTTP 403 Forbidden ("Medical record consent required under DPDPA 2023")
    end
    
    Customer->>API: DELETE /api/v1/health-passport/{petId}/consent/{providerId}
    API->>DB: Mark consent revoked: true
    API-->>Customer: Instant access revocation confirmed
```

---

## 12. PawRewards Points Accrual & Redemption Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant Checkout as Booking / Payment Engine
    participant Rewards as Rewards Engine (/rewards)
    participant DB as Cloud Firestore

    Customer->>Checkout: Completes ₹2,000 veterinary appointment
    Checkout->>Rewards: Credit points (1 point per ₹10 spent = 200 points)
    Rewards->>DB: Append transaction to pawRewardsLedger/{customerId}
    Rewards->>DB: Increment customer profile pointsBalance
    Rewards-->>Customer: Push notification: "You earned 200 PawRewards! Total: 1,450"

    Customer->>Rewards: POST /api/v1/rewards/redeem { voucherId: "VOUCHER-GROOM-500" }
    Rewards->>DB: Check balance >= 500 points
    Rewards->>DB: Deduct 500 points with debit transaction
    Rewards->>DB: Issue single-use promotional voucher code `PETWO-PAW-778`
    Rewards-->>Customer: Return voucher for next checkout deduction
```

---

## 13. Cashless Pet Insurance Pre-Authorization Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Clinic as 🏥 Emergency Veterinary Hospital
    actor Insurer as 🛡️ Insurance TPA Partner (Digit / Bajaj)
    participant API as Fastify API (/insurance)
    participant DB as Cloud Firestore
    actor Owner as 📱 Pet Owner

    Clinic->>API: POST /api/v1/insurance/claims/pre-auth { petId, policyNumber, estimatedCostPaisa: 3500000, diagnosis: "Foreign body extraction" }
    API->>DB: Validate active policy & create insuranceClaims record in "submitted" status
    API->>Insurer: Relay pre-authorization request via webhook API
    
    Insurer-->>API: Pre-auth approved for up to ₹30,000 (3,000,000 paisa)
    API->>DB: Update claim status: "pre_authorized", approvedAmountPaisa: 3000000
    API->>Clinic: Cashless pre-approval letter & authorization code generated
    API->>Owner: SMS & Push: "Insurance pre-approved ₹30,000 for Rocky's procedure"
    
    Clinic->>API: POST /api/v1/insurance/claims/{claimId}/settle (Upload final invoice & discharge summary)
    API->>DB: Update claim status: "settled"
    API->>Insurer: Direct bank transfer dispatch to clinic Nodal account
```

---

## 14. At-Home Diagnostic Sample Phlebotomist Dispatch Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as 📱 Pet Owner
    participant API as Fastify API (/diagnostics)
    participant Dispatch as Phlebotomist Fleet Service
    participant Lab as 🔬 Central Diagnostic Lab (Hyderabad)
    participant DB as Cloud Firestore

    Owner->>API: POST /api/v1/diagnostics/orders { packageId: "PKG-CBC-BIOCHEM", scheduledSlot, address }
    API->>DB: Create diagnosticOrders record (status: "confirmed")
    API->>Dispatch: Auto-assign nearest certified veterinary phlebotomist
    API-->>Owner: Phlebotomist details & arrival ETA dispatched
    
    Dispatch->>Owner: Phlebotomist arrives with sterile vacutainers & cold-chain box
    Dispatch->>API: Samples collected & barcode scanned: "SAMPLE-99881-HYD"
    API->>DB: Update order status: "sample_collected"
    
    Dispatch->>Lab: Handover sample within 2 hours cold-chain guarantee
    Lab->>API: POST /api/v1/diagnostics/orders/{orderId}/publish-report { reportPdfUrl, biometrics: { rbc: 6.8, wbc: 11.2 } }
    API->>DB: Update status: "report_ready", store biometrics in pet medical history
    API->>Owner: WhatsApp alert with 1-click PDF download & Gemini AI explanation
```

---

## 15. Dynamic Yield Pricing Slot Evaluation

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant App as Flutter / Web App
    participant Engine as Yield Engine (/yield-pricing)
    participant DB as Cloud Firestore

    Customer->>App: Selects Grooming Service at Gachibowli Salon for Tuesday 2:00 PM
    App->>Engine: POST /api/v1/yield-pricing/quote { serviceId, providerId, timestamp: "2026-11-03T14:00:00Z" }
    Engine->>DB: Fetch provider yield rules & slot historical occupancy
    
    alt Tuesday 2:00 PM is Off-Peak (Historical Occupancy < 35%)
        Engine->>Engine: Apply configured 20% off-peak dynamic discount
        Engine-->>App: { basePrice: ₹1,500, dynamicPrice: ₹1,200, tag: "Off-Peak Smart Saver (20% Off)" }
    else Sunday 11:00 AM is High Demand (Occupancy > 90%)
        Engine->>Engine: Apply weekend peak surcharge (15%)
        Engine-->>App: { basePrice: ₹1,500, dynamicPrice: ₹1,725, tag: "High Demand Peak Hour" }
    end
    App-->>Customer: Displays transparent dynamic pricing breakdown
```

