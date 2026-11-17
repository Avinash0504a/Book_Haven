import { describe, it, expect } from 'vitest';
import { money, toOrderView } from './contractMappers.js';

describe('contractMappers', () => {
  it('money turns JSON numbers into two-decimal strings and leaves empties alone', () => {
    expect(money(0)).toBe('0.00');
    expect(money(236.5)).toBe('236.50');
    expect(money('49')).toBe('49.00');
    expect(money(null)).toBeNull();
    expect(money(undefined)).toBeUndefined();
  });

  it('toOrderView maps the contract Order onto the fields the screens read', () => {
    const view = toOrderView({
      id: 'o1',
      status: 'CONFIRMED',
      subtotal: 424.15,
      shippingAmount: 0,
      giftPointsUsed: 100,
      discountAmount: 10,
      totalAmount: 414.15,
      deliveryDate: '2026-11-19',
      address: { recipientName: 'Buy Tester', postalCode: '560001' },
      payment: { method: 'CREDIT_CARD', status: 'SUCCESS', reference: 'R1' },
      items: [{ id: 'i1', bookId: 'b1', title: 'Beneath the Stars', author: 'Jessica Martin', unitPrice: 424.15, lineTotal: 424.15, quantity: 1 }]
    });

    expect(view.grandTotal).toBe('414.15');
    expect(view.shippingAmount).toBe('0.00');
    expect(view.pointsDiscountAmount).toBe('10.00');
    expect(view.pointsRedeemed).toBe(100);
    expect(view.shippingAddress.recipientName).toBe('Buy Tester');
    expect(view.paymentMethod).toBe('CREDIT_CARD');
    expect(view.estimatedDeliveryDate).toMatch(/19 Nov 2026/);
    expect(view.items[0]).toMatchObject({ authorName: 'Jessica Martin', unitPrice: '424.15', lineTotal: '424.15' });
  });
});
