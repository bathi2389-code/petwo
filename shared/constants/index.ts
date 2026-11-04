/**
 * PETWO Platform — Shared Constants
 * All enums, codes, and configuration values
 */

// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  AUTH_USER_INACTIVE: 'AUTH_004',
  AUTH_OTP_EXPIRED: 'AUTH_005',
  AUTH_OTP_INVALID: 'AUTH_006',
  AUTH_OTP_MAX_ATTEMPTS: 'AUTH_007',

  // Validation
  VALIDATION_FAILED: 'VAL_001',
  MISSING_REQUIRED_FIELD: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',

  // Resource
  NOT_FOUND: 'RES_001',
  ALREADY_EXISTS: 'RES_002',
  RESOURCE_INACTIVE: 'RES_003',

  // Booking
  BOOKING_SLOT_UNAVAILABLE: 'BKG_001',
  BOOKING_CANNOT_CANCEL: 'BKG_002',
  BOOKING_ALREADY_COMPLETED: 'BKG_003',
  BOOKING_RESCHEDULE_NOT_ALLOWED: 'BKG_004',
  BOOKING_PET_MISMATCH: 'BKG_005',

  // Payment
  PAYMENT_FAILED: 'PAY_001',
  PAYMENT_ALREADY_CAPTURED: 'PAY_002',
  PAYMENT_SIGNATURE_INVALID: 'PAY_003',
  REFUND_NOT_ELIGIBLE: 'PAY_004',
  REFUND_ALREADY_PROCESSED: 'PAY_005',

  // Provider
  PROVIDER_NOT_VERIFIED: 'PRV_001',
  PROVIDER_SUBSCRIPTION_REQUIRED: 'PRV_002',
  PROVIDER_LOCATION_LIMIT_REACHED: 'PRV_003',
  PROVIDER_STAFF_LIMIT_REACHED: 'PRV_004',
  PROVIDER_SERVICE_LIMIT_REACHED: 'PRV_005',

  // Coupon
  COUPON_NOT_FOUND: 'CPN_001',
  COUPON_EXPIRED: 'CPN_002',
  COUPON_USAGE_LIMIT_REACHED: 'CPN_003',
  COUPON_NOT_APPLICABLE: 'CPN_004',
  COUPON_MIN_ORDER_NOT_MET: 'CPN_005',

  // System
  INTERNAL_ERROR: 'SYS_001',
  EXTERNAL_SERVICE_ERROR: 'SYS_002',
  RATE_LIMIT_EXCEEDED: 'SYS_003',
} as const;

// ─── Business Constants ───────────────────────────────────────────────────────

export const PLATFORM = {
  NAME: 'PETWO',
  TAGLINE: 'Trusted Pet Care, At Your Convenience',
  SUPPORT_EMAIL: 'support@petwo.in',
  SUPPORT_PHONE: '+91-XXXXXXXXXX',
  WEBSITE: 'https://petwo.in',
  APP_STORE_URL: 'https://apps.apple.com/in/app/petwo',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=in.petwo',
} as const;

export const CURRENCY = {
  DEFAULT: 'INR' as const,
  SYMBOL: '₹',
  MULTIPLIER: 100, // paisa per rupee
};

export const COMMISSION = {
  DEFAULT_RATE: 15,         // 15%
  MIN_RATE: 5,              // 5%
  MAX_RATE: 25,             // 25%
  GST_ON_COMMISSION: 18,    // 18% GST on platform commission
} as const;

export const BOOKING = {
  NUMBER_PREFIX: 'PTC',
  ADVANCE_BOOKING_DAYS: 30,       // Max days in advance
  CANCELLATION_FREE_HOURS: 24,    // Cancel for free up to 24h before
  CANCELLATION_PARTIAL_HOURS: 2,  // Partial refund if > 2h before
  REMINDER_HOURS_BEFORE: 24,      // Send reminder 24h before
  REMINDER_MINUTES_BEFORE: 60,    // Send reminder 60min before
  MAX_RESCHEDULES: 2,
  AUTO_COMPLETE_HOURS: 2,         // Auto-complete booking N hours after scheduled end
} as const;

export const OTP = {
  LENGTH: 6,
  EXPIRES_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 30,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SEARCH = {
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 50,
  DEFAULT_RESULTS: 20,
} as const;

export const PROVIDER_SUBSCRIPTION_LIMITS = {
  starter: {
    maxLocations: 1,
    maxStaff: 2,
    maxServices: 10,
    hasAnalytics: false,
    hasFeaturedListing: false,
    commissionDiscount: 0,
  },
  growth: {
    maxLocations: 3,
    maxStaff: 10,
    maxServices: 50,
    hasAnalytics: true,
    hasFeaturedListing: false,
    commissionDiscount: 2,
  },
  pro: {
    maxLocations: 10,
    maxStaff: 50,
    maxServices: 200,
    hasAnalytics: true,
    hasFeaturedListing: true,
    commissionDiscount: 5,
  },
} as const;

export const SUBSCRIPTION_PRICES = {
  starter: { monthly: 0, yearly: 0 },
  growth:  { monthly: 99900, yearly: 999900 },   // ₹999/mo, ₹9999/yr
  pro:     { monthly: 249900, yearly: 2499900 },  // ₹2499/mo, ₹24999/yr
} as const;

export const TICKET_NUMBER_PREFIX = 'TKT';

export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_DOCUMENT_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

export const RATING = {
  MIN: 1,
  MAX: 5,
} as const;

// ─── India-Specific ───────────────────────────────────────────────────────────

export const INDIA = {
  COUNTRY_CODE: 'IN',
  PHONE_CODE: '+91',
  PHONE_LENGTH: 10,
  GST_RATE: 18,
  TDS_RATE: 5,    // TDS on professional services
  STATES: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
    'Chandigarh', 'Lakshadweep', 'Andaman & Nicobar Islands',
    'Dadra & Nagar Haveli', 'Daman & Diu',
  ],
} as const;

// ─── Service Categories ────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  { slug: 'veterinary',     name: 'Veterinary Care',     icon: '🏥' },
  { slug: 'grooming',       name: 'Grooming & Spa',      icon: '✂️' },
  { slug: 'physiotherapy',  name: 'Pet Physiotherapy',   icon: '🦴' },
  { slug: 'boarding',       name: 'Boarding & Stay',     icon: '🏨' },
  { slug: 'daycare',        name: 'Day Care',             icon: '🌞' },
  { slug: 'training',       name: 'Training',             icon: '🎓' },
  { slug: 'diagnostics',    name: 'Diagnostics & Labs',  icon: '🔬' },
  { slug: 'home-services',  name: 'Home Services',        icon: '🏠' },
  { slug: 'pet-walking',    name: 'Pet Walking',          icon: '🦮' },
] as const;
