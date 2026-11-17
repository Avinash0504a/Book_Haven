-- Book Haven schema (data-model.md). Primary keys are UUIDs, money is NUMERIC(12,2),
-- timestamps are timestamptz and every table has created_at.

CREATE TABLE member (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name      VARCHAR(100)  NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
    email          VARCHAR(254)  NOT NULL,
    password_hash  VARCHAR(100)  NOT NULL,
    gift_points    INTEGER       NOT NULL DEFAULT 0 CHECK (gift_points >= 0),
    wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_member_email_lower ON member (lower(email));

CREATE TABLE address (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id      UUID         NOT NULL REFERENCES member (id),
    label          VARCHAR(10)  NOT NULL CHECK (label IN ('HOME', 'OFFICE', 'OTHER')),
    recipient_name VARCHAR(100) NOT NULL CHECK (char_length(recipient_name) BETWEEN 2 AND 100),
    phone          VARCHAR(10)  NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
    line1          VARCHAR(120) NOT NULL,
    line2          VARCHAR(120),
    city           VARCHAR(80)  NOT NULL,
    state          VARCHAR(80)  NOT NULL,
    postal_code    VARCHAR(6)   NOT NULL CHECK (postal_code ~ '^[1-9][0-9]{5}$'),
    country        VARCHAR(60)  NOT NULL DEFAULT 'India',
    is_default     BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_address_member ON address (member_id);
-- at most one default per member among live addresses
CREATE UNIQUE INDEX uq_address_one_default
    ON address (member_id) WHERE is_default AND deleted_at IS NULL;

CREATE TABLE category (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80)  NOT NULL UNIQUE,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    description TEXT,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE brand (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    logo_url   VARCHAR(300),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE author (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    bio        TEXT,
    image_url  VARCHAR(300),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE book (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(200)  NOT NULL,
    author_id        UUID          NOT NULL REFERENCES author (id),
    category_id      UUID          NOT NULL REFERENCES category (id),
    brand_id         UUID          NOT NULL REFERENCES brand (id),
    description      TEXT,
    isbn             VARCHAR(20),
    price            NUMERIC(12,2) NOT NULL CHECK (price > 0),
    discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
    format           VARCHAR(10)   NOT NULL CHECK (format IN ('PAPERBACK', 'HARDCOVER', 'EBOOK', 'AUDIOBOOK')),
    language         VARCHAR(20)   NOT NULL CHECK (language IN ('English', 'Hindi', 'Tamil', 'Telugu', 'Kannada')),
    stock_quantity   INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    cover_image_url  VARCHAR(300),
    slug             VARCHAR(120)  NOT NULL UNIQUE,
    rating           NUMERIC(2,1)  NOT NULL DEFAULT 0,
    review_count     INTEGER       NOT NULL DEFAULT 0,
    base_sold_count  INTEGER       NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_book_category ON book (category_id);
CREATE INDEX ix_book_author   ON book (author_id);
CREATE INDEX ix_book_brand    ON book (brand_id);
CREATE INDEX ix_book_format   ON book (format);
CREATE INDEX ix_book_language ON book (language);
CREATE INDEX ix_book_title_lower ON book (lower(title));

CREATE TABLE review (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID         NOT NULL REFERENCES member (id),
    book_id    UUID         NOT NULL REFERENCES book (id),
    rating     INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body       VARCHAR(100) NOT NULL CHECK (char_length(body) <= 100),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_review_member_book UNIQUE (member_id, book_id)
);
CREATE INDEX ix_review_book ON review (book_id);

CREATE TABLE stock_notification (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID        NOT NULL REFERENCES member (id),
    book_id    UUID        NOT NULL REFERENCES book (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_notification_member_book UNIQUE (member_id, book_id)
);

CREATE TABLE cart (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID        NOT NULL UNIQUE REFERENCES member (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No unit price column: the cart always prices from the current book.
CREATE TABLE cart_item (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id    UUID        NOT NULL REFERENCES cart (id) ON DELETE CASCADE,
    book_id    UUID        NOT NULL REFERENCES book (id),
    quantity   INTEGER     NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cart_item_cart_book UNIQUE (cart_id, book_id)
);

CREATE TABLE orders (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id          UUID          NOT NULL REFERENCES member (id),
    idempotency_key    VARCHAR(64)   NOT NULL,
    status             VARCHAR(10)   NOT NULL
        CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED')),
    subtotal           NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    shipping_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    gift_points_used   INTEGER       NOT NULL DEFAULT 0 CHECK (gift_points_used >= 0),
    discount_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount       NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    points_earned      INTEGER       NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    -- address snapshot: copied fields, null for digital-only orders
    ship_recipient_name VARCHAR(100),
    ship_phone         VARCHAR(10),
    ship_line1         VARCHAR(120),
    ship_line2         VARCHAR(120),
    ship_city          VARCHAR(80),
    ship_state         VARCHAR(80),
    ship_postal_code   VARCHAR(6),
    ship_country       VARCHAR(60),
    delivery_date      DATE,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    confirmed_at       TIMESTAMPTZ,
    packed_at          TIMESTAMPTZ,
    shipped_at         TIMESTAMPTZ,
    delivered_at       TIMESTAMPTZ,
    cancelled_at       TIMESTAMPTZ,
    expires_at         TIMESTAMPTZ,
    cancellation_fee   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cancellation_fee >= 0),
    refund_amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
    CONSTRAINT uq_orders_member_idempotency UNIQUE (member_id, idempotency_key)
);
CREATE INDEX ix_orders_member_created ON orders (member_id, created_at DESC);
CREATE INDEX ix_orders_pending_expiry ON orders (expires_at) WHERE status = 'PENDING';

CREATE TABLE order_item (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID          NOT NULL REFERENCES orders (id),
    book_id            UUID          NOT NULL REFERENCES book (id),
    title_snapshot     VARCHAR(200)  NOT NULL,
    format_snapshot    VARCHAR(10)   NOT NULL,
    quantity           INTEGER       NOT NULL CHECK (quantity >= 1),
    cancelled_quantity INTEGER       NOT NULL DEFAULT 0,
    unit_price         NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total         NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_order_item_cancelled CHECK (cancelled_quantity BETWEEN 0 AND quantity)
);
CREATE INDEX ix_order_item_order ON order_item (order_id);
CREATE INDEX ix_order_item_book  ON order_item (book_id);

-- Card numbers, CVV, UPI ids and bank choices beyond a method name are never stored.
CREATE TABLE payment (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID          NOT NULL UNIQUE REFERENCES orders (id),
    method     VARCHAR(12)   NOT NULL
        CHECK (method IN ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD')),
    status     VARCHAR(10)   NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    amount     NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    reference  VARCHAR(40),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE order_cancellation (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID          NOT NULL REFERENCES orders (id),
    reason             VARCHAR(100),
    note               VARCHAR(500),
    items_json         TEXT          NOT NULL,
    value_cancelled    NUMERIC(12,2) NOT NULL CHECK (value_cancelled >= 0),
    discount_share     NUMERIC(12,2) NOT NULL CHECK (discount_share >= 0),
    gross_paid         NUMERIC(12,2) NOT NULL CHECK (gross_paid >= 0),
    fee_rate           NUMERIC(5,4)  NOT NULL CHECK (fee_rate >= 0),
    fee_amount         NUMERIC(12,2) NOT NULL CHECK (fee_amount >= 0),
    refund_amount      NUMERIC(12,2) NOT NULL CHECK (refund_amount >= 0),
    points_restored    INTEGER       NOT NULL DEFAULT 0 CHECK (points_restored >= 0),
    refund_method      VARCHAR(10)   NOT NULL CHECK (refund_method IN ('WALLET', 'BANK')),
    refund_status      VARCHAR(10)   NOT NULL CHECK (refund_status IN ('PROCESSED', 'INITIATED')),
    refund_destination VARCHAR(60),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_order_cancellation_order ON order_cancellation (order_id);

CREATE TABLE gift_points_transaction (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID        NOT NULL REFERENCES member (id),
    order_id   UUID        REFERENCES orders (id),
    points     INTEGER     NOT NULL,
    reason     VARCHAR(30) NOT NULL
        CHECK (reason IN ('REDEEMED', 'EARNED', 'RESTORED_ON_FAILURE', 'RESTORED_ON_CANCEL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_gift_points_member ON gift_points_transaction (member_id, created_at DESC);

CREATE TABLE wallet_transaction (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id   UUID          NOT NULL REFERENCES member (id),
    type        VARCHAR(6)    NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description VARCHAR(200),
    source      VARCHAR(20)   NOT NULL CHECK (source IN ('TOPUP', 'ORDER_PAYMENT', 'ORDER_REFUND')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_wallet_member ON wallet_transaction (member_id, created_at DESC);

CREATE TABLE wishlist_item (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID        NOT NULL REFERENCES member (id),
    book_id    UUID        NOT NULL REFERENCES book (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_wishlist_member_book UNIQUE (member_id, book_id)
);

CREATE TABLE author_follow (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID        NOT NULL REFERENCES member (id),
    author_id  UUID        NOT NULL REFERENCES author (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_author_follow_member_author UNIQUE (member_id, author_id)
);
