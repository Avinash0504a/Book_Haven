# Feature Specification: Book Haven Online Bookstore

**Feature Branch**: `001-book-haven-bookstore`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Build Book Haven, an online bookstore, with the same user interface, styling and features as the reference project. Tier 1 (register/login/logout, navbar, home with filters and curated rows, book tiles, product page, cart, checkout with payment tabs and gift points, orders with 48-hour cancellation) is built and verified first. Tier 2 (wallet top-up, wishlist, authors and follow, reviews, digital library and reader, gift points history, profile and address management, help page) follows once Tier 1 is verified. Known reference defects must not be reproduced. Admin features, coupons, a real payment gateway, store management and return shipments are out of scope."

## Scope and Delivery Tiers

- Both tiers are part of this build.
- **Tier 1** is built and verified first: User Stories 1 to 8.
- **Tier 2** starts only after Tier 1 is verified: User Stories 9 to 14.
- **Out of scope**: admin features, coupons and promo codes, a real payment gateway, store
  management, return shipments.

## Clarifications

### Session 2026-11-13

- Q: Is Tier 2 part of this build, or only Tier 1? → A: Both tiers are in this build; Tier 2 tasks come after the Tier 1 verification gate.
- Q: When is stock reserved and released? → A: Reserved when the order is created (Pending); released on payment failure, on cancellation, or when a Pending order is unpaid after 15 minutes. The cart never reserves stock.
- Q: How are Recommended for You and Related Reads chosen? → A: Rule-based. Related Reads = same author first, then same category, never the book itself. Recommended = categories and authors from the user's orders and wishlist, falling back to top sellers for guests and users with no history. Out-of-stock books last; up to 6 books per list.
- Q: What exact checks does each payment method need? → A: Cards: exactly 16 digits (spaces and dashes allowed, no checksum test), name of 2 to 50 letters, 3-digit CVV, expiry MM/YYYY this month or later. UPI: `name@handle` format. Net Banking: one bank from a fixed list. Wallet: balance covers the payable amount. Cash on Delivery: physical-only orders with a payable amount of at most 50,000 rupees. Card number, CVV and UPI ID are never stored or logged.
- Q: Which single HTTP status code is used for validation errors? → A: 400 for every validation error, with code `VALIDATION_ERROR` and a field-level error list. The baseline's 422/400 split is removed.

### Session 2026-11-14

- Q: How is the tentative delivery date worked out? → A: Orders placed before 14:00 (India time) are dispatched the same day, later ones the next day. Add 1 day for handling, then 2 days of transit for metro pincodes (first three digits 110, 400, 411, 500, 560, 600, 700 or 380) or 4 days for all others. A date that falls on a Sunday moves to Monday. Digital books have no date. A guest, or a member with no pincode set, is shown dates for pincode 110001. The numbers are configuration, not code.
- Q: Which status code do state conflicts use (cancel not allowed, wallet balance too low, empty cart)? → A: 409. Only input mistakes are 400. The baseline's 400 for these three cases is replaced.
- Q: Can an unpaid (Pending) order be cancelled? → A: No. An unpaid order is not shown in order history and cannot be cancelled. It becomes Failed when payment fails or after 15 minutes (FR-046a), and its stock and points come back. Cancellation and its fees apply only to Confirmed, Processing and Shipped orders.
- Q: Which Spring Boot line is used? → A: Spring Boot 4.1.2 (the 4.1.x line). The constitution is amended to 1.1.0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register, Log In and Log Out (Priority: P1)

A visitor can create an account with full name, email and password, log in, and log out. Guests
can browse the catalogue freely, but must log in before adding to the cart or buying.

**Why this priority**: Every purchase flow depends on an identified user. Without it nothing else
can be verified.

**Independent Test**: Register a new account, log out, log in again, and confirm that a guest is
sent to login when trying to add a book to the cart.

**Acceptance Scenarios**:

1. **Given** a visitor with an unused email, **When** they register with a full name, email and
   a password of at least 6 characters, **Then** the account is created and they are logged in.
2. **Given** an email already registered, **When** a visitor registers with it, **Then** the
   registration is rejected with a clear "email already in use" message.
3. **Given** a registered user, **When** they log in with a wrong password, **Then** login is
   rejected with a generic "invalid credentials" message that does not reveal which field was
   wrong.
4. **Given** a guest, **When** they press Add to Cart on any book, **Then** they are taken to
   login and, after logging in, returned to where they were.
5. **Given** a logged-in user, **When** they log out, **Then** their session ends and pages that
   need login are no longer accessible.
6. **Given** registration or login form with invalid input, **When** the user submits, **Then**
   field-level messages appear and nothing is sent until the input is valid.

---

