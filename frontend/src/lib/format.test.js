import { describe, it, expect } from 'vitest';
import { formatDeliveryDate } from './format.js';

describe('formatDeliveryDate', () => {
  it('formats as weekday, day and short month', () => {
    expect(formatDeliveryDate('2026-07-21')).toBe('Tue, 21 Jul');
    expect(formatDeliveryDate('2026-11-19')).toBe('Thu, 19 Nov');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDeliveryDate(null)).toBe('');
    expect(formatDeliveryDate('not-a-date')).toBe('');
  });
});
