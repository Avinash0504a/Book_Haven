import { describe, it, expect } from 'vitest';
import { topUpSchema } from './schemas';

describe('topUpSchema', () => {
  it('accepts valid amounts between 1 and 100,000', () => {
    expect(topUpSchema.safeParse({ amount: 1 }).success).toBe(true);
    expect(topUpSchema.safeParse({ amount: '1' }).success).toBe(true);
    expect(topUpSchema.safeParse({ amount: 500 }).success).toBe(true);
    expect(topUpSchema.safeParse({ amount: 100000 }).success).toBe(true);
    expect(topUpSchema.safeParse({ amount: '100000' }).success).toBe(true);
  });

  it('rejects invalid amounts outside range or non-numeric', () => {
    expect(topUpSchema.safeParse({ amount: 0 }).success).toBe(false);
    expect(topUpSchema.safeParse({ amount: -10 }).success).toBe(false);
    expect(topUpSchema.safeParse({ amount: 100001 }).success).toBe(false);
    expect(topUpSchema.safeParse({ amount: 'abc' }).success).toBe(false);
    expect(topUpSchema.safeParse({ amount: '' }).success).toBe(false);
  });
});