### User Story 2 - Browse, Search and Filter the Catalogue (Priority: P1)

On the home page a user sees a category list, a search box and Language, Format, Price and Sort
filters. With no filters applied the page shows curated rows (Recommended for You, Bestsellers
this Month, New Launches). With any filter applied it shows paginated results. Filters are kept
in the page address so a filtered view can be shared, reloaded, and navigated with the browser
back button.

**Why this priority**: Discovery is the entry point of every sale.

**Independent Test**: Open the home page as a guest, confirm the curated rows, pick a category and
a filter, reload the page, and confirm the same results remain.

**Acceptance Scenarios**:

1. **Given** no filters applied, **When** the home page loads, **Then** the Recommended,
   Bestsellers and New Launches rows are shown.
2. **Given** a category, search term, language, format, price range or sort is chosen, **When**
   the results load, **Then** the curated rows are replaced by a paginated result list that
   matches every selected filter.
3. **Given** filters are applied, **When** the user reloads or shares the page address, **Then**
   the same filters and page are restored.
4. **Given** a small screen, **When** the home page loads, **Then** categories appear as
   horizontally scrollable pills instead of a side list.
5. **Given** filters that match nothing, **When** results load, **Then** an empty state with a
   way to clear filters is shown.
6. **Given** a book tile, **When** it is displayed, **Then** it shows cover, title, author,
   format, price and tentative delivery date.

---

### User Story 3 - Book Tile Cart Controls and Product Page (Priority: P1)

Each book tile has an Add to Cart button that, once the book is in the cart, becomes a quantity
stepper plus a Go to Cart link. The product page shows full details: stock badge, delivery date,
a delivery pincode check, related books, an About the Writer section, and, if out of stock, a
Notify Me action instead of Add to Cart.

**Why this priority**: This is where interest turns into a cart.

**Independent Test**: As a logged-in user, add a book from its tile, change the quantity with the
stepper, open the product page, and check a pincode.

**Acceptance Scenarios**:

1. **Given** a logged-in user and an in-stock book, **When** they press Add to Cart, **Then** the
   button becomes a quantity stepper with a Go to Cart link and the navbar cart badge updates.
2. **Given** the stepper, **When** the user decreases quantity to zero, **Then** the book is
   removed and the Add to Cart button returns.
3. **Given** stock is limited, **When** the user tries to raise quantity above available stock,
   **Then** the increase is refused with a clear message.
4. **Given** the product page, **When** it loads, **Then** it shows a stock badge, price,
   tentative delivery date, related books and an About the Writer section.
5. **Given** a physical book and a valid 6-digit pincode, **When** the user checks it, **Then** the
   page shows the delivery date for that pincode (every valid pincode is serviceable; an invalid
   pincode is refused with a message).
6. **Given** an out-of-stock book, **When** the page loads, **Then** Add to Cart is replaced by
   Notify Me, and pressing it confirms the user will be notified.
7. **Given** an eBook or audiobook, **When** its page loads, **Then** no pincode check or
   delivery date is shown.

---

### User Story 4 - Navbar, Pincode Picker and Theme (Priority: P1)

A persistent navbar gives links to My Orders, Wishlist, E-Library and Writers, a delivery pincode
picker, a wallet balance pill, a cart count badge (showing "9+" above 9), and a user menu with
Profile, Wallet, Gift Points, theme toggle (Light, Dark, System), Help and Logout. Every page,
including payment and confirmation, respects the chosen theme.

**Why this priority**: The navbar is the navigation frame for every other story, and theming
applies to all of them.

**Independent Test**: Switch between Light, Dark and System on every page, and add ten books to
confirm the "9+" badge.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** any page loads, **Then** the navbar shows all required
   links, the pincode picker, the wallet pill and the cart badge.
2. **Given** more than 9 items in the cart, **When** the badge is shown, **Then** it reads "9+".
3. **Given** the user menu, **When** the user picks Light, Dark or System, **Then** the whole
   application changes immediately and the choice persists across reloads; System follows the
   device setting.
4. **Given** the pincode picker, **When** the user enters a valid 6-digit pincode, **Then** it is
   saved and used for delivery dates across the app; an invalid pincode is rejected with a message.
5. **Given** a guest, **When** the navbar is shown, **Then** user-only items (wallet pill, user
   menu entries) are replaced by Login and Register.
6. **Given** any page in either theme, **When** it is viewed, **Then** text is legible and no
   element retains a fixed light or dark appearance.

---

### User Story 5 - Cart and Delivery Address Selection (Priority: P1)

The cart lists items with a quantity stepper and remove action, a delivery address selector with
the default address already selected, and a Grand Total with a free-delivery progress bar and a
points-earned hint. Delivery is free for physical orders of 500 rupees and above, otherwise 49
rupees. Digital items need no address.

