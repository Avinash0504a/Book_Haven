/**
 * Page registry mapping routes to page descriptions and main endpoints
 */
export const pages = {
  home: { path: '/', name: 'Home', endpoint: '/api/products' },
  login: { path: '/login', name: 'Login', endpoint: '/api/auth/login' },
  register: { path: '/register', name: 'Register', endpoint: '/api/auth/register' },
  cart: { path: '/cart', name: 'Cart', endpoint: '/api/cart' },
  checkout: { path: '/checkout', name: 'Checkout', endpoint: '/api/checkout/validate' },
  orders: { path: '/orders', name: 'Orders', endpoint: '/api/orders' },
  orderDetail: { path: '/orders/:id', name: 'Order Details', endpoint: '/api/orders/:id' },
  wishlist: { path: '/wishlist', name: 'Wishlist', endpoint: '/api/wishlist' },
  wallet: { path: '/wallet', name: 'Wallet', endpoint: '/api/wallet' },
  giftPoints: { path: '/gift-points', name: 'Gift Points', endpoint: '/api/auth/points-history' },
  profile: { path: '/profile', name: 'Profile', endpoint: '/api/auth/me' },
  help: { path: '/help', name: 'Help', endpoint: null },
  library: { path: '/library', name: 'Library', endpoint: '/api/library' },
  reader: { path: '/library/:bookId/read', name: 'Reader', endpoint: '/api/library/:bookId/content' },
  writers: { path: '/writers', name: 'Writers', endpoint: '/api/authors' },
  author: { path: '/writers/:slug', name: 'Author', endpoint: '/api/authors/:slug' }
};
