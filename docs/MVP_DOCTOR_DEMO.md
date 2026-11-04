# PETWO — Doctor MVP walkthrough (5 minutes)

**Purpose:** demonstrate the current customer discovery experience honestly. This is a timed storyboard and presenter script, not a recorded video. Use the running app and real approved provider records. Do not seed or claim fictional clinics, ratings, distances, or appointment slots.

## Before the meeting

- Start the backend with a non-production demo environment and a valid Firebase configuration.
- Point the customer app at that backend; do not use localhost if presenting from another device. Build with `--dart-define=PETWO_API_BASE_URL=https://YOUR-RENDER-SERVICE/api/v1` after replacing the placeholder with your actual Render API URL.
- Sign in with a prepared demo customer account.
- Ensure at least one real provider profile is approved, active, has a correct clinic address, and has a business type matching the demo category. Use real review data only.
- If there is no approved physiotherapy provider, show the physiotherapy category and its honest empty state. Explain that provider onboarding/approval is required before a listing appears.
- Do not show real customer medical records or personal information. Use consented demo accounts and synthetic pet records.
- Check network connectivity and location permission. If location is unavailable, skip the distance demonstration rather than inventing a distance.

## Timed walkthrough

### 0:00–0:30 — PETWO and the problem

**Screen:** customer home screen with PETWO brand.

**Say:** “PETWO is a pet-care discovery platform. The aim is to help pet parents find relevant care providers and make provider feedback easier to compare. Today I’ll show the customer discovery experience and explain what is live versus what is planned.”

### 0:30–1:15 — Home and service categories

**Screen:** scroll through the home hero and service cards.

**Say:** “The home page brings the main pet-care categories into one place: veterinary care, grooming, physiotherapy, boarding, daycare and training. Physiotherapy is a first-class category rather than being hidden inside a generic clinic search.”

**Action:** tap Physiotherapy.

### 1:15–2:00 — Physiotherapy discovery

**Screen:** matching providers or the honest empty state.

**Say:** “The category filters the provider search by the physiotherapy-centre business type. Only active, approved providers are returned by the current public search endpoint. If no approved physiotherapy centre is registered yet, the app tells us that instead of displaying made-up clinics.”

**Action:** if a genuine approved listing exists, show its business name and verification status. Otherwise, keep the empty state visible.

### 2:00–2:50 — Feedback and trust

**Screen:** provider cards with published rating/review count, or new-listing state.

**Say:** “We want recommendations to be feedback-led, not simply nearest-first. Published ratings are displayed only when review data exists. A new clinic is clearly labelled as having no reviews yet. Verification status is shown separately from customer feedback.”

**Note:** the current score is a multi-factor backend ranking prototype. Do not describe it as a clinically validated quality score or claim a live reliability metric unless verified booking-completion data is connected.

### 2:50–3:35 — Location and distance

**Screen:** tap “Use my location”, grant permission, then show distance if the API returns it.

**Say:** “Location is optional. When the customer grants permission, the app sends coordinates to provider search and shows the returned distance in kilometres. Distance is supporting context; the default recommendation sort is not nearest-first.”

**Action:** if permission is denied or there are no geocoded clinics, explain that distance needs both customer and provider coordinates.

### 3:35–4:20 — Search and resilience

**Screen:** search for a service or clinic name, then demonstrate empty/error/retry state if appropriate.

**Say:** “Search is connected to the provider API. Loading, no-results and connection-error states are explicit, so the user is not misled by placeholder data.”

### 4:20–5:00 — Doctor feedback and next milestone

**Screen:** return to home; optionally show provider portal only if its live account and data are prepared.

**Say:** “For the next milestone, we want doctors and clinic staff to maintain their working hours, leave and appointment availability in a provider calendar. Customers will then see bookable slots with server-side collision protection. We are treating this as a separate release gate so we do not promise calendar functionality before it is implemented and tested.”

**Ask the doctor:** “Which information should a pet parent see before choosing a clinic: speciality, clinician experience, treatment services, verified credentials, feedback, fees, or appointment availability? Which should be mandatory?”

## Demo acceptance checklist

- [ ] App opens and logo renders.
- [ ] Search returns real API data.
- [ ] Physiotherapy category sends the expected provider type.
- [ ] No fake clinic or rating appears.
- [ ] Location permission is optional and distance appears only with real coordinates.
- [ ] Empty and error states are understandable.
- [ ] No real customer/pet medical data is exposed on screen.
- [ ] Clearly state that provider-managed calendar and appointment-slot UI are future work unless verified in the running build.