**Why this priority**: The cart is the gate to checkout and the place where totals must be
trustworthy.

**Independent Test**: Add books totalling under and over 500 rupees and confirm the delivery
charge, progress bar and points hint; confirm the default address is pre-selected.

**Acceptance Scenarios**:

1. **Given** a cart, **When** it loads, **Then** each item shows its details, a quantity stepper
   and a remove action.
2. **Given** a physical order under 500 rupees, **When** totals are shown, **Then** delivery is
   49 rupees and the progress bar shows how much more is needed for free delivery.
3. **Given** a physical order of 500 rupees or more, **When** totals are shown, **Then** delivery
   is free and the progress bar shows it as achieved.
4. **Given** a saved default address, **When** the cart or checkout opens, **Then** that address
   is already selected.
5. **Given** no saved address and a physical item, **When** the user proceeds, **Then** they must
   add an address first, through the single address form used throughout the app.
6. **Given** a cart of digital items only, **When** the user proceeds, **Then** no address is
   asked for and no delivery charge applies.
7. **Given** any change to the cart, **When** totals update, **Then** all amounts and the points
   earned hint are the values reported by the server.
8. **Given** an empty cart, **When** it is opened, **Then** an empty state links back to browsing.
9. **Given** the cart page, **Then** no coupon or promo code field is present.

---

### User Story 6 - Checkout, Payment and Confirmation (Priority: P1)

A user chooses a payment method from tabs: Credit Card, Debit Card, UPI, Net Banking, Book Haven
Wallet and Cash on Delivery. Cash on Delivery is unavailable if the order has an eBook or
audiobook. Every payment form is validated before submission. The user may redeem gift points
(10 points = 1 rupee, not more than their balance). On success a confirmation page lists the
purchased books, a success message and the delivery date.

**Why this priority**: This completes the purchase and is where money and points change hands.

**Independent Test**: Place one order with each payment method, confirm invalid forms are blocked,
and confirm the confirmation page and resulting points and wallet balances.

**Acceptance Scenarios**:

1. **Given** the checkout page, **When** it loads, **Then** the six payment tabs are shown and
   the payable amount is displayed.
2. **Given** a card tab, **When** the user submits with a card number, name, CVV or expiry that
   is missing or malformed, or an expired card, **Then** submission is blocked and the specific
   field errors are shown.
3. **Given** the UPI tab, **When** the UPI ID is malformed, **Then** submission is blocked with a
   message.
4. **Given** the Net Banking tab, **When** no bank is selected, **Then** submission is blocked.
5. **Given** the Wallet tab, **When** it is shown, **Then** it offers only the Book Haven Wallet,
   with the current balance, and no other payment instrument.
6. **Given** a wallet balance lower than the payable amount, **When** the user pays by wallet,
   **Then** payment is refused and the user is told the balance is insufficient.
7. **Given** an order containing an eBook or audiobook, **When** the tabs are shown, **Then**
   Cash on Delivery is disabled with an explanation.
8. **Given** a gift point balance, **When** the user redeems points, **Then** the payable amount
   reduces by points divided by 10, and redeeming more than the balance is refused.
9. **Given** a successful payment, **When** it completes, **Then** the order is confirmed, the
   cart is cleared, and the confirmation page shows a success message, the purchased books and the
   delivery date, with a Continue Shopping action.
10. **Given** the confirmation, **When** points are shown as earned, **Then** the value is the
    one reported by the server (1 point per 10 rupees paid).
11. **Given** a failed payment, **When** the failure occurs, **Then** stock and redeemed points
    are restored and the user can retry.
12. **Given** the payment and confirmation pages, **When** viewed in Light or Dark, **Then**
    both respect the theme.
13. **Given** the payment page, **Then** no promo code field is present.

---

### User Story 7 - Order History, Tracking and Buy Again (Priority: P1)

A user sees their orders newest first, each with a progress tracker, can open an order for
details, and can use Buy Again to re-add a past order's items to the cart, with unavailable items
reported.

**Why this priority**: Users need to see what they bought and repeat purchases easily.

**Independent Test**: Place two orders, open My Orders, confirm the order, open details, and use
Buy Again.

**Acceptance Scenarios**:

1. **Given** a user with orders, **When** My Orders opens, **Then** orders are listed newest
   first with a progress tracker showing Confirmed, Processing, Shipped and Delivered (or
   Cancelled). Orders that are still Pending or Failed are not listed.
2. **Given** an order, **When** the user opens it, **Then** they see items, quantities, prices,
   delivery charge, points redeemed and earned, payment method, address, status and dates.
