# PETWO — Financial, Commission & Settlement Architecture

This document specifies the financial mechanics, taxation, and automated vendor settlement ledger governing PETWO operations in India.

---

## 1. Core Financial Principles

1. **Integer Arithmetic**: All monetary transactions, platform fees, taxes, and refunds are stored in **integer paisa** ($\text{₹}1 = 100\text{ paisa}$).
   - Example: An appointment costing $\text{₹}1,499.50$ is stored as `149950`.
   - Floating-point calculations are strictly prohibited in the billing engine.
2. **Escrow-Like Flow**: Customer payments are authorized and captured into PETWO's master Razorpay account upon booking confirmation. Funds are held until service fulfillment, protecting pet owners from unfulfilled appointments.
3. **Weekly Automated Payouts**: Completed appointments are consolidated every Monday for automated batch transfer via **Razorpay Route** directly to the provider's verified Indian bank account.

---

## 2. Commission & Taxation Breakdown

### 2.1 Service Category Take-Rates
| Category | Take-Rate | Rationalization |
|---|---|---|
| **Veterinary In-Clinic** | **15.0%** | Higher transaction volume; standard medical consultation rate |
| **Pet Grooming & Spa** | **18.0%** | High marketplace discovery value and discretionary pet lifestyle spend |
| **Boarding & Resorts** | **12.0%** | High ticket size; multi-day occupancy margins |
| **Doorstep Home Services**| **20.0%** | Premium convenience offering with logistics coordination |
| **Diagnostics & Labs** | **15.0%** | Specialized imaging, pathology and blood profile tests |
| **Pet Training** | **15.0%** | Multi-session packages and obedience courses |

### 2.2 Indian GST Mechanics (18%)
Under Indian Goods and Services Tax laws:
- Platform marketplace commission is subject to **18% GST**.
- The platform collects GST on its take-rate, issues a GST tax invoice to the provider, and providers with a registered GSTIN can claim this as **Input Tax Credit (ITC)**.

### 2.3 Mathematical Formula

Given:
- $A_{\text{service}}$ = Service base fee (in paisa)
- $R_{\text{gst}}$ = Service tax rate (18%)
- $R_{\text{comm}}$ = Category commission rate (e.g. 15%)
- $D$ = Applied promotional discount (funded by platform or provider)

$$\text{Tax}_{\text{service}} = \text{round}\left(A_{\text{service}} \times 0.18\right)$$
$$\text{Total Paid by Customer} = \max\left(0, A_{\text{service}} + \text{Tax}_{\text{service}} - D\right)$$
$$\text{Commission}_{\text{platform}} = \text{round}\left(\text{Total Paid} \times R_{\text{comm}}\right)$$
$$\text{GST on Commission} = \text{round}\left(\text{Commission}_{\text{platform}} \times 0.18\right)$$
$$\text{Net Provider Payout} = \text{Total Paid} - \text{Commission}_{\text{platform}} - \text{GST on Commission}$$

#### Concrete Example:
- Veterinary Consultation base fee: $\text{₹}1,000$ (`100000` paisa)
- 18% GST: $\text{₹}180$ (`18000` paisa)
- Customer Pays: $\text{₹}1,180$ (`118000` paisa)
- Platform Commission (15%): $\text{₹}177$ (`17700` paisa)
- 18% GST on Commission: $\text{₹}31.86 \approx \text{₹}32$ (`3186` paisa)
- **Net Payout Credited to Doctor**: $\text{₹}1,180 - \text{₹}177 - \text{₹}31.86 = \text{₹}971.14$ (`97114` paisa)

---

## 3. Provider SaaS Subscription Tiers

Providers can subscribe to upgraded tiers that discount booking commission rates:

| Feature / Limit | **Starter Plan** | **Growth Plan** | **Pro Facility** |
|---|---|---|---|
| **Monthly Pricing** | **Free (₹0)** | **₹999 / mo** | **₹2,499 / mo** |
| **Annual Pricing** | Free | ₹9,999 / yr | ₹24,999 / yr |
| **Maximum Physical Locations**| 1 Branch | 3 Branches | 10 Branches |
| **Maximum Staff Accounts** | 2 Staff | 10 Staff | 50 Staff |
| **Active Services in Catalogue** | 10 Services | 50 Services | 200 Services |
| **Analytics Dashboard** | Basic | Advanced Revenue & Retention | Advanced + Multi-Branch |
| **Featured Listing Boost** | No | Optional Add-on | Included in Hyderabad feed |
| **Commission Reduction** | 0% Discount | **2.0% Discount** | **5.0% Discount** |

---

## 4. Vendor Settlement Ledger Lifecycle

```
[Booking Completed]
        │
        ▼
[Eligible for Payout Queue] (Held during 24h dispute window)
        │
        ▼ (Every Monday 02:00 AM IST via Cloud Scheduler)
[Batch Settlement Aggregation] -> Consolidates all completed visits for vendor
        │
        ▼
[Razorpay Route Transfer] -> Generates transfer order to linked bank account
        │
        ├──> Success -> UTR logged, settlement marked "settled", vendor notified
        └──> Failure -> Alert triggered to finance admin, status "failed"
```

---

## 5. Cancellation & Refund Rules

1. **Free Cancellation**:
   - Customer cancels $>24\text{ hours}$ before scheduled slot: **100% full refund** credited to original payment source (UPI/Card).
2. **Late Cancellation**:
   - Customer cancels between $2\text{ hours}$ and $24\text{ hours}$ before slot: **50% partial refund**; 50% retained to compensate clinic for reserved slot.
   - Customer cancels $<2\text{ hours}$ or No-Show: **No refund**.
3. **Provider Cancellation**:
   - If a clinic or doctor cancels an appointment: **100% full refund** immediately credited to customer + $\text{₹}150$ courtesy credit applied to pet parent's wallet.
