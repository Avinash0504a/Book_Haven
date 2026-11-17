import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup.js';
import { cartApi } from './cartApi.js';

const backendCart = {
  items: [
    {
      id: 'item-1',
      book: {
        id: 'book-1',
        slug: 'the-guide',
        title: 'The Guide',
        author: { name: 'R. K. Narayan', slug: 'r-k-narayan' },
        format: 'PAPERBACK',
        price: '299.00',
        discountPercent: 10,
        unitPrice: '269.10',
        coverImageUrl: '/covers/the-guide.svg'
      },
      quantity: 2,
      maxQuantity: 10,
      lineTotal: '538.20'
    }
  ],
  subtotal: '538.20'
};

const envelope = (data) => HttpResponse.json({ success: true, data, message: null, code: null });

describe('cartApi', () => {
  it('flattens the contract CartItem (id + nested book) into a cart line', async () => {
    server.use(http.get('/api/cart', () => envelope(backendCart)));

    const cart = await cartApi.getCart();

    expect(cart.items[0]).toMatchObject({
      itemId: 'item-1',
      bookId: 'book-1',
      title: 'The Guide',
      authorName: 'R. K. Narayan',
      quantity: 2,
      lineTotal: '538.20'
    });
  });

  it('updates a quantity with PATCH /cart/items/{itemId}', async () => {
    let seen;
    server.use(
      http.patch('/api/cart/items/:id', async ({ params, request }) => {
        seen = { id: params.id, body: await request.json() };
        return envelope(backendCart);
      })
    );

    await cartApi.updateItem({ itemId: 'item-1', quantity: 3 });

    expect(seen).toEqual({ id: 'item-1', body: { quantity: 3 } });
  });

  it('removes a line with DELETE /cart/items/{itemId} and returns the updated cart', async () => {
    let seenId;
    server.use(
      http.delete('/api/cart/items/:id', ({ params }) => {
        seenId = params.id;
        return envelope({ items: [], subtotal: '0.00' });
      })
    );

    const cart = await cartApi.removeItem('item-1');

    expect(seenId).toBe('item-1');
    expect(cart.items).toEqual([]);
  });
});