3. **Given** a past order, **When** the user presses Buy Again, **Then** available items are added
   to the cart and any unavailable items are named in a message.
4. **Given** a user with no orders, **When** My Orders opens, **Then** an empty state links to
   browsing.
5. **Given** another user's order identifier, **When** requested, **Then** it is not shown.

---

### User Story 8 - Cancel an Order (Priority: P1)

A user can cancel an order, fully or partially (by item and quantity), only within 48 hours of
placing it. The user gives a reason, chooses a refund destination (Book Haven wallet or bank
account), and sees the fee, refund amount and points restored before confirming. Fee tiers by
order status: 0 percent before packing, 10 percent while Processing, 20 percent once Shipped.
Delivered and already-cancelled orders cannot be cancelled. Digital books cannot be cancelled.

**Why this priority**: It has money and policy consequences and a known defect in the reference.

**Independent Test**: Place an order, cancel part of it within the window and see the preview;
then verify that an order older than 48 hours offers no Cancel option and is rejected if forced.

**Acceptance Scenarios**:

1. **Given** an order placed less than 48 hours ago in a cancellable status, **When** it is
   viewed, **Then** a Cancel option is visible.
2. **Given** an order placed 48 hours or more ago, **When** it is viewed, **Then** no Cancel
   option is shown, and an attempt to cancel is rejected by the server with a clear reason.
3. **Given** the cancel flow, **When** items and a reason are chosen, **Then** a preview shows the
   fee tier, fee, refund and points restored before the user confirms.
4. **Given** a status of Confirmed before packing, Processing or Shipped, **When** the user
   previews cancellation, **Then** the fee is 0, 10 or 20 percent respectively.
5. **Given** a Delivered or Cancelled order, **When** it is viewed, **Then** it cannot be
   cancelled.
6. **Given** a refund to the wallet, **When** cancellation is confirmed, **Then** the wallet is
   credited immediately.
7. **Given** a refund to a bank account, **When** details are entered, **Then** they are
   validated, the refund is marked as initiated, and the account number is shown masked.
8. **Given** redeemed points on the order, **When** cancellation completes, **Then** points are
   restored in proportion to the cancelled amount.
9. **Given** an order of only digital books, **When** viewed, **Then** no Cancel option is
   offered.
10. **Given** a mixed order, **When** cancelling, **Then** only the physical items can be
    selected.
11. **Given** a partial cancellation, **When** it completes, **Then** the order shows the
    cancelled items and remains active for the rest.

---

### User Story 9 - Wallet Top-up and Gift Points History (Priority: P2)

A user can view their wallet balance and transactions, add money from 1 to 100,000 rupees, and
view a gift points history showing points earned, redeemed and restored.

**Why this priority**: Supports payments and refunds but is not needed for the first purchase.

**Independent Test**: Top up the wallet, see the balance and transaction update, then open gift
points history after an order.

**Acceptance Scenarios**:

1. **Given** the wallet page, **When** it opens, **Then** the balance and transactions are shown,
   newest first.
2. **Given** a top-up amount between 1 and 100,000 rupees and valid payment details, **When** the
   user submits, **Then** the balance increases and the navbar pill updates.
3. **Given** an amount outside the range or non-numeric, **When** submitted, **Then** it is
   refused with a message.
4. **Given** the gift points page, **When** it opens, **Then** each entry shows date, reason and
   points, and the current balance.

---

### User Story 10 - Wishlist (Priority: P2)

A user can add books to a wishlist from the product page or tile, view the wishlist, remove
items, and move them to the cart.

**Why this priority**: Convenience feature that builds on browsing.

**Independent Test**: Add and remove a book from the wishlist and add one to the cart from it.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they press Add to Wishlist, **Then** the book appears in
   their wishlist and the control shows its saved state.
2. **Given** the wishlist, **When** the user removes an item, **Then** it disappears.
3. **Given** a guest, **When** they use the wishlist control, **Then** they are asked to log in.
4. **Given** an empty wishlist, **When** opened, **Then** an empty state is shown.

---

### User Story 11 - Writers: Browse, Profile and Follow (Priority: P2)

A user can browse writers, open a writer's profile with their bio and books, and follow or
unfollow them. The Writers navigation entry lists followed writers.

**Why this priority**: Extra discovery feature.

**Independent Test**: Open a writer page, follow, see them under Writers, unfollow.

**Acceptance Scenarios**:

1. **Given** a writer link on any tile or page, **When** followed, **Then** the writer page shows
   bio, photo and their books.
2. **Given** a logged-in user, **When** they press Follow, **Then** the writer appears in their
   Writers list and the button changes to Unfollow.
3. **Given** a guest, **When** they press Follow, **Then** they are asked to log in.

---

