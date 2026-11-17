import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters')
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters')
});

export const addressSchema = z.object({
  label: z.enum(['HOME', 'OFFICE', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a valid address label' })
  }),
  recipientName: z
    .string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name cannot exceed 100 characters'),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(120, 'Address line 1 cannot exceed 120 characters'),
  line2: z
    .string()
    .max(120, 'Address line 2 cannot exceed 120 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(1, 'City is required')
    .max(60, 'City cannot exceed 60 characters'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(60, 'State cannot exceed 60 characters'),
  postalCode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Postal code must be a valid 6-digit Indian PIN code'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false)
});

export const SUPPORTED_BANK_CODES = ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK'];

export const cardPaymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .refine(
      (val) => /^[0-9]{16}$/.test(val.replace(/[\s-]/g, '')),
      'Card number must be exactly 16 digits'
    ),
  cardName: z
    .string()
    .min(1, 'Name on card is required')
    .regex(/^[a-zA-Z\s]{2,50}$/, 'Name on card must be 2 to 50 letters'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^[0-9]{3}$/, 'CVV must be exactly 3 digits'),
  expiry: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/[0-9]{4}$/, 'Expiry must be in MM/YYYY format')
    .refine((val) => {
      const parts = val.split('/');
      if (parts.length !== 2) return false;
      const mm = parseInt(parts[0], 10);
      const yyyy = parseInt(parts[1], 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      return yyyy > currentYear || (yyyy === currentYear && mm >= currentMonth);
    }, 'Card has expired')
});

export const upiPaymentSchema = z.object({
  upiId: z
    .string()
    .min(1, 'UPI ID is required')
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/, 'Invalid UPI ID format (expected name@handle)')
});

export const netBankingPaymentSchema = z.object({
  bankCode: z
    .string()
    .min(1, 'Bank selection is required')
    .refine(
      (val) => SUPPORTED_BANK_CODES.includes(val.trim().toUpperCase()),
      'Selected bank is not supported'
    )
});

export const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('CREDIT_CARD'),
    details: cardPaymentSchema
  }),
  z.object({
    method: z.literal('DEBIT_CARD'),
    details: cardPaymentSchema
  }),
  z.object({
    method: z.literal('UPI'),
    details: upiPaymentSchema
  }),
  z.object({
    method: z.literal('NET_BANKING'),
    details: netBankingPaymentSchema
  }),
  z.object({
    method: z.literal('WALLET'),
    details: z.object({}).optional()
  }),
  z.object({
    method: z.literal('COD'),
    details: z.object({}).optional()
  })
]);

export function validatePaymentDetails(method, details = {}) {
  const errors = [];

  if (method === 'WALLET' || method === 'COD') {
    return { isValid: true, errors: [] };
  }

  if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
    const rawNumber = details?.cardNumber;
    if (!rawNumber || !rawNumber.trim()) {
      errors.push({ field: 'payment.cardNumber', message: 'Card number is required', reason: 'REQUIRED' });
    } else {
      const cleanNumber = rawNumber.replace(/[\s-]/g, '');
      if (!/^[0-9]{16}$/.test(cleanNumber)) {
        errors.push({ field: 'payment.cardNumber', message: 'Card number must be exactly 16 digits', reason: 'FORMAT' });
      }
    }

    const cardName = details?.cardName;
    if (!cardName || !cardName.trim()) {
      errors.push({ field: 'payment.cardName', message: 'Name on card is required', reason: 'REQUIRED' });
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(cardName.trim())) {
      errors.push({ field: 'payment.cardName', message: 'Name on card must be 2 to 50 letters', reason: 'RANGE' });
    }

    const cvv = details?.cvv;
    if (!cvv || !cvv.trim()) {
      errors.push({ field: 'payment.cvv', message: 'CVV is required', reason: 'REQUIRED' });
    } else if (!/^[0-9]{3}$/.test(cvv.trim())) {
      errors.push({ field: 'payment.cvv', message: 'CVV must be exactly 3 digits', reason: 'FORMAT' });
    }

    const expiry = details?.expiry;
    if (!expiry || !expiry.trim()) {
      errors.push({ field: 'payment.expiry', message: 'Expiry date is required', reason: 'REQUIRED' });
    } else if (!/^(0[1-9]|1[0-2])\/[0-9]{4}$/.test(expiry.trim())) {
      errors.push({ field: 'payment.expiry', message: 'Expiry must be in MM/YYYY format', reason: 'FORMAT' });
    } else {
      const [mmStr, yyyyStr] = expiry.trim().split('/');
      const mm = parseInt(mmStr, 10);
      const yyyy = parseInt(yyyyStr, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (yyyy < currentYear || (yyyy === currentYear && mm < currentMonth)) {
        errors.push({ field: 'payment.expiry', message: 'Card has expired', reason: 'EXPIRED' });
      }
    }
  } else if (method === 'UPI') {
    const upiId = details?.upiId;
    if (!upiId || !upiId.trim()) {
      errors.push({ field: 'payment.upiId', message: 'UPI ID is required', reason: 'REQUIRED' });
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(upiId.trim())) {
      errors.push({ field: 'payment.upiId', message: 'Invalid UPI ID format (expected name@handle)', reason: 'FORMAT' });
    }
  } else if (method === 'NET_BANKING') {
    const bankCode = details?.bankCode;
    if (!bankCode || !bankCode.trim()) {
      errors.push({ field: 'payment.bankCode', message: 'Bank code is required', reason: 'REQUIRED' });
    } else if (!SUPPORTED_BANK_CODES.includes(bankCode.trim().toUpperCase())) {
      errors.push({ field: 'payment.bankCode', message: 'Bank code is not supported', reason: 'FORMAT' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export const bankDetailsSchema = z.object({
  accountHolder: z
    .string()
    .min(2, 'Account holder name must be at least 2 characters')
    .max(100, 'Account holder name cannot exceed 100 characters'),
  accountNumber: z
    .string()
    .regex(/^[0-9]{9,18}$/, 'Account number must be 9 to 18 digits'),
  ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC code must be in standard Indian format (e.g. HDFC0001234)')
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'Cancellation reason is required')
    .max(120, 'Reason cannot exceed 120 characters'),
  refundMethod: z.enum(['WALLET', 'BANK']),
  bank: bankDetailsSchema.optional()
});

export const topUpSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(1, 'Amount must be between 1 and 100,000 rupees')
    .max(100000, 'Amount must be between 1 and 100,000 rupees')
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
});

export const reviewSchema = z.object({
  rating: z
    .coerce
    .number({ invalid_type_error: 'Rating is required' })
    .min(1, 'Rating is required')
    .max(5, 'Rating must be between 1 and 5'),
  body: z
    .string()
    .min(1, 'Review body is required')
    .max(100, 'Review cannot exceed 100 characters')
});
