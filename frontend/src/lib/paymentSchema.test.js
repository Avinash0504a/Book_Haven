import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePaymentDetails, paymentSchema } from './schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.resolve(__dirname, '../../../backend/src/test/resources/payment-cases.json');

describe('paymentSchema driven by backend payment-cases.json', () => {
  it('loads test cases from shared backend resource and validates paymentSchema', () => {
    expect(fs.existsSync(casesPath)).toBe(true);
    expect(paymentSchema).toBeDefined();
  });

  const testCases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

  testCases.forEach((tc, idx) => {
    it(`Case ${idx + 1}: ${tc.method} (expected valid: ${tc.valid})`, () => {
      const result = validatePaymentDetails(tc.method, tc.details);
      if (tc.valid) {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      } else {
        expect(result.isValid).toBe(false);
        const hasMatchingField = result.errors.some(
          (err) => err.field === tc.field && err.reason === tc.reason
        );
        expect(
          hasMatchingField,
          `Expected error on ${tc.field} with reason ${tc.reason}, got ${JSON.stringify(result.errors)}`
        ).toBe(true);
      }
    });
  });
});