### User Story 12 - Reviews and Ratings (Priority: P2)

A user can read reviews and ratings on a product page and post one review per book with a rating
of 1 to 5 and text of up to 100 characters.

**Why this priority**: Social proof; not needed to complete a purchase.

**Independent Test**: Post a review, see it listed, and try to post a second one.

**Acceptance Scenarios**:

1. **Given** the product page, **When** it loads, **Then** the average rating and reviews are
   shown.
2. **Given** a logged-in user, **When** they submit a rating and text up to 100 characters,
   **Then** the review appears with a live character counter shown while typing.
3. **Given** a user who already reviewed the book, **When** they try again, **Then** the second
   review is refused with a message.
4. **Given** missing rating or over-length text, **When** submitted, **Then** it is blocked with
   field messages.

---

### User Story 13 - Digital Library and Reader (Priority: P2)

A user can open an E-Library of purchased eBooks and audiobooks, read an eBook in an in-app
reader, play an audiobook, and download either.

**Why this priority**: Gives purchased digital goods a place to be used.

**Independent Test**: Buy an eBook, open the E-Library, open it in the reader, and download it.

**Acceptance Scenarios**:

1. **Given** a purchased digital book, **When** the E-Library opens, **Then** it is listed.
2. **Given** a listed eBook, **When** the user opens it, **Then** the reader shows its content.
3. **Given** a listed audiobook, **When** the user plays it, **Then** audio plays with basic
   controls.
4. **Given** a book the user has not bought, **When** its content is requested, **Then** access
   is refused.
5. **Given** an empty library, **When** opened, **Then** an empty state links to digital books.

---

### User Story 14 - Profile, Address Management and Help (Priority: P2)

A user can view and edit their profile, manage saved delivery addresses (add, edit, delete, set
default) through the single address form, and open a Help page.

**Why this priority**: Account upkeep; not required for the first purchase.

**Independent Test**: Add two addresses, change the default, delete one, and edit the profile name.

**Acceptance Scenarios**:

1. **Given** the profile page, **When** it opens, **Then** name, email, wallet balance and gift
   points are shown.
2. **Given** saved addresses, **When** the user sets one as default, **Then** the previous
   default is cleared and the new one is pre-selected in the cart.
3. **Given** an address in use by past orders, **When** it is deleted, **Then** past orders still
   show their original address.
4. **Given** an invalid address (e.g. pincode not 6 digits), **When** submitted, **Then** field
   errors are shown and nothing is saved.
5. **Given** the Help page, **When** opened, **Then** it shows answers to common questions
   (ordering, payment, cancellation, delivery, digital books).

---

### Edge Cases

- Two users buy the last copy at the same time: only one succeeds, and the other sees a clear
  stock message and the cart is updated.
- A Pending order is left unpaid past 15 minutes: it expires, stock and points are returned, and
  paying it afterwards is refused with a message asking the user to check out again.
- Price or stock changes between adding to the cart and paying: the user is shown current values
  before payment is confirmed.
- Points redeemed that exceed the payable amount: redemption is capped so the payable amount
  does not go below zero.
- Session expires mid-checkout: the user is sent to login and returned to checkout with cart
  intact.
- Payment is refused partway: no order remains active, stock and points are restored.
- Cancellation requested exactly at the 48-hour boundary: the window is measured from the order's
  creation time and is closed at 48 hours.
- A cancellation of a quantity larger than what remains on the order is refused.
- Pincode with letters or wrong length is refused wherever it is entered.
- A deleted default address leaves no address pre-selected until the user picks another.
- A mixed cart of physical and digital items: the address is required (for the physical part),
  Cash on Delivery is not offered, and only physical items count toward delivery charge and the
  free-delivery threshold.
- The browser back button after payment never resubmits a payment or places a duplicate order.

## Requirements *(mandatory)*

Each requirement carries an ID so that the API contract and tests can reference it. Where a
requirement matches the baseline document, its baseline ID is noted.

### Functional Requirements

**Accounts and access**

- **FR-001**: Visitors MUST be able to register with full name, email and a password of at least
  6 characters; duplicate emails MUST be rejected (REQ-AUTH-01, 04).
- **FR-002**: Users MUST be able to log in with email and password and log out (REQ-AUTH-02).
- **FR-003**: Failed login MUST give a generic message that does not reveal whether the email
  exists (REQ-AUTH-04).
- **FR-004**: Guests MUST be able to browse the catalogue and product pages; every other action
  (cart, checkout, orders, wallet, wishlist, library, profile) MUST require login (REQ-AUTH-05).
- **FR-005**: A logged-in user MUST be able to see only their own orders, addresses, cart,
  wallet, wishlist and library (REQ-NFR-05).
