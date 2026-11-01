import { describe, it, expect } from 'vitest';

export function isValidIsoMicrochip(microchipNumber: string): boolean {
  // ISO 11784/11785 microchips are exactly 15 digits
  return /^\d{15}$/.test(microchipNumber);
}

export interface MedicalConsentRecord {
  id: string;
  petId: string;
  customerId: string;
  providerId: string;
  scope: 'full' | 'vaccinations_only' | 'emergency';
  expiresAt: string; // ISO 8601 string
  isRevoked: boolean;
}

export function evaluateConsentAccess(
  consent: MedicalConsentRecord | null | undefined,
  requestingProviderId: string,
  requiredScope: 'medical_history' | 'vaccinations'
): { allowed: boolean; reason?: string } {
  if (!consent) {
    return { allowed: false, reason: 'No consent record exists under DPDPA 2023' };
  }

  if (consent.providerId !== requestingProviderId) {
    return { allowed: false, reason: 'Consent was not granted to this provider' };
  }

  if (consent.isRevoked) {
    return { allowed: false, reason: 'Consent was revoked by pet parent' };
  }

  const now = new Date();
  const expiry = new Date(consent.expiresAt);
  if (now > expiry) {
    return { allowed: false, reason: 'Consent period has expired' };
  }

  if (requiredScope === 'medical_history' && consent.scope === 'vaccinations_only') {
    return { allowed: false, reason: 'Scope limited to vaccinations only' };
  }

  return { allowed: true };
}

describe('Digital Pet Health Passport & DPDPA Consent Engine', () => {
  describe('ISO 11784/11785 Microchip Verification', () => {
    it('validates genuine 15-digit ISO microchip numbers', () => {
      expect(isValidIsoMicrochip('900215000492817')).toBe(true);
      expect(isValidIsoMicrochip('956000001234567')).toBe(true);
    });

    it('rejects malformed, short, or alphanumeric microchip strings', () => {
      expect(isValidIsoMicrochip('12345')).toBe(false); // too short
      expect(isValidIsoMicrochip('90021500049281700')).toBe(false); // too long (17 digits)
      expect(isValidIsoMicrochip('90021500049ABCD')).toBe(false); // contains characters
      expect(isValidIsoMicrochip('')).toBe(false);
    });
  });

  describe('DPDPA 2023 Consent Lifecycle', () => {
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days from now
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    const validConsent: MedicalConsentRecord = {
      id: 'cst_123',
      petId: 'pet_rocky',
      customerId: 'usr_owner',
      providerId: 'prv_banjara_clinic',
      scope: 'full',
      expiresAt: futureDate,
      isRevoked: false,
    };

    it('allows access when valid non-expired consent is presented', () => {
      const res = evaluateConsentAccess(validConsent, 'prv_banjara_clinic', 'medical_history');
      expect(res.allowed).toBe(true);
    });

    it('denies access if consent is revoked by owner', () => {
      const revoked = { ...validConsent, isRevoked: true };
      const res = evaluateConsentAccess(revoked, 'prv_banjara_clinic', 'medical_history');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('revoked');
    });

    it('denies access if consent has passed its expiration timestamp', () => {
      const expired = { ...validConsent, expiresAt: pastDate };
      const res = evaluateConsentAccess(expired, 'prv_banjara_clinic', 'medical_history');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('expired');
    });

    it('denies full medical history when consent scope is restricted to vaccinations only', () => {
      const limited = { ...validConsent, scope: 'vaccinations_only' as const };
      const medicalRes = evaluateConsentAccess(limited, 'prv_banjara_clinic', 'medical_history');
      expect(medicalRes.allowed).toBe(false);
      expect(medicalRes.reason).toContain('Scope limited');

      // Vaccination check itself is allowed
      const vaccRes = evaluateConsentAccess(limited, 'prv_banjara_clinic', 'vaccinations');
      expect(vaccRes.allowed).toBe(true);
    });

    it('denies access to unauthorized third-party clinics', () => {
      const res = evaluateConsentAccess(validConsent, 'prv_unauthorized_clinic', 'medical_history');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('not granted to this provider');
    });
  });
});
