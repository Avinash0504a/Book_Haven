import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        fullName: 'Demo Reader',
        email: 'reader@bookhaven.local',
        giftPoints: 120,
        walletBalance: '250.00'
      },
      message: null,
      code: null
    });
  }),

  http.patch('/api/auth/me', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        fullName: body.fullName,
        email: 'reader@bookhaven.local',
        giftPoints: 120,
        walletBalance: '250.00'
      },
      message: null,
      code: null
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.password === 'wrong') {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          message: 'The email address or password you entered is incorrect.',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        member: {
          id: '00000000-0000-0000-0000-000000000001',
          fullName: 'Demo Reader',
          email: body.email || 'reader@bookhaven.local',
          giftPoints: 120,
          walletBalance: '250.00'
        }
      },
      message: null,
      code: null
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'duplicate@example.com') {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          message: 'An account with this email address already exists.',
          code: 'DUPLICATE_EMAIL'
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        member: {
          id: '00000000-0000-0000-0000-000000000002',
          fullName: body.fullName,
          email: body.email,
          giftPoints: 0,
          walletBalance: '0.00'
        }
      },
      message: null,
      code: null
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Logged out successfully',
      code: null
    });
  }),

  // Cart
  http.get('/api/cart', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [],
        subtotal: '0.00',
        shippingAmount: '0.00',
        freeShippingRemaining: '500.00',
        total: '0.00',
        pointsToEarn: 0,
        hasPhysical: false,
        hasDigital: false,
        itemCount: 0
      },
      message: null,
      code: null
    });
  }),

  // Addresses
  http.get('/api/addresses', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'addr-1',
          label: 'HOME',
          recipientName: 'Demo Reader',
          phone: '9876543210',
          line1: '123 Baker Street',
          line2: 'Apartment 4B',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
          isDefault: true
        }
      ],
      message: null,
      code: null
    });
  }),

  http.post('/api/addresses', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'addr-new',
        ...body,
        country: body.country || 'India',
        isDefault: body.isDefault || false
      },
      message: null,
      code: null
    });
  }),

  http.patch('/api/addresses/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        ...body
      },
      message: null,
      code: null
    });
  }),

  http.delete('/api/addresses/:id', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Address deleted',
      code: null
    });
  }),

  // Delivery estimation
  http.get('/api/delivery/estimate', ({ request }) => {
    const url = new URL(request.url);
    const pincode = url.searchParams.get('pincode');
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid postal code format',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        pincode,
        estimatedDate: '2026-11-17T15:00:00Z',
        isMetro: true
      },
      message: null,
      code: null
    });
  }),

  // Categories
  http.get('/api/categories', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'cat-1', name: 'Fiction', slug: 'fiction' },
        { id: 'cat-2', name: 'Non-Fiction', slug: 'non-fiction' },
        { id: 'cat-3', name: 'Science & Technology', slug: 'science-tech' }
      ],
      message: null,
      code: null
    });
  }),

  // Products
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const categoryId = url.searchParams.get('categoryId');

    let books = [
      {
        id: 'book-1',
        title: 'The Guide',
        slug: 'the-guide',
        authorName: 'R. K. Narayan',
        authorId: 'auth-1',
        format: 'PAPERBACK',
        language: 'English',
        price: '299.00',
        discountPercent: 10,
        unitPrice: '269.10',
        inStock: true,
        stockQuantity: 15,
        deliveryDate: '2026-11-17T15:00:00Z',
        coverImageUrl: '/covers/the-guide.svg',
        soldCount: 42
      },
      {
        id: 'book-2',
        title: 'Godan',
        slug: 'godan',
        authorName: 'Munshi Premchand',
        authorId: 'auth-2',
        format: 'EBOOK',
        language: 'Hindi',
        price: '149.00',
        discountPercent: 0,
        unitPrice: '149.00',
        inStock: true,
        stockQuantity: 999,
        deliveryDate: null,
        coverImageUrl: '/covers/godan.svg',
        soldCount: 88
      }
    ];

    if (search) {
      books = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (categoryId) {
      books = books.filter(() => true);
    }

    return HttpResponse.json({
      success: true,
      data: {
        items: books,
        total: books.length,
        page: 1,
        limit: 12,
        totalPages: 1
      },
      message: null,
      code: null
    });
  }),

  http.get('/api/products/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        title: 'The Guide',
        slug: 'the-guide',
        authorName: 'R. K. Narayan',
        authorId: 'auth-1',
        authorBio: 'Celebrated Indian writer known for works set in Malgudi.',
        format: 'PAPERBACK',
        language: 'English',
        price: '299.00',
        discountPercent: 10,
        unitPrice: '269.10',
        inStock: true,
        stockQuantity: 15,
        deliveryDate: '2026-11-17T15:00:00Z',
        coverImageUrl: '/covers/the-guide.svg',
        soldCount: 42,
        publisher: 'Indian Thought Publications',
        description: 'A masterpiece set in the fictional town of Malgudi.'
      },
      message: null,
      code: null
    });
  }),

  http.get('/api/products/:id/related', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'book-2',
          title: 'Godan',
          slug: 'godan',
          authorName: 'Munshi Premchand',
          authorId: 'auth-2',
          format: 'EBOOK',
          language: 'Hindi',
          price: '149.00',
          discountPercent: 0,
          unitPrice: '149.00',
          inStock: true,
          stockQuantity: 999,
          deliveryDate: null,
          coverImageUrl: '/covers/godan.svg',
          soldCount: 88
        }
      ],
      message: null,
      code: null
    });
  }),

  http.post('/api/products/:id/notify', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Notification registered successfully',
      code: null
    });
  }),

  http.get('/api/recommendations', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'book-1',
          title: 'The Guide',
          slug: 'the-guide',
          authorName: 'R. K. Narayan',
          authorId: 'auth-1',
          format: 'PAPERBACK',
          language: 'English',
          price: '299.00',
          discountPercent: 10,
          unitPrice: '269.10',
          inStock: true,
          stockQuantity: 15,
          deliveryDate: '2026-11-17T15:00:00Z',
          coverImageUrl: '/covers/the-guide.svg',
          soldCount: 42
        }
      ],
      message: null,
      code: null
    });
  }),
  // Orders (defaults for pages and navigation tests that do not care about the order)
  http.get('/api/orders', () => {
    return HttpResponse.json({ success: true, data: [], message: null, code: null });
  }),
  http.get('/api/orders/:id', () => {
    return HttpResponse.json(
      { success: false, data: null, message: 'Order not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }),

  // Checkout banks (used by the wallet top-up net banking tab)
  http.get('/api/checkout/banks', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { code: 'HDFC', name: 'HDFC Bank' },
        { code: 'SBI', name: 'State Bank of India' }
      ],
      message: null,
      code: null
    });
  }),

  // Wallet
  http.get('/api/wallet', () => {
    return HttpResponse.json({
      success: true,
      data: {
        balance: 250.0,
        transactions: [
          {
            id: 'txn-1',
            type: 'CREDIT',
            amount: 500.0,
            source: 'TOPUP',
            description: 'Wallet top-up via CREDIT_CARD',
            createdAt: '2026-11-14T10:00:00Z'
          }
        ]
      },
      message: null,
      code: null
    });
  }),

  http.post('/api/wallet/topup', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        balance: 250.0 + (body.amount || 0),
        transactions: [
          {
            id: 'txn-new',
            type: 'CREDIT',
            amount: body.amount,
            source: 'TOPUP',
            description: `Wallet top-up via ${body.paymentMethod}`,
            createdAt: new Date().toISOString()
          }
        ]
      },
      message: null,
      code: null
    });
  }),

  // Points history
  http.get('/api/auth/points-history', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'pt-1',
          points: 50,
          reason: 'EARNED',
          orderId: 'ord-1',
          createdAt: '2026-11-14T10:00:00Z',
          balanceAfter: 120
        }
      ],
      message: null,
      code: null
    });
  }),

  // Wishlist
  http.get('/api/wishlist', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'book-1',
          title: 'The Guide',
          slug: 'the-guide',
          author: { name: 'R. K. Narayan', slug: 'r-k-narayan' },
          format: 'PAPERBACK',
          language: 'English',
          price: 299.0,
          discountPercent: 10,
          unitPrice: 269.1,
          inStock: true,
          rating: 4.8,
          reviewCount: 42,
          deliveryDate: '2026-11-17',
          inWishlist: true
        }
      ],
      message: null,
      code: null
    });
  }),

  http.post('/api/wishlist', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Added to wishlist',
      code: null
    });
  }),

  http.delete('/api/wishlist/:id', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Removed from wishlist',
      code: null
    });
  }),

  // Authors & Following
  http.get('/api/authors', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'auth-1',
          name: 'R. K. Narayan',
          slug: 'r-k-narayan',
          imageUrl: null,
          following: true
        }
      ],
      message: null,
      code: null
    });
  }),

  http.get('/api/authors/:slug', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'auth-1',
        name: 'R. K. Narayan',
        slug: params.slug,
        imageUrl: null,
        following: true,
        bio: 'Celebrated Indian novelist known for Malgudi stories.',
        books: []
      },
      message: null,
      code: null
    });
  }),

  http.get('/api/following', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'auth-1',
          name: 'R. K. Narayan',
          slug: 'r-k-narayan',
          imageUrl: null,
          following: true
        }
      ],
      message: null,
      code: null
    });
  }),

  http.post('/api/following', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Followed author',
      code: null
    });
  }),

  http.delete('/api/following/:slug', () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: 'Unfollowed author',
      code: null
    });
  }),

  // Reviews
  http.get('/api/products/:id/reviews', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'rev-1',
          memberName: 'Alice Reader',
          rating: 5,
          body: 'A truly magnificent story that stands the test of time.',
          createdAt: '2026-11-14T09:00:00Z'
        }
      ],
      message: null,
      code: null
    });
  }),

  http.post('/api/products/:id/reviews', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'rev-new',
        memberName: 'Demo Reader',
        rating: body.rating,
        body: body.body,
        createdAt: new Date().toISOString()
      },
      message: null,
      code: null
    });
  }),

  // Library
  http.get('/api/library', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          book: {
            id: 'book-2',
            title: 'Godan',
            slug: 'godan',
            author: { name: 'Munshi Premchand', slug: 'munshi-premchand' },
            format: 'EBOOK',
            language: 'Hindi',
            price: 149.0,
            discountPercent: 0,
            unitPrice: 149.0,
            inStock: true
          },
          orderId: 'ord-1',
          purchasedAt: '2026-11-14T10:00:00Z'
        }
      ],
      message: null,
      code: null
    });
  }),

  http.get('/api/library/:id/content', () => {
    return HttpResponse.json({
      success: true,
      data: {
        title: 'Godan',
        chapters: [
          { title: 'Chapter 1: The Beginning', text: 'This is the opening of Godan by Munshi Premchand.' }
        ]
      },
      message: null,
      code: null
    });
  })
];
