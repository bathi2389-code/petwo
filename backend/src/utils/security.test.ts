import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { maskSensitive } from './helpers';

export function verifyRazorpayWebhookSignature(
  webhookBody: string,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookBody)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

describe('Security & Cryptography Utilities', () => {
  describe('Razorpay HMAC-SHA256 Signature Verification', () => {
    const secret = 'test_webhook_secret_key_8891';
    const samplePayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_HyD99812A',
            amount: 150000,
            status: 'captured',
          },
        },
      },
    });

    it('verifies legitimate webhook payload matching signature', () => {
      const validSig = crypto
        .createHmac('sha256', secret)
        .update(samplePayload)
        .digest('hex');

      const isValid = verifyRazorpayWebhookSignature(samplePayload, validSig, secret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered or forged payload', () => {
      const validSig = crypto
        .createHmac('sha256', secret)
        .update(samplePayload)
        .digest('hex');

      const tamperedPayload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_MALICIOUS' } } },
      });

      const isValid = verifyRazorpayWebhookSignature(tamperedPayload, validSig, secret);
      expect(isValid).toBe(false);
    });

    it('rejects signature generated with wrong secret', () => {
      const invalidSig = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(samplePayload)
        .digest('hex');

      const isValid = verifyRazorpayWebhookSignature(samplePayload, invalidSig, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('PII & Sensitive Data Masking', () => {
    it('masks phone numbers leaving last 4 characters visible', () => {
      const masked = maskSensitive('+919876543210', 4);
      expect(masked).toBe('****3210');
    });

    it('masks bank account numbers and PAN numbers appropriately', () => {
      const maskedPan = maskSensitive('ABCDE1234F', 4);
      expect(maskedPan).toBe('****234F');
      expect(maskedPan).toContain('****');
    });
  });

});
