# PETWO — REST API Specification & Contract Reference

- **Base URL**: `https://api.petwo.in/api/v1` (Local: `http://localhost:4000/api/v1`)
- **Interactive Documentation**: Swagger UI available at `http://localhost:4000/docs`
- **Authentication**: Bearer Token in `Authorization: Bearer <FIREBASE_ID_TOKEN>` header
- **Standard Response Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "limit": 20, "total": 100 }
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VAL_001",
      "message": "Validation failed",
      "details": { ... }
    }
  }
  ```

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/otp/send` | Public | Dispatches 6-digit OTP to Indian mobile number |
| `POST` | `/auth/otp/verify` | Public | Verifies OTP and returns Firebase Custom Auth Token |
| `GET`  | `/auth/me` | Authenticated | Fetches profile of current session user |
| `POST` | `/auth/logout` | Authenticated | Revokes Firebase refresh tokens |

### Request: `POST /auth/otp/send`
```json
{
  "phone": "+919876543210"
}
```

### Response: `POST /auth/otp/verify`
```json
{
  "success": true,
  "data": {
    "customToken": "eyJhbGciOi...",
    "uid": "usr_99812",
    "role": "customer",
    "isNewUser": false
  }
}
```

---

## 2. Customer Management (`/customers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/customers/me` | Customer | Fetch current customer profile & settings |
| `PUT`  | `/customers/me` | Customer | Update name, email, addresses, preferences |
| `POST` | `/customers/me/saved-providers` | Customer | Toggle bookmarking a favorite clinic/vet |
| `GET`  | `/customers/me/saved-providers` | Customer | Retrieve all saved provider cards |
| `DELETE` | `/customers/me` | Customer | Soft-delete account with 30-day retention |

---

## 3. Pet Profiles & Health Records (`/pets`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/pets` | Customer | Retrieve all active pets belonging to user |
| `POST` | `/pets` | Customer | Register a new pet profile |
| `GET`  | `/pets/:petId` | Owner/Vet | Inspect detailed pet profile |
| `PUT`  | `/pets/:petId` | Owner | Update pet metrics (weight, allergies) |
| `DELETE`| `/pets/:petId` | Owner | Soft-delete pet |
| `GET`  | `/pets/:petId/vaccinations` | Owner/Vet | Vaccination records with due dates |
| `POST` | `/pets/:petId/vaccinations` | Owner/Vet | Log administered vaccine |
| `GET`  | `/pets/:petId/medical-records` | Owner/Vet | Consultation, lab & prescription history |
| `POST` | `/pets/:petId/medical-records` | Owner/Vet | Append clinical examination notes |

---

## 4. Providers & Discovery (`/providers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/providers/register` | Authenticated | Onboard new clinic, hospital, or solo practice |
| `GET`  | `/providers/me` | Provider | Retrieve own business profile |
| `PUT`  | `/providers/me` | Provider | Update business description & media |
| `GET`  | `/providers/search` | Public | Geo-spatial & category search across Hyderabad |
| `GET`  | `/providers/:providerId` | Public | Public clinic profile with verified badge |
| `GET`  | `/providers/me/locations` | Provider | List all physical operating branches |
| `POST` | `/providers/me/locations` | Provider | Add a new location branch |
| `GET`  | `/providers/:id/availability` | Public | Compute 30-min booking slots for a date |

---

## 5. Services Catalogue (`/services`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/services` | Public | Filter services by `providerId` or `locationId` |
| `POST` | `/services` | Provider | Create new service with integer paisa pricing |
| `PUT`  | `/services/:id` | Provider | Update service details or pricing |
| `DELETE`| `/services/:id` | Provider | Deactivate service |

---

## 6. Bookings & Appointments (`/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings` | Customer | Create appointment with slot conflict check |
| `GET`  | `/bookings/my` | Customer | Retrieve user's upcoming & past bookings |
| `GET`  | `/bookings/provider` | Provider | Retrieve provider's operational appointment queue |
| `GET`  | `/bookings/:id` | Involved User | Detailed booking breakdown with pricing |
| `PUT`  | `/bookings/:id/confirm` | Provider | Confirm pending customer appointment |
| `PUT`  | `/bookings/:id/cancel` | Involved User | Cancel booking with automatic refund check |
| `PUT`  | `/bookings/:id/reschedule` | Customer | Change appointment time slot |
| `PUT`  | `/bookings/:id/status` | Provider/Admin | Advance status (`in_progress`, `completed`) |

