import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { BOOKING, TICKET_NUMBER_PREFIX, CURRENCY } from '@petwo/shared';

/**
 * Generate a human-readable booking number: PTC-20241102-A3K9
 */
export function generateBookingNumber(): string {
  const date = dayjs().format('YYYYMMDD');
  const suffix = nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, 'A');
  return `${BOOKING.NUMBER_PREFIX}-${date}-${suffix}`;
}

/**
 * Generate a human-readable ticket number: TKT-20241102-X7YZ
 */
export function generateTicketNumber(): string {
  const date = dayjs().format('YYYYMMDD');
  const suffix = nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, 'B');
  return `${TICKET_NUMBER_PREFIX}-${date}-${suffix}`;
}

/**
 * Convert rupees to paisa (avoid floating point issues)
 */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * CURRENCY.MULTIPLIER);
}

/**
 * Convert paisa to rupees for display
 */
export function paisaToRupees(paisa: number): number {
  return paisa / CURRENCY.MULTIPLIER;
}

/**
 * Format paisa amount to INR string: ₹1,499.00
 */
export function formatCurrency(paisa: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paisaToRupees(paisa));
}

/**
 * Compute GST on an amount in paisa (18%)
 */
export function computeGst(amountPaisa: number, ratePercent = 18): number {
  return Math.round((amountPaisa * ratePercent) / 100);
}

/**
 * Compute platform commission on a booking amount
 */
export function computeCommission(
  amountPaisa: number,
  ratePercent: number,
): { commissionAmount: number; taxOnCommission: number; netProviderAmount: number } {
  const commissionAmount = Math.round((amountPaisa * ratePercent) / 100);
  const taxOnCommission = computeGst(commissionAmount);
  const netProviderAmount = amountPaisa - commissionAmount - taxOnCommission;
  return { commissionAmount, taxOnCommission, netProviderAmount };
}

/**
 * Mask sensitive string (e.g. account number): show last 4 chars
 */
export function maskSensitive(str: string, visibleChars = 4): string {
  if (str.length <= visibleChars) return '****';
  return '****' + str.slice(-visibleChars);
}

/**
 * Normalize Indian phone number to E.164 format
 * "9876543210" → "+919876543210"
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits.slice(1)}`;
  return phone; // Return as-is if can't normalize
}

/**
 * Validate Indian phone number (10 digits, starts with 6-9)
 */
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  const cleaned = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate Indian PIN code
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

/**
 * Validate GSTIN format
 */
export function isValidGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

/**
 * Paginate a query result
 */
export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): { data: T[]; total: number; page: number; limit: number; hasMore: boolean } {
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    total: items.length,
    page,
    limit,
    hasMore: start + limit < items.length,
  };
}

/**
 * Sleep utility for retry logic
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }
  throw new Error('Max retry attempts reached');
}
