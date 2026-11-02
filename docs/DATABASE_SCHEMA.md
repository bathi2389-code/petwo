# PETWO — Database Schema Specification

This document provides the full data dictionary and entity design for Cloud Firestore Enterprise mode.

---

## 1. Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "extends (customer role)"
    USERS ||--o| PROVIDERS : "extends (provider role)"
    CUSTOMERS ||--o{ PETS : owns
    PETS ||--o{ VACCINATION_RECORDS : has
    PETS ||--o{ MEDICAL_RECORDS : has
    PROVIDERS ||--o{ PROVIDER_LOCATIONS : operates
    PROVIDERS ||--o{ STAFF : employs
    PROVIDERS ||--o{ SERVICES : offers
    PROVIDER_LOCATIONS ||--o{ SERVICES : hosts
    SERVICE_CATEGORIES ||--o{ SERVICES : classifies

    CUSTOMERS ||--o{ BOOKINGS : books
    PROVIDERS ||--o{ BOOKINGS : fulfills
    PETS ||--o{ BOOKINGS : subject_of
    SERVICES ||--o{ BOOKINGS : includes

    BOOKINGS ||--o| PAYMENTS : settled_via
    PROVIDERS ||--o{ SETTLEMENTS : receives
    BOOKINGS ||--o| REVIEWS : receives_rating
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ SUPPORT_TICKETS : creates
```

---

## 2. Collection Data Dictionary

### 2.1 `users/{userId}`
Root authentication record mapping directly to Firebase Auth UID.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique Firebase User UID |
| `phone` | `string` | Normalized E.164 phone (`+919876543210`) |
| `email` | `string?` | Optional official email address |
| `displayName` | `string` | Name for display |
| `role` | `enum` | `'customer' \| 'provider' \| 'admin' \| 'super_admin'` |
| `isActive` | `boolean` | Account active flag |
| `isEmailVerified`| `boolean` | Verification status |
| `createdAt` | `string` | ISO 8601 creation timestamp |
| `updatedAt` | `string` | ISO 8601 last updated timestamp |

### 2.2 `customers/{customerId}`
Extended profile for pet parents.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Customer ID (matches `userId`) |
| `userId` | `string` | Foreign key to `users/{userId}` |
| `firstName` | `string` | Given name |
| `lastName` | `string` | Family name |
| `savedProviders` | `string[]` | Array of favored `providerId`s |
| `address` | `map?` | Home address with lat/lng coordinates |
| `notificationPreferences` | `map` | SMS, Email, Push toggles |

### 2.3 `pets/{petId}`
Pet profile details.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Nanoid pet identifier |
| `ownerId` | `string` | Foreign key to `customers/{id}` |
| `name` | `string` | Pet name |
| `species` | `enum` | `'dog' \| 'cat' \| 'bird' \| 'rabbit' \| 'hamster' \| 'fish' \| 'reptile' \| 'other'` |
| `breed` | `string` | Breed description |
| `gender` | `enum` | `'male' \| 'female' \| 'unknown'` |
| `dob` | `string?` | Date of birth (YYYY-MM-DD) |
| `weight` | `number?` | Weight in kilograms |
| `allergies` | `string[]` | List of documented drug/food allergies |
| `specialNotes` | `string?` | Behavioral or special care instructions |
| `isActive` | `boolean` | Soft-deletion flag |

### 2.4 `providers/{providerId}`
Registered provider businesses and solo practitioners.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Provider ID (matches `userId`) |
| `businessName` | `string` | Legal or trade business name |
| `businessType` | `enum` | `'individual_vet' \| 'veterinary_clinic' \| 'veterinary_hospital' \| 'grooming_salon' \| 'boarding_facility' \| 'daycare_facility' \| 'diagnostic_centre' \| 'pet_trainer'` |
| `verificationStatus` | `enum` | `'pending' \| 'under_review' \| 'approved' \| 'rejected' \| 'suspended'` |
| `registrationNo` | `string?` | VCI or State Veterinary Council registration |
| `panNumber` | `string?` | 10-character Indian Permanent Account Number |
| `gstNumber` | `string?` | 15-character GSTIN |
| `subscription` | `map` | Tier (`'starter' \| 'growth' \| 'pro'`), status, billing dates |
| `rating` | `number` | Aggregated score (1.0–5.0) |
| `reviewCount` | `number` | Count of verified reviews |
| `isFeatured` | `boolean` | Priority marketplace placement |

### 2.5 `services/{serviceId}`
Specific service offerings published by providers.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Nanoid service identifier |
| `providerId` | `string` | Foreign key to `providers/{id}` |
| `locationId` | `string` | Foreign key to `providerLocations/{id}` |
| `categoryId` | `string` | Foreign key to `serviceCategories/{id}` |
| `name` | `string` | Service title (e.g. "Full Grooming & Spa") |
| `price.amount` | `number` | **Integer paisa** (₹1 = 100 paisa) |
| `price.currency` | `string` | Always `'INR'` |
| `price.priceType` | `enum` | `'fixed' \| 'starting_from' \| 'per_hour' \| 'per_night'` |
| `duration` | `number` | Slot duration in minutes |
| `isActive` | `boolean` | Availability toggle |

### 2.6 `bookings/{bookingId}`
Transactional appointments and reservations.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Nanoid booking identifier |
| `bookingNumber` | `string` | Human-readable identifier (`PTC-YYYYMMDD-XXXX`) |
| `bookingType` | `enum` | `'appointment' \| 'boarding' \| 'home_service'` |
| `customerId` | `string` | Pet parent UID |
| `providerId` | `string` | Provider UID |
| `petId` | `string` | Pet profile ID |
| `serviceId` | `string` | Service catalog ID |
| `status` | `enum` | `'pending_confirmation' \| 'confirmed' \| 'in_progress' \| 'completed' \| 'cancelled_by_customer' \| 'cancelled_by_provider' \| 'no_show' \| 'refunded'` |
| `scheduledAt` | `string` | ISO 8601 start datetime |
| `scheduledEnd` | `string` | ISO 8601 end datetime |
| `pricing.totalAmount` | `number` | Final charged amount in paisa |
| `commission.rate` | `number` | Take-rate percentage (e.g. 15%) |
| `commission.amount` | `number` | Platform fee in paisa |
| `commission.netProviderAmount`| `number` | Net payable to vendor in paisa |
| `payment.status` | `enum` | `'created' \| 'captured' \| 'failed' \| 'refunded'` |

### 2.7 `medicalConsents/{consentId}`
DPDPA 2023 compliant access grants for medical records and health passports.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique consent record ID |
| `petId` | `string` | Foreign key to `pets/{petId}` |
| `customerId` | `string` | Pet owner UID granting consent |
| `providerId` | `string` | Clinic or veterinarian UID receiving read access |
| `scope` | `string` | Access scope (`'full' \| 'vaccinations_only' \| 'emergency'`) |
| `expiresAt` | `string` | ISO 8601 expiry timestamp |
| `isRevoked` | `boolean` | Immediate revocation flag |
| `grantedAt` | `string` | ISO 8601 creation timestamp |

### 2.8 `pawRewards/{customerId}` & `pawRewardsLedger/{transactionId}`
Gamification, loyalty points, and promotional voucher ledger.

| Field | Type | Description |
|---|---|---|
| `customerId` | `string` | Pet owner UID |
| `pointsBalance` | `number` | Current available spendable points |
| `lifetimeEarned` | `number` | Total historical points accumulated |
| `tier` | `enum` | `'Silver' \| 'Gold' \| 'Platinum'` |
| `transactions` | `subcollection` | Historical ledger entries (`amount`, `type: credit \| debit`, `sourceBookingId`, `createdAt`) |

### 2.9 `insurancePolicies/{policyId}` & `insuranceClaims/{claimId}`
Pet health insurance policies and cashless hospital pre-authorizations.

| Field | Type | Description |
|---|---|---|
| `policyId` | `string` | Insurance policy certificate number |
| `petId` | `string` | Insured pet ID |
| `insurerName` | `string` | Partner name (`'Bajaj Allianz' \| 'Digit' \| 'PetSecure'`) |
| `sumInsuredPaisa` | `number` | Total annual coverage amount in paisa |
| `copayPercent` | `number` | Co-pay percentage (e.g. 10%) |
| `claimId` | `string` | Unique cashless claim ticket ID |
| `claimStatus` | `enum` | `'submitted' \| 'pre_authorized' \| 'approved' \| 'settled' \| 'rejected'` |
| `authorizedAmountPaisa` | `number` | Insurer pre-approved cashless payout amount |

### 2.10 `diagnosticOrders/{orderId}`
At-home pathology sample collections and diagnostic lab reports.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Diagnostic order identifier (`PTC-LAB-XXXX`) |
| `customerId` | `string` | Pet owner UID |
| `petId` | `string` | Patient pet ID |
| `packageId` | `string` | Test package identifier (CBC, Renal, Liver, Tick Fever PCR) |
| `collectionAddress` | `object` | Home pickup address with geocoded lat/lng |
| `status` | `enum` | `'pending' \| 'confirmed' \| 'phlebotomist_assigned' \| 'sample_collected' \| 'in_lab' \| 'report_ready'` |
| `reportPdfUrl` | `string` | Cloud Storage secure signed URL for PDF lab report |
| `biometricResults` | `object` | Structured lab parameters (RBC, WBC, Platelets, Creatinine) |

### 2.11 `yieldPricingRules/{ruleId}`
Provider dynamic revenue management and off-peak discount rules.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Dynamic pricing rule identifier |
| `providerId` | `string` | Provider UID |
| `serviceId` | `string` | Target service or `'*'` for all |
| `dayOfWeek` | `number` | `0` (Sun) to `6` (Sat) |
| `startHour` | `number` | Starting hour in 24h format (e.g. 13 for 1 PM) |
| `endHour` | `number` | Ending hour in 24h format (e.g. 16 for 4 PM) |
| `adjustmentPercent` | `number` | Percentage delta (-20 for 20% discount, +15 for 15% peak surge) |
| `isActive` | `boolean` | Rule enable/disable state |

---

## 3. Composite Index Requirements

The following compound indexes are defined in `infrastructure/firebase/firestore.indexes.json` to guarantee queries perform in $<10\text{ms}$:

| Collection | Fields Indexed | Query Intent |
|---|---|---|
| `bookings` | `customerId` (ASC) + `createdAt` (DESC) | Customer booking history listing |
| `bookings` | `providerId` (ASC) + `scheduledAt` (ASC) | Provider daily calendar schedule |
| `bookings` | `providerId` (ASC) + `status` (ASC) + `scheduledAt` (ASC) | Active queue filtering |
| `providers`| `verificationStatus` (ASC) + `isActive` (ASC) + `rating` (DESC) | Public discovery rankings |
| `services` | `providerId` (ASC) + `isActive` (ASC) | Provider active catalogue lookup |
| `reviews`  | `providerId` (ASC) + `status` (ASC) + `createdAt` (DESC) | Published review feed |
| `settlements`| `providerId` (ASC) + `status` (ASC) + `createdAt` (DESC) | Vendor payout ledger |