- **FR-006**: Users MUST be able to view their profile, wallet balance and gift point balance
  (REQ-AUTH-03).

**Catalogue and discovery**

- **FR-010**: The home page MUST list categories and let the user filter by category, search text,
  Language, Format and Price, and sort the results (REQ-CAT-01, 02, 04).
- **FR-011**: When no filters are applied the home page MUST show the Recommended, Bestsellers and
  New Launches rows; when any filter is applied it MUST show paginated results instead.
- **FR-011a**: Recommended for You MUST list up to 6 books from the categories and authors of the
  user's past orders and wishlist, excluding books they already bought, with out-of-stock books
  last. For guests and users with no history it MUST show the top-selling books instead.
- **FR-012**: All filter, sort and page state MUST be held in the page address so that reload,
  sharing and browser back reproduce the same view.
- **FR-013**: Every book tile MUST show cover, title, author, format, price and tentative
  delivery date (REQ-CAT-05).
- **FR-014**: The product page MUST show stock status, delivery date, a pincode check,
  related books and an About the Writer section (REQ-CAT-06).
- **FR-014a**: Related Reads MUST list up to 6 books, the same author's books first and then the
  same category's, never including the book being viewed, with out-of-stock books last.
- **FR-015**: Out-of-stock books MUST show Notify Me in place of Add to Cart.
- **FR-016**: Delivery dates and pincode checks MUST NOT be shown for eBooks and audiobooks.
- **FR-017**: A language picker MUST NOT be offered anywhere in the interface.

**Navbar and theme**

- **FR-020**: The navbar MUST provide links to My Orders, Wishlist, E-Library and Writers, a
  delivery pincode picker, a wallet balance pill, a cart count badge and a user menu.
- **FR-021**: The cart badge MUST show the item count and "9+" when it exceeds 9.
- **FR-022**: The user menu MUST contain Profile, Wallet, Gift Points, a theme toggle (Light, Dark,
  System), Help and Logout.
- **FR-023**: The theme choice MUST apply to every page, including payment and confirmation, MUST
  persist across reloads, and MUST follow the device setting when System is chosen.
- **FR-024**: The pincode picker MUST accept only 6-digit pincodes, persist the choice, and drive
  delivery dates.

**Cart**

- **FR-030**: Users MUST be able to add a book to the cart (quantity at least 1, limited by
  stock), change its quantity (0 removes it), remove it, and clear the cart (REQ-CART-01, 02).
- **FR-031**: Tiles and product pages MUST turn Add to Cart into a quantity stepper plus Go to
  Cart once the book is in the cart.
- **FR-032**: The cart MUST show line subtotals, an overall subtotal, the delivery charge, the
  Grand Total and the points the order will earn, all as calculated by the server (REQ-CART-03).
- **FR-033**: Delivery MUST cost 49 rupees for physical orders under 500 rupees and be free at 500
  rupees and above; digital-only orders have no delivery charge (REQ-PAY-05).
- **FR-034**: The cart MUST show a progress bar toward free delivery.
- **FR-035**: The cart MUST NOT contain a coupon or promo code field.
- **FR-036**: The cart MUST pre-select the user's default address when one exists.
- **FR-037**: The application MUST offer a single address entry flow, reused wherever an address
  is added or edited.

**Checkout and payment**

- **FR-040**: Physical orders MUST require a delivery address; digital-only orders MUST NOT
  (REQ-PAY-02).
- **FR-041**: Payment MUST be offered through tabs for Credit Card, Debit Card, UPI, Net Banking,
  Book Haven Wallet and Cash on Delivery (REQ-PAY-04).
- **FR-042**: Cash on Delivery MUST be unavailable for any order containing an eBook or audiobook.
- **FR-043**: Every payment form MUST be validated on the client before submission, and again on
  the server, with the same rules in both places:
  - Credit and Debit Card: a card number of exactly 16 digits (spaces and dashes allowed; no
    checksum test); a name of 2 to 50 letters; a CVV of exactly 3 digits; an expiry in MM/YYYY
    format that is the current month or later.
  - UPI: an ID of the form `name@handle`, using letters, digits, dots, dashes or underscores.
  - Net Banking: one bank chosen from a fixed list.
  - Wallet: the wallet balance covers the payable amount (FR-044).
  - Cash on Delivery: physical-only orders with a payable amount of at most 50,000 rupees.
- **FR-043a**: Card numbers, CVVs and UPI IDs MUST NOT be stored or logged.
- **FR-044**: The Wallet tab MUST offer only the Book Haven Wallet; wallet payment MUST be refused
  if the balance is insufficient (REQ-PAY-09).
