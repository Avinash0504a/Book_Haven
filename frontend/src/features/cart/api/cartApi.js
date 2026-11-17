import { axiosClient } from '../../../lib/axiosClient.js';
import { money } from '../../../lib/contractMappers.js';

// The backend returns each line as { id, book: BookSummary, quantity, maxQuantity, lineTotal }
// (contracts/openapi.yaml, CartItem). The cart screens work with one flat line, so map it once here.
function toLine(item) {
  const book = item.book || {};
  return {
    itemId: item.id,
    bookId: book.id,
    slug: book.slug,
    title: book.title,
    authorName: book.author?.name,
    format: book.format,
    price: money(book.price),
    discountPercent: book.discountPercent,
    unitPrice: money(book.unitPrice),
    coverImageUrl: book.coverImageUrl,
    quantity: item.quantity,
    maxQuantity: item.maxQuantity,
    lineTotal: money(item.lineTotal)
  };
}

function toCart(cart) {
  return {
    ...cart,
    subtotal: money(cart?.subtotal),
    shippingAmount: money(cart?.shippingAmount),
    freeShippingRemaining: money(cart?.freeShippingRemaining),
    total: money(cart?.total),
    items: (cart?.items || []).map(toLine)
  };
}

export const cartApi = {
  getCart: async () => {
    return toCart(await axiosClient.get('/cart'));
  },

  addItem: async ({ bookId, quantity = 1 }) => {
    return toCart(await axiosClient.post('/cart/items', { bookId, quantity }));
  },

  updateItem: async ({ itemId, quantity }) => {
    return toCart(await axiosClient.patch(`/cart/items/${itemId}`, { quantity }));
  },

  removeItem: async (itemId) => {
    return toCart(await axiosClient.delete(`/cart/items/${itemId}`));
  },

  clearCart: async () => {
    return await axiosClient.delete('/cart');
  }
};
