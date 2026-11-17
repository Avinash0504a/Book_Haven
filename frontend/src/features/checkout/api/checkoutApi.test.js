import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { checkoutApi } from './checkoutApi.js';

const envelope = (data) => HttpResponse.json({ success: true, data, message: null, code: null });

describe('checkoutApi request shapes (contracts/openapi.yaml)', () => {
  it('createOrder sends addressId, paymentMethod and giftPointsToUse with the Idempotency-Key', async () => {
    let seen;
    server.use(
      http.post('/api/checkout/order', async ({ request }) => {
        seen = { key: request.headers.get('Idempotency-Key'), body: await request.json() };
        return envelope({ id: 'o1', status: 'PENDING', totalAmount: 236.55, items: [] });
      })
    );

    const order = await checkoutApi.createOrder(
      { addressId: 'a1', paymentMethod: 'CREDIT_CARD', giftPointsToUse: 50 },
      'key-12345678'
    );

    expect(seen).toEqual({
      key: 'key-12345678',
      body: { addressId: 'a1', paymentMethod: 'CREDIT_CARD', giftPointsToUse: 50 }
    });
    expect(order.grandTotal).toBe('236.55');
  });

  it('confirmPayment sends { orderId, payment } and applyPoints sends { points }', async () => {
    const seen = {};
    server.use(
      http.post('/api/checkout/confirm-payment', async ({ request }) => {
        seen.confirm = await request.json();
        return envelope({ id: 'o1', status: 'CONFIRMED', items: [] });
      }),
      http.post('/api/checkout/apply-points', async ({ request }) => {
        seen.points = await request.json();
        return envelope({ pointsApplied: 100, discountAmount: 10, payableAmount: 226.55, pointsToEarn: 22 });
      })
    );

    await checkoutApi.confirmPayment({ orderId: 'o1', payment: { upiId: 'a@upi' } });
    const result = await checkoutApi.applyPoints({ points: 100 });

    expect(seen.confirm).toEqual({ orderId: 'o1', payment: { upiId: 'a@upi' } });
    expect(seen.points).toEqual({ points: 100 });
    expect(result).toMatchObject({ pointsApplied: 100, discountAmount: '10.00' });
  });
});