- **FR-045**: Users MUST be able to redeem gift points at 10 points = 1 rupee, never above their
  balance or the payable amount (REQ-PAY-03).
- **FR-046**: Creating an order MUST reserve stock and deduct redeemed points; a confirmed payment
  MUST confirm the order, clear the cart and award 1 point per 10 rupees paid; a failed payment
  MUST release stock and return redeemed points (REQ-PAY-06, 07, 08).
- **FR-046a**: Stock MUST be reserved only when the order is created, never by adding to the cart.
  A Pending order not paid within 15 minutes MUST be expired automatically, releasing its stock
  and redeemed points. Cancelled quantities MUST be returned to stock.
- **FR-047**: Points earned MUST be taken from the server's response and never computed in the
  interface.
- **FR-048**: After a successful payment the user MUST see a confirmation with a success message,
  the purchased books, the delivery date and a Continue Shopping action (REQ-PAY-10).
- **FR-049**: Repeated submission of the same payment MUST NOT create duplicate orders or charges.

**Orders and cancellation**

- **FR-050**: Order history MUST list the user's orders newest first, each with a progress tracker
  following the lifecycle Confirmed, Processing, Shipped, Delivered, or Cancelled (Pending and
  Failed orders are never listed)
  (REQ-ORD-01, 03).
- **FR-051**: Users MUST be able to open a single order's details.
- **FR-052**: Buy Again MUST re-add a past order's items to the cart and list unavailable items
  (REQ-ORD-02).
- **FR-053**: The Cancel action MUST be visible only for orders placed within the last 48 hours in
  a cancellable status, and the server MUST reject cancellation outside the window (REQ-ORD-04).
- **FR-054**: Cancellation MUST support full or partial cancellation by item and quantity, a
  mandatory reason, and a preview of fee, refund and points restored before confirmation
  (REQ-ORD-05, 06).
- **FR-055**: Cancellation fees MUST be 0 percent before packing, 10 percent while Processing and
  20 percent once Shipped; Delivered and Cancelled orders MUST NOT be cancellable (REQ-ORD-07).
- **FR-056**: Refunds MUST go to the wallet (instant) or to a bank account (initiated); bank
  details MUST be validated and the account number displayed masked (REQ-ORD-08).
- **FR-057**: Redeemed points MUST be restored in proportion to the cancelled amount (REQ-ORD-09).
- **FR-058**: Digital books MUST NOT be cancellable.
- **FR-059**: Whether an order is cancellable, the fee and the refund MUST be determined by the
  server; the interface only displays them.

**Tier 2 features**

- **FR-060**: Users MUST be able to view wallet balance and transactions and add 1 to 100,000
  rupees to the wallet (REQ-X-WAL-01).
- **FR-061**: Users MUST be able to list, add and remove wishlist items (REQ-X-WISH-01).
- **FR-062**: Users MUST be able to view writer profiles, follow and unfollow writers, and see
  followed writers (REQ-X-AUTH-01).
- **FR-063**: Users MUST be able to read reviews and post one review per book, with a rating of 1
  to 5 and up to 100 characters of text (REQ-CAT-07).
- **FR-064**: Users MUST be able to see purchased eBooks and audiobooks in a library, read, play
  and download them, and MUST NOT access content they have not purchased (REQ-X-LIB-01).
- **FR-065**: Users MUST be able to view their gift points history (REQ-X-PTS-01).
- **FR-066**: Users MUST be able to edit their profile, and add, edit, delete (without altering
  past orders) and set a default among saved addresses (REQ-PAY-01).
- **FR-067**: A Help page MUST be available.

**Quality, safety and consistency**

- **FR-070**: Every button and link MUST perform a real action; controls with no behaviour MUST
  NOT be shown.
- **FR-071**: Every page MUST be legible and fully usable in both Light and Dark, with no colour
  fixed to one theme.
- **FR-072**: All amounts, totals, points earned, cancellation eligibility, fees and refunds shown
  to the user MUST be those calculated by the server.
- **FR-073**: Every error shown to the user MUST be a clear message; internal error details MUST
  NOT be exposed (REQ-NFR-06).
- **FR-074**: Input MUST be validated both in the interface and on the server, with the interface
  showing field-level messages.
- **FR-074a**: Every validation error, whether from a malformed request, a field rule or a business
  rule such as redeeming more points than the balance, MUST return HTTP status 400 with the code
  `VALIDATION_ERROR` and a list of field-level messages. No other status code may be used for
  validation errors. Other failures keep their own statuses: 401 not logged in, 403 another
  user's data, 404 not found, 409 state conflicts such as a duplicate email, insufficient stock,
  an empty cart, an insufficient wallet balance, or an order that can no longer be cancelled.