---

## 7. Payments & Refunds (`/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payments/orders` | Customer | Generate Razorpay Order for a booking |
| `POST` | `/payments/verify` | Customer | Verify HMAC-SHA256 signature and lock booking |
| `POST` | `/payments/refund` | Admin | Execute Razorpay full or partial refund |
| `GET`  | `/payments/:paymentId`| Involved User | Detailed receipt and gateway transaction ID |

---

## 8. AI Veterinary Triage (`/ai-triage`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ai-triage/assess` | Customer | Send symptoms to Gemini 3.8 Flash for triage |
| `GET`  | `/ai-triage/history` | Customer | Retrieve past triage sessions for a pet |

### Request: `POST /ai-triage/assess`
```json
{
  "petId": "pet_123",
  "symptoms": "Lethargic, refusing meals since morning, vomited yellow foam once",
  "durationHours": 12,
  "isPainExhibited": false
}
```

### Response:
```json
{
  "success": true,
  "data": {
    "severity": "routine",
    "urgencySummary": "Mild gastrointestinal upset. In-clinic consultation advised within 24 hours.",
    "primaryHypotheses": ["Dietary indiscretion", "Mild gastritis"],
    "immediateFirstAid": ["Provide fresh water", "Withhold heavy food for 4 hours"],
    "recommendedAction": "Book In-Clinic Consultation",
    "suggestedCategorySlug": "veterinary"
  }
}
```

---

## 9. Teleconsultation (`/teleconsult`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/teleconsult/rooms/:bookingId` | Involved User | Initialize WebRTC room credentials |
| `POST` | `/teleconsult/prescriptions` | Provider | Doctor generates digitally signed e-Rx |
| `GET`  | `/teleconsult/prescriptions/booking/:id` | Involved User | Download prescription details |

---

## 10. 24/7 Emergency SOS (`/emergency`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/emergency/sos` | Customer | Broadcast critical alert & locate nearest 24/7 ICU |
| `GET`  | `/emergency/hospitals` | Public | Directory of 24/7 emergency trauma centers in HYD |

---

## 11. Administration (`/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/admin/providers` | Admin | List providers filtered by verification status |
| `PUT`  | `/admin/providers/:id/verify` | Admin | Approve or reject provider practice |
| `GET`  | `/admin/bookings` | Admin | Marketplace surveillance over all bookings |
| `GET`  | `/admin/analytics/overview` | Admin | Platform-wide GMV, commission, and partner KPIs |
| `POST` | `/admin/commissions/config` | Admin | Dynamically update category take-rate |
| `POST` | `/admin/coupons` | Admin | Create promotional discount coupon |
| `GET`  | `/admin/audit-logs` | Admin | Paginated security audit trail |


---

## 12. WhatsApp Business Integration (`/whatsapp`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/whatsapp/webhook` | Meta Public | Verification challenge for Meta WhatsApp Cloud API |
| `POST` | `/whatsapp/webhook` | Meta Public | Receives incoming interactive button replies (Reschedule, Directions) |
| `POST` | `/whatsapp/send-confirmation` | Provider/Admin | Dispatches appointment confirmation template with action buttons |

---

## 13. IoT Pet Collar & Biometrics (`/iot`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/iot/devices/pair` | Customer | Register & pair hardware collar serial number to pet |
| `POST` | `/iot/telemetry/ingest` | Device | Ingest live GPS coordinates, battery, and vital signs |
| `GET`  | `/iot/telemetry/:petId/live` | Customer/Vet | Retrieve current location, body temperature & heart rate |
| `POST` | `/iot/geofence` | Customer | Establish a safe zone boundary radius around home/park |
| `POST` | `/iot/simulate/:petId` | Customer | Trigger simulated GPS movement and vitals in Hyderabad |

### Telemetry Payload Sample:
```json
{
  "deviceSerial": "PETWO-PRO-8812",
  "lat": 17.4239,
  "lng": 78.4378,
  "batteryPercent": 94,
  "heartRateBpm": 96,
  "temperatureC": 38.6,
  "activityLevel": "walking",
  "dailySteps": 5420
}
```

---

## 14. In-Clinic Reception TV Queue (`/queue`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/queue/:locationId` | Public TV Display | Real-time queue state ("Now Serving", "Up Next", wait times) |
| `PUT`  | `/queue/:locationId/call-next`| Provider | Advances queue token and assigns consultation room |

