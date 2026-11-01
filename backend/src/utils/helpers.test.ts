import { describe, it, expect } from 'vitest';
import {
  generateBookingNumber,
  generateTicketNumber,
  rupeesToPaisa,
  paisaToRupees,
  formatCurrency,
  computeCommission,
  computeGst,
  normalizePhoneNumber,
  isValidIndianPhone,
  isValidPincode,
  isValidGstin,
  paginate,
  maskSensitive,
} from './helpers';

describe('Helper Utilities', () => {
  describe('Identifiers', () => {
    it('generates properly formatted booking numbers', () => {
      const bnum = generateBookingNumber();
      expect(bnum).toMatch(/^PTC-\d{8}-[A-Z0-9]{4}$/);
    });

    it('generates properly formatted support ticket numbers', () => {
      const tnum = generateTicketNumber();
      expect(tnum).toMatch(/^TKT-\d{8}-[A-Z0-9]{4}$/);
    });
  });

  describe('Currency & Financial Conversions', () => {
    it('accurately converts rupees to paisa avoiding precision loss', () => {
      expect(rupeesToPaisa(1499.50)).toBe(149950);
      expect(rupeesToPaisa(500)).toBe(50000);
      expect(rupeesToPaisa(0)).toBe(0);
    });

    it('accurately converts paisa to rupees', () => {
      expect(paisaToRupees(149950)).toBe(1499.50);
      expect(paisaToRupees(50000)).toBe(500);
    });

    it('computes 18% GST correctly', () => {
      expect(computeGst(10000)).toBe(1800); // 18% of ₹100 is ₹18
    });

    it('computes commission breakdown correctly', () => {
      const totalAmount = 100000; // ₹1,000 (100,000 paisa)
      const commissionRate = 15; // 15%
      const result = computeCommission(totalAmount, commissionRate);

      expect(result.commissionAmount).toBe(15000); // ₹150 commission
      expect(result.taxOnCommission).toBe(2700); // 18% GST on ₹150 = ₹27
      expect(result.netProviderAmount).toBe(82300); // ₹1,000 - ₹150 - ₹27 = ₹823
    });
  });

  describe('Phone Number & Indian Localizations', () => {
    it('normalizes various Indian phone formats to E.164 (+91)', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    });

    it('validates 10-digit Indian phone numbers starting with 6-9', () => {
      expect(isValidIndianPhone('9876543210')).toBe(true);
      expect(isValidIndianPhone('8123456789')).toBe(true);
      expect(isValidIndianPhone('7000000001')).toBe(true);
      expect(isValidIndianPhone('6123456789')).toBe(true);

      expect(isValidIndianPhone('1234567890')).toBe(false);
      expect(isValidIndianPhone('98765')).toBe(false);
      expect(isValidIndianPhone('987654321099')).toBe(false);
    });

    it('validates 6-digit Indian PIN codes', () => {
      expect(isValidPincode('500034')).toBe(true); // Banjara Hills, Hyderabad
      expect(isValidPincode('500081')).toBe(true); // Madhapur, Hyderabad
      expect(isValidPincode('000123')).toBe(false); // cannot start with 0
      expect(isValidPincode('50003')).toBe(false);
    });

    it('validates GSTIN structure', () => {
      expect(isValidGstin('36ABCDE1234F1Z5')).toBe(true); // Telangana prefix 36
      expect(isValidGstin('INVALID')).toBe(false);
    });
  });

  describe('Data Helpers', () => {
    it('correctly paginates arrays', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const page1 = paginate(items, 1, 3);
      expect(page1.data).toEqual([1, 2, 3]);
      expect(page1.hasMore).toBe(true);
      expect(page1.total).toBe(10);

      const page4 = paginate(items, 4, 3);
      expect(page4.data).toEqual([10]);
      expect(page4.hasMore).toBe(false);
    });

    it('masks sensitive account data', () => {
      expect(maskSensitive('987654321012')).toBe('****1012');
      expect(maskSensitive('123')).toBe('****');
    });
  });
});
