import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './schemas.js';

describe('Auth Validation Schemas', () => {
  it('validates login input', () => {
    const valid = loginSchema.safeParse({ email: 'reader@example.com', password: 'secretpassword' });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({ email: 'notanemail', password: 'secretpassword' });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = loginSchema.safeParse({ email: 'reader@example.com', password: '123' });
    expect(shortPassword.success).toBe(false);
  });

  it('validates register input', () => {
    const valid = registerSchema.safeParse({
      fullName: 'Alice Walker',
      email: 'alice@example.com',
      password: 'password123'
    });
    expect(valid.success).toBe(true);

    const shortName = registerSchema.safeParse({
      fullName: 'A',
      email: 'alice@example.com',
      password: 'password123'
    });
    expect(shortName.success).toBe(false);
  });
});
