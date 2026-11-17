import { describe, it, expect, beforeEach } from 'vitest';
import { setAuthToken, getAuthToken, clearAuthToken } from './axiosClient.js';
import { formatRupees, formatDate, formatPoints } from './format.js';
import { getErrorMessage, getFieldErrors } from './errors.js';

describe('axiosClient and lib utilities', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  it('manages token in memory only', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it('formats rupees, dates, and points accurately', () => {
    expect(formatRupees(499)).toMatch(/499/);
    expect(formatRupees(0)).toMatch(/0/);
    expect(formatPoints(150)).toBe('150 pts');
    expect(formatDate('2026-11-14T10:00:00Z')).toContain('2026');
  });

  it('maps error codes and extracts field errors', () => {
    const errorWithCode = { code: 'INVALID_CREDENTIALS' };
    expect(getErrorMessage(errorWithCode)).toBe('The email address or password you entered is incorrect.');

    const errorWithFieldErrors = {
      fieldErrors: [{ field: 'email', message: 'Email is required' }]
    };
    expect(getFieldErrors(errorWithFieldErrors)).toEqual({ email: 'Email is required' });
  });
});
