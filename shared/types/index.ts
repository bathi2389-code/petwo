/**
 * PETWO Platform — Shared TypeScript Types
 * Single source of truth for all API contracts and data models
 */

// ─── Primitives ──────────────────────────────────────────────────────────────

export type Timestamp = {
  _seconds: number;
  _nanoseconds: number;
};

export type Currency = 'INR';

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: 'IN';
  coordinates?: GeoPoint;
};

export type ContactInfo = {
  phone: string;
  email: string;
  whatsapp?: string;
};

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'provider' | 'admin' | 'super_admin';

export type AuthUser = {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Customer ─────────────────────────────────────────────────────────────────

export type Customer = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  photoURL?: string;
  address?: Address;
  savedProviders: string[];
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferences = {
  bookingUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  sms: boolean;
  email: boolean;
  push: boolean;
};

// ─── Pet ─────────────────────────────────────────────────────────────────────

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'hamster'
  | 'fish'
  | 'reptile'
  | 'other';

export type PetGender = 'male' | 'female' | 'unknown';

export type Pet = {
  id: string;
  ownerId: string; // customerId
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dob?: string; // ISO date
  weight?: number; // kg
  color?: string;
  photoURL?: string;
  microchipId?: string;
  registrationNo?: string;
  isNeutered?: boolean;
  allergies?: string[];
  specialNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VaccinationRecord = {
  id: string;
  petId: string;
  vaccineName: string;
  administeredBy?: string; // provider name
  administeredAt: string;
  nextDueAt?: string;
  batchNo?: string;
  documentURL?: string;
  notes?: string;
  createdAt: string;
};

export type MedicalRecord = {
  id: string;
  petId: string;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'surgery' | 'lab_result' | 'prescription';
  title: string;
  description: string;
  diagnosedBy?: string; // provider name
  recordedAt: string;
  attachments?: string[]; // URLs
  medications?: Medication[];
  followUpAt?: string;
  providerId?: string;
  bookingId?: string;
  createdAt: string;
};

export type Medication = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export type ProviderType =
  | 'individual_vet'
  | 'veterinary_clinic'
  | 'veterinary_hospital'
  | 'grooming_salon'
  | 'boarding_facility'
  | 'daycare_facility'
  | 'diagnostic_centre'
  | 'pet_trainer'
  | 'pet_sitter'
  | 'pet_walker';

export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type ProviderSortOption = 'recommended' | 'highest_rated' | 'nearest' | 'most_reviewed';

export type Provider = {
  id: string;
  userId: string;
  businessName: string;
  businessType: ProviderType;
  description?: string;
  tagline?: string;
  logoURL?: string;
  coverPhotoURL?: string;
  contact: ContactInfo;
  address?: Address;
  coordinates?: GeoPoint;
  geohash?: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  documents: ProviderDocument[];
  registrationNo?: string; // GST / PAN / clinic registration
  panNumber?: string;
  gstNumber?: string;
  bankDetails?: BankDetails;
  subscription: ProviderSubscription;
  rating?: number; // 1–5, computed average
  reviewCount?: number;
  weightedRating?: number; // Bayesian confidence-adjusted rating
  reliabilityScore?: number; // 0–100, based on completion & cancellation rate
  completedBookings?: number;
  cancelledBookings?: number;
  totalBookings?: number;
  recommendationScore?: number; // Multi-factor ranking score
  isNewProvider?: boolean;
  distanceKm?: number; // Calculated relative to customer location
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProviderDocument = {
  id: string;
  type:
    | 'degree_certificate'
    | 'registration_certificate'
    | 'gst_certificate'
    | 'pan_card'
    | 'id_proof'
    | 'address_proof'
    | 'shop_act_license'
    | 'other';
  name: string;
  url: string; // Signed URL from Firebase Storage
  uploadedAt: string;
  verified: boolean;
};

export type BankDetails = {
  accountHolderName: string;
  accountNumber: string; // masked for display
  ifscCode: string;
  bankName: string;
  razorpayFundAccountId?: string;
};

// ─── Provider Locations ───────────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeSlot = {
  start: string; // HH:MM 24h
  end: string;   // HH:MM 24h
};

export type DaySchedule = {
  day: DayOfWeek;
  isOpen: boolean;
  slots: TimeSlot[];
};

export type ProviderLocation = {
  id: string;
  providerId: string;
  name: string; // "Main Clinic", "Branch — Banjara Hills"
  address: Address;
  contact: ContactInfo;
  operatingHours: DaySchedule[];
  amenities?: string[];
  photoURLs?: string[];
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Staff ────────────────────────────────────────────────────────────────────

export type Staff = {
  id: string;
  providerId: string;
  locationId: string;
  firstName: string;
  lastName: string;
  role: string; // "Veterinarian", "Groomer", "Receptionist"
  qualification?: string;
  photoURL?: string;
  phone: string;
  email?: string;
  schedule: DaySchedule[];
  registrationNo?: string; // For vets: VCI registration
  specializations?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Service Categories ────────────────────────────────────────────────────────

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconURL?: string;
  parentCategoryId?: string;
  allowedProviderTypes: ProviderType[];
  defaultDuration?: number; // minutes
  commissionRate: number; // 0–100 (percent)
  isActive: boolean;
  sortOrder: number;
};

// ─── Services ────────────────────────────────────────────────────────────────

export type PriceType = 'fixed' | 'starting_from' | 'per_hour' | 'per_night';

export type ServicePrice = {
  amount: number; // in paisa (₹1 = 100 paisa)
  currency: Currency;
  priceType: PriceType;
};

export type Service = {
  id: string;
  providerId: string;
  locationId: string;
  categoryId: string;
  staffIds?: string[];
  name: string;
  description?: string;
  price: ServicePrice;
  duration: number; // minutes (0 for TBD)
  bufferTime?: number; // minutes between appointments
  maxCapacity?: number; // for group sessions
  allowedPetSpecies?: PetSpecies[];
  tags?: string[];
  imageURLs?: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Availability ─────────────────────────────────────────────────────────────

export type AvailabilitySlot = {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  isBooked: boolean;
  staffId?: string;
};

export type BlockedSlot = {
  id: string;
  providerId: string;
  locationId?: string;
  staffId?: string;
  from: string;
  to: string;
  reason?: string;
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_provider'
  | 'no_show'
  | 'disputed'
  | 'refunded';

export type BookingType = 'appointment' | 'boarding' | 'home_service';

export type BookingPricing = {
  serviceAmount: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  currency: Currency;
};

export type CommissionDetails = {
  rate: number;       // percent
  amount: number;     // in paisa
  taxOnCommission: number;
  netProviderAmount: number;
  settled: boolean;
  settlementId?: string;
};

export type CancellationDetails = {
  cancelledBy: 'customer' | 'provider' | 'admin';
  reason: string;
  cancelledAt: string;
  refundEligible: boolean;
  refundAmount?: number;
};

export type Booking = {
  id: string;
  bookingNumber: string; // PTC-YYYYMMDD-XXXX
  bookingType: BookingType;
  customerId: string;
  petId: string;
  providerId: string;
  locationId: string;
  serviceId: string;
  staffId?: string;
  status: BookingStatus;
  scheduledAt: string; // ISO datetime
  scheduledEnd: string;
  // Boarding-specific
  checkInAt?: string;
  checkOutAt?: string;
  // Home service
  serviceAddress?: Address;
  notes?: string;
  specialInstructions?: string;
  pricing: BookingPricing;
  commission: CommissionDetails;
  payment?: PaymentSummary;
  cancellation?: CancellationDetails;
  rating?: BookingRating;
  history: BookingEvent[];
  createdAt: string;
  updatedAt: string;
};

export type BookingEvent = {
  status: BookingStatus;
  timestamp: string;
  actor: string; // userId or 'system'
  note?: string;
};

export type BookingRating = {
  score: number; // 1–5
  review?: string;
  ratedAt: string;
  isPublic: boolean;
};

export type PaymentSummary = {
  paymentId: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
};

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'created'
  | 'attempted'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type Payment = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  gateway: 'razorpay';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;       // in paisa
  currency: Currency;
  status: PaymentStatus;
  method?: 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';
  errorCode?: string;
  errorDescription?: string;
  refunds?: Refund[];
  createdAt: string;
  updatedAt: string;
};

export type Refund = {
  id: string;
  paymentId: string;
  gatewayRefundId?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  initiatedBy: string;
  processedAt?: string;
  createdAt: string;
};

export type Settlement = {
  id: string;
  providerId: string;
  period: { from: string; to: string };
  bookingIds: string[];
  grossAmount: number;
  commissionAmount: number;
  taxOnCommission: number;
  platformFees: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'settled' | 'failed';
  razorpayTransferId?: string;
  utrNumber?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionTier = 'starter' | 'growth' | 'pro';

export type ProviderSubscription = {
  tier: SubscriptionTier;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  razorpaySubscriptionId?: string;
  cancelledAt?: string;
};

export type SubscriptionPlan = {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number; // in paisa
  priceYearly: number;
  features: string[];
  maxLocations: number;
  maxStaff: number;
  maxServices: number;
  hasAnalytics: boolean;
  hasFeaturedListing: boolean;
  commissionDiscount: number; // percentage discount on commission
  isActive: boolean;
};

// ─── Coupons ─────────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'flat';

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  applicableCategories?: string[];
  applicableProviders?: string[];
  usageLimit?: number;
  usedCount: number;
  userUsageLimit: number; // per user
  validFrom: string;
  validTo: string;
  fundedBy: 'platform' | 'provider';
  fundedByProviderId?: string;
  isActive: boolean;
  createdAt: string;
};

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type Review = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  rating: number; // 1–5
  title?: string;
  body?: string;
  photoURLs?: string[];
  providerResponse?: string;
  providerRespondedAt?: string;
  status: 'pending' | 'published' | 'flagged' | 'removed';
  isVerified: boolean; // attached to actual booking
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'booking_completed'
  | 'payment_success'
  | 'payment_failed'
  | 'refund_initiated'
  | 'refund_processed'
  | 'provider_approved'
  | 'provider_rejected'
  | 'settlement_processed'
  | 'review_received'
  | 'promotion';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

// ─── Support Tickets ──────────────────────────────────────────────────────────

export type TicketCategory =
  | 'booking_issue'
  | 'payment_issue'
  | 'refund_request'
  | 'provider_complaint'
  | 'account_issue'
  | 'technical_issue'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

export type SupportTicket = {
  id: string;
  ticketNumber: string; // TKT-YYYYMMDD-XXXX
  userId: string;
  userRole: UserRole;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  bookingId?: string;
  paymentId?: string;
  assignedAdminId?: string;
  messages: TicketMessage[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  authorId: string;
  authorRole: UserRole;
  body: string;
  attachments?: string[];
  createdAt: string;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AdminAnalyticsOverview = {
  period: { from: string; to: string };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
    commission: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
  };
  providers: {
    total: number;
    verified: number;
    pending: number;
    new: number;
  };
  payments: {
    totalProcessed: number;
    totalRefunded: number;
    pendingSettlement: number;
  };
};

export type ProviderAnalytics = {
  providerId: string;
  period: { from: string; to: string };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  revenue: {
    gross: number;
    commission: number;
    net: number;
    settled: number;
    pending: number;
  };
  rating: {
    average: number;
    count: number;
    distribution: Record<string, number>; // "1": count, "2": count, etc.
  };
  topServices: Array<{ serviceId: string; name: string; bookingCount: number; revenue: number }>;
};

// ─── API Response Wrappers ────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PaginatedResponse<T> = ApiSuccess<T[]>;

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditLog = {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};
