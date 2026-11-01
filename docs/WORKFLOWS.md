# PETCO — End-to-End Working Flows

This document details the lifecycle and sequence of operations across all core platform interactions.

---

## 1. Customer Authentication & Pet Registration

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Pet Owner
    participant App as Flutter App
    participant Gateway as Fastify API
    participant SMS as MSG91 SMS Gateway
    participant Auth as Firebase Auth
    participant DB as Cloud Firestore

    Customer->>App: Enters Phone (+91 98765 43210)
    App->>Gateway: POST /api/v1/auth/otp/send
    Gateway->>DB: Check rate limits (30s cooldown)
    Gateway->>SMS: Dispatch 6-digit OTP
    Gateway-->>App: { expiresIn: 600s }

    Customer->>App: Enters OTP (e.g. 123456)
    App->>Gateway: POST /api/v1/auth/otp/verify
    Gateway->>DB: Verify OTP hash & attempt count
    Gateway->>Auth: Create/Fetch User UID
    Gateway->>DB: Upsert users/{uid} & customers/{uid}
    Gateway->>Auth: Mint Custom Auth Token
    Gateway-->>App: { customToken, role: "customer" }
    App->>Auth: signInWithCustomToken()
    Auth-->>App: Firebase ID Token

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