- **FR-075**: Passwords MUST be stored only in hashed form, and no secret, password or default
  credential may appear in committed files.
- **FR-076**: Every page MUST show loading, empty and error states where data is fetched.
- **FR-077**: All interactive elements MUST be operable by keyboard and have accessible labels.

### Key Entities

- **Member**: A registered user with name, email, password (hashed), wallet balance and gift point
  balance. Owns addresses, cart, orders, wishlist, library, reviews and follows.
- **Address**: A delivery location belonging to a member, with a default flag and a removed
  flag, kept intact for past orders.
- **Category**: A catalogue grouping for books.
- **Book**: An item for sale with title, description, format (paperback, hardcover, eBook,
  audiobook), language, price, stock, cover, categories and an author. Digital formats have no
  stock limit and no delivery.
- **Author (Writer)**: A person with bio and photo who writes books and can be followed.
- **Review**: A member's rating (1 to 5) and short text for a book; one per member per book.
- **Cart and Cart Item**: A member's pending selection of books and quantities.
- **Wishlist Item**: A book a member has saved for later.
- **Order and Order Item**: A purchase with items, quantities, price at purchase, delivery charge,
  points redeemed and earned, payment method, address snapshot, status and timestamps.
- **Payment**: The record of a payment attempt for an order, with method and outcome.
- **Cancellation**: A record of the items cancelled, reason, fee tier, fee, refund amount and
  destination, and points restored.
- **Wallet Transaction**: A credit or debit on a member's wallet (top-up, payment, refund).
- **Gift Point Transaction**: Points earned, redeemed or restored, with a reason and date.
- **Library Entry**: A digital book a member has purchased and can read, play or download.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can register and place their first order for a single book in under 5
  minutes.
- **SC-002**: A returning user can find a specific book using search or filters and add it to the
  cart in under 1 minute.
- **SC-003**: 100 percent of the wireframed screens (home, catalogue, product, cart, checkout,
  payment, confirmation) are present and match the reference's layout and behaviour.
- **SC-004**: Every page, including payment and confirmation, is fully legible and unbroken in
  both Light and Dark; a review of every page finds zero elements with fixed-theme colours.
- **SC-005**: Across a test set covering every combination of order type (physical, digital,
  mixed) and payment method, 100 percent of totals, delivery charges, points earned and
  cancellation fees shown match the server's calculation.
- **SC-006**: 100 percent of orders older than 48 hours show no Cancel option, and 100 percent of
  forced cancellation attempts on them are refused.
- **SC-007**: 100 percent of invalid payment submissions (card, UPI, Net Banking) are stopped
  before any payment is attempted, with a message for each faulty field.
- **SC-008**: In an audit of all pages and the committed files, there are zero dead buttons, zero
  promo code fields, zero language pickers, zero committed secrets or default passwords, and a
  default address is pre-selected in the cart in 100 percent of cases where one exists.
- **SC-009**: A user can never view or change another user's data: 100 percent of cross-user
  access attempts in testing are refused.
- **SC-010**: Browse and search results appear within 2 seconds for 95 percent of requests under
  normal load.
- **SC-011**: Tier 1 is verified end to end (all acceptance scenarios for stories 1 to 8 pass)
  before any Tier 2 work begins.

## Assumptions

- The reference project lives in `reference/projectA`.
- The reference's `docs/requirements.md` is the feature baseline, its frontend is the visual and
  behavioural reference, and the images in `docs/wireframes` are the layout reference. Where the
  reference and the brief differ, this brief wins.
- The wireframes use the name "Book Worm", show a tax line, and show a coupon box. This product is
  named Book Haven, has no coupons (out of scope) and shows no tax line, because the baseline has
  no tax requirement.
- The currency is Indian rupees; amounts display with the rupee symbol.
- Payments are simulated: no real card, UPI or bank gateway is contacted. The form validation and
  rules are real, and the outcome is a stand-in. Payment details are not stored.
- The wireframes show four payment tabs; this brief requires six, and the brief wins.
- "Before packing" in the fee tiers means order status Confirmed. Pending orders have not been
  paid for, so they are never cancellable; they expire or fail instead (FR-046a).
- A member's delivery pincode setting is stored on the device, and delivery dates are estimated
  from it by the server; every valid 6-digit pincode is serviceable; real courier integration is
  out of scope.
- Notify Me records the user's interest in a book; sending the notification is out of scope.
- The 48-hour window runs from the moment the order was placed.
- The app is used in a modern desktop or mobile browser, in English only.
- Sample catalogue data (books, writers, categories, covers) is provided for demo and
  verification. No real user data is seeded and no default credentials are committed.
- The backend is built and verified before the frontend, and the work is delivered in small
  phases with a commit after each, as set out in the project constitution.
