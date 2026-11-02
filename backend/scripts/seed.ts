import 'dotenv/config';
import { initializeFirebase, getDb, COLLECTIONS } from '../src/config/firebase';
import { SERVICE_CATEGORIES, SUBSCRIPTION_PRICES, PROVIDER_SUBSCRIPTION_LIMITS } from '../../shared/constants/index';
import type { ServiceCategory, SubscriptionPlan, Provider, ProviderLocation, Service } from '@petwo/shared';

async function seed() {
  console.log('🌱 Starting PETWO database seeding...');
  initializeFirebase();
  const db = getDb();
  const now = new Date().toISOString();

  // 1. Seed Service Categories
  console.log('📦 Seeding service categories...');
  const categoryDefs = [
    {
      id: 'cat-veterinary',
      name: 'Veterinary Care',
      slug: 'veterinary',
      description: 'Expert general consultations, vaccinations, surgery & emergency care for your pets.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/3047/3047879.png',
      allowedProviderTypes: ['individual_vet', 'veterinary_clinic', 'veterinary_hospital'] as const,
      defaultDuration: 30,
      commissionRate: 15,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'cat-grooming',
      name: 'Pet Grooming & Spa',
      slug: 'grooming',
      description: 'Bathing, breed haircuts, tick bath, ear cleaning, and luxurious spa treatments.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/2809/2809832.png',
      allowedProviderTypes: ['grooming_salon', 'veterinary_clinic'] as const,
      defaultDuration: 60,
      commissionRate: 18,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'cat-boarding',
      name: 'Boarding & Daycare',
      slug: 'boarding',
      description: 'Safe cage-free pet resorts, overnight boarding, and playful daycare.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
      allowedProviderTypes: ['boarding_facility', 'daycare_facility'] as const,
      defaultDuration: 1440, // 1 day
      commissionRate: 12,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'cat-training',
      name: 'Pet Training',
      slug: 'training',
      description: 'Basic obedience, puppy kindergarten, behavior correction, and agility coaching.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/2809/2809884.png',
      allowedProviderTypes: ['pet_trainer'] as const,
      defaultDuration: 45,
      commissionRate: 15,
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'cat-diagnostics',
      name: 'Diagnostics & Pathology',
      slug: 'diagnostics',
      description: 'Complete blood count, digital X-rays, ultrasound, biochemistry & microscopy.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
      allowedProviderTypes: ['diagnostic_centre', 'veterinary_hospital'] as const,
      defaultDuration: 30,
      commissionRate: 15,
      isActive: true,
      sortOrder: 5,
    },
    {
      id: 'cat-home-services',
      name: 'Doorstep Vet & Grooming',
      slug: 'home-services',
      description: 'Certified veterinarians and professional groomers visiting your home in Hyderabad.',
      iconURL: 'https://cdn-icons-png.flaticon.com/512/616/616554.png',
      allowedProviderTypes: ['individual_vet', 'grooming_salon', 'pet_sitter', 'pet_walker'] as const,
      defaultDuration: 60,
      commissionRate: 20,
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const cat of categoryDefs) {
    await db.collection(COLLECTIONS.SERVICE_CATEGORIES).doc(cat.id).set(cat);
  }

  // 2. Seed Subscription Plans
  console.log('💳 Seeding subscription plans...');
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'plan-starter',
      tier: 'starter',
      name: 'Starter Plan',
      description: 'Ideal for independent solo veterinarians and private groomers getting started.',
      priceMonthly: SUBSCRIPTION_PRICES.starter.monthly,
      priceYearly: SUBSCRIPTION_PRICES.starter.yearly,
      features: [
        '1 Business Location',
        'Up to 2 staff members',
        'Up to 10 services in catalogue',
        'Standard booking management',
        'Direct UPI & Card settlements',
      ],
      maxLocations: PROVIDER_SUBSCRIPTION_LIMITS.starter.maxLocations,
      maxStaff: PROVIDER_SUBSCRIPTION_LIMITS.starter.maxStaff,
      maxServices: PROVIDER_SUBSCRIPTION_LIMITS.starter.maxServices,
      hasAnalytics: false,
      hasFeaturedListing: false,
      commissionDiscount: 0,
      isActive: true,
    },
    {
      id: 'plan-growth',
      tier: 'growth',
      name: 'Growth Plan',
      description: 'For busy clinics and popular salons scaling their appointments and staff.',
      priceMonthly: SUBSCRIPTION_PRICES.growth.monthly,
      priceYearly: SUBSCRIPTION_PRICES.growth.yearly,
      features: [
        'Up to 3 Locations',
        'Up to 10 staff members with schedule sync',
        'Up to 50 active services',
        'Advanced revenue & retention analytics',
        'Priority support & verified badge',
        '2% commission reduction',
      ],
      maxLocations: PROVIDER_SUBSCRIPTION_LIMITS.growth.maxLocations,
      maxStaff: PROVIDER_SUBSCRIPTION_LIMITS.growth.maxStaff,
      maxServices: PROVIDER_SUBSCRIPTION_LIMITS.growth.maxServices,
      hasAnalytics: true,
      hasFeaturedListing: false,
      commissionDiscount: 2,
      isActive: true,
    },
    {
      id: 'plan-pro',
      tier: 'pro',
      name: 'Pro Multi-Facility',
      description: 'For veterinary hospitals, multi-branch chains, and premium boarding resorts.',
      priceMonthly: SUBSCRIPTION_PRICES.pro.monthly,
      priceYearly: SUBSCRIPTION_PRICES.pro.yearly,
      features: [
        'Up to 10 Locations',
        'Up to 50 staff members',
        'Up to 200 services',
        'Featured placement on Hyderabad discovery feed',
        'Dedicated account manager',
        '5% commission reduction',
      ],
      maxLocations: PROVIDER_SUBSCRIPTION_LIMITS.pro.maxLocations,
      maxStaff: PROVIDER_SUBSCRIPTION_LIMITS.pro.maxStaff,
      maxServices: PROVIDER_SUBSCRIPTION_LIMITS.pro.maxServices,
      hasAnalytics: true,
      hasFeaturedListing: true,
      commissionDiscount: 5,
      isActive: true,
    },
  ];

  for (const plan of subscriptionPlans) {
    await db.collection(COLLECTIONS.SUBSCRIPTION_PLANS).doc(plan.id).set(plan);
  }

  // 3. Seed Launch Coupons
  console.log('🎟️ Seeding promotional launch coupons...');
  await db.collection(COLLECTIONS.COUPONS).doc('coupon-pawfirst').set({
    id: 'coupon-pawfirst',
    code: 'PAWFIRST',
    description: 'Get 20% off your first pet care booking on PETWO in Hyderabad!',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 30000, // ₹300 max
    minOrderAmount: 50000, // ₹500 min order
    validFrom: now,
    validTo: '2027-12-31T23:59:59.000Z',
    fundedBy: 'platform',
    usageLimit: 10000,
    usedCount: 0,
    userUsageLimit: 1,
    isActive: true,
    createdAt: now,
  });

  // 4. Seed Sample Verified Hyderabad Provider
  console.log('🏥 Seeding sample verified Hyderabad provider...');
  const sampleProviderId = 'provider-hyd-vetcare-01';
  const sampleLocationId = 'loc-banjara-hills-01';

  const sampleProvider: Provider = {
    id: sampleProviderId,
    userId: sampleProviderId,
    businessName: 'TailBlazers Specialty Pet Hospital',
    businessType: 'veterinary_hospital',
    description: 'Premier 24/7 multi-specialty pet hospital in Banjara Hills, Hyderabad with advanced ICU, digital radiography and compassionate surgeons.',
    tagline: 'World-Class Care For Your Furry Family',
    contact: {
      phone: '+919876543210',
      email: 'care@tailblazershyd.com',
      whatsapp: '+919876543210',
    },
    verificationStatus: 'approved',
    verifiedAt: now,
    documents: [],
    registrationNo: 'TG-VET-2023-8821',
    panNumber: 'ABCDE1234F',
    gstNumber: '36ABCDE1234F1Z5',
    subscription: {
      tier: 'pro',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: '2027-11-01T00:00:00.000Z',
    },
    rating: 4.9,
    reviewCount: 142,
    totalBookings: 890,
    isFeatured: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTIONS.PROVIDERS).doc(sampleProviderId).set(sampleProvider);

  const sampleLocation: ProviderLocation = {
    id: sampleLocationId,
    providerId: sampleProviderId,
    name: 'Banjara Hills Flagship Center',
    address: {
      line1: 'Road No. 12, Banjara Hills',
      line2: 'Opposite MLA Colony Park',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      country: 'IN',
      coordinates: { lat: 17.4123, lng: 78.4356 },
    },
    contact: {
      phone: '+919876543210',
      email: 'banjara@tailblazershyd.com',
    },
    operatingHours: [
      { day: 'monday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'tuesday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'wednesday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'thursday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'friday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'saturday', isOpen: true, slots: [{ start: '09:00', end: '20:00' }] },
      { day: 'sunday', isOpen: true, slots: [{ start: '10:00', end: '18:00' }] },
    ],
    amenities: ['Emergency ICU', 'Pet Parking', 'Air Conditioned Waiting Area', 'In-House Pharmacy'],
    isPrimary: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTIONS.PROVIDER_LOCATIONS).doc(sampleLocationId).set(sampleLocation);

  const sampleServices: Service[] = [
    {
      id: 'srv-gen-consult',
      providerId: sampleProviderId,
      locationId: sampleLocationId,
      categoryId: 'cat-veterinary',
      name: 'Comprehensive Veterinary Consultation & Health Check',
      description: 'Full vitals check, dental inspection, eye & ear examination, nutritional assessment and prescription.',
      price: { amount: 65000, currency: 'INR', priceType: 'fixed' }, // ₹650
      duration: 30,
      allowedPetSpecies: ['dog', 'cat', 'rabbit'],
      isFeatured: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'srv-full-groom',
      providerId: sampleProviderId,
      locationId: sampleLocationId,
      categoryId: 'cat-grooming',
      name: 'Royal Bath, Haircut & Aromatherapy Spa',
      description: 'Hypoallergenic organic shampoo bath, warm blow dry, styled breed haircut, sanitary trim, nail clipping, and ear cleaning.',
      price: { amount: 180000, currency: 'INR', priceType: 'starting_from' }, // ₹1,800
      duration: 75,
      allowedPetSpecies: ['dog', 'cat'],
      isFeatured: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const srv of sampleServices) {
    await db.collection(COLLECTIONS.SERVICES).doc(srv.id).set(srv);
  }

  console.log('✅ PETWO database seeding completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