### Reception TV Payload:
```json
{
  "locationId": "loc-banjara-hills-01",
  "nowServing": {
    "tokenNumber": "A-99A1",
    "room": "Consultation Suite 1",
    "doctorName": "Dr. Srinivas Rao, MVSc",
    "petName": "Rocky (Golden Retriever)",
    "serviceName": "General Health Checkup"
  },
  "upNext": [
    { "tokenNumber": "A-44BC", "scheduledTime": "11:15 AM", "estimatedWaitMins": 12 },
    { "tokenNumber": "A-12EF", "scheduledTime": "11:30 AM", "estimatedWaitMins": 27 }
  ],
  "stats": { "totalToday": 24, "completedToday": 14, "inWaitingRoom": 3 },
  "announcement": "PETWO 24/7 Emergency Care Active • Free Dental Checkups during Pet Health Month in Hyderabad"
}
```

---

## 15. Digital Pet Health Passport & DPDPA Consent (`/health-passport`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/health-passport/:petId` | Authenticated | Generates full Digital Passport, QR verification code & ISO 11784 microchip status |
| `POST` | `/health-passport/:petId/microchip` | Customer / Vet | Register or update 15-digit ISO 11784/11785 microchip details |
| `POST` | `/health-passport/:petId/consent` | Customer | Grant time-bound DPDPA medical record read consent to a clinic/provider |
| `DELETE` | `/health-passport/:petId/consent/:providerId` | Customer | Revoke provider access to medical records immediately |

### Health Passport Verification QR Payload Sample:
```json
{
  "passportNumber": "PETWO-PASS-8812A",
  "pet": {
    "name": "Rocky",
    "species": "dog",
    "breed": "Golden Retriever",
    "isNeutered": true,
    "bloodGroup": "DEA 1.1+",
    "microchip": {
      "number": "900215000492817",
      "implantDate": "2023-04-12",
      "implantedBy": "Dr. Srinivas Rao, MVSc",
      "verified": true
    }
  },
  "vaccinationsSummary": {
    "total": 4,
    "upToDate": true,
    "nextDue": "2026-12-05",
    "rabiesValidUntil": "2027-01-10"
  },
  "verificationUrl": "https://verify.petwo.in/passport/PETWO-PASS-8812A"
}
```

---

## 16. PawRewards Points & Loyalty Ledger (`/rewards`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/rewards/balance` | Customer | Fetches current balance, tier (Silver/Gold/Platinum), and lifetime points |
| `GET`  | `/rewards/history` | Customer | Paginated point transactions (credits from bookings, debits from vouchers) |
| `GET`  | `/rewards/catalog` | Customer | Active reward vouchers available for redemption |
| `POST` | `/rewards/redeem` | Customer | Redeems points for service vouchers or partner grooming discounts |

---

## 17. Pet Health Insurance Marketplace & Cashless Pre-Auth (`/insurance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/insurance/quotes` | Customer | Instant quotation matrix across Bajaj Allianz, Digit, and PetSecure partners |
| `POST` | `/insurance/policies/bind` | Customer | Issues policy coverage instantly with digital certificate and cashless card |
| `POST` | `/insurance/claims/pre-auth` | Provider / Clinic | Initiates real-time cashless claim pre-authorization for emergency or surgery |
| `GET`  | `/insurance/claims/:claimId/status` | Customer / Clinic | Live claim adjudication tracking and authorized amount |

---

## 18. At-Home Diagnostic Sample Collection & Lab Reports (`/diagnostics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/diagnostics/packages` | Public | List available home pathology tests (CBC, Renal, Liver, Tick Fever PCR) |
| `POST` | `/diagnostics/orders` | Customer | Book phlebotomist home visit with slot scheduling and address geocoding |
| `POST` | `/diagnostics/orders/:orderId/publish-report` | Lab Tech / Vet | Upload PDF report and flag abnormal biometric parameters |
| `GET`  | `/diagnostics/orders/:orderId` | Customer / Vet | Track phlebotomist transit, view test progress, and download PDF report |

---

## 19. Dynamic Yield & Off-Peak Pricing (`/yield-pricing`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`  | `/yield-pricing/rules` | Provider | Retrieve custom yield pricing rules configured for provider services |
| `POST` | `/yield-pricing/rules` | Provider | Configure off-peak discounts (e.g. 20% off Tue 1-4 PM) or weekend surges |
| `POST` | `/yield-pricing/quote` | Public / Customer | Calculates dynamic price for service based on timestamp, day, and occupancy |

