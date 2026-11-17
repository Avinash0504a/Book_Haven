# Tier 1 Verification Checklist (Stories 1 to 8)

## User Story 1 - Member Registration and Login (P1)
- [x] US1-S1: Given a visitor with an unused email, When they register with a full name, email and a password of at least 6 characters, Then the account is created and they are logged in.
- [x] US1-S2: Given an email already registered, When a visitor registers with it, Then the registration is rejected with a clear "email already in use" message.
- [x] US1-S3: Given a registered user, When they log in with a wrong password, Then login is rejected with a generic "invalid credentials" message that does not reveal which field was wrong.
- [x] US1-S4: Given a guest, When they press Add to Cart on any book, Then they are taken to login and, after logging in, returned to where they were.
- [x] US1-S5: Given a logged-in user, When they log out, Then their session ends and pages that need login are no longer accessible.
- [x] US1-S6: Given registration or login form with invalid input, When the user submits, Then field-level messages appear and nothing is sent until the input is valid.

## User Story 2 - Browse, Search and Filter the Catalogue (P1)
- [x] US2-S1: Given no filters applied, When the home page loads, Then the Recommended, Bestsellers and New Launches rows are shown.
- [x] US2-S2: Given a category, search term, language, format, price range or sort is chosen, When the results load, Then the curated rows are replaced by a paginated result list that matches every selected filter.
- [x] US2-S3: Given filters are applied, When the user reloads or shares the page address, Then the same filters and page are restored.
- [x] US2-S4: Given a small screen, When the home page loads, Then categories appear as horizontally scrollable pills instead of a side list.
- [x] US2-S5: Given filters that match nothing, When results load, Then an empty state with a way to clear filters is shown.
- [x] US2-S6: Given a book tile, When it is displayed, Then it shows cover, title, author, format, price and tentative delivery date.

## User Story 3 - Book Tile Cart Controls and Product Page (P1)
- [x] US3-S1: Given a logged-in user and an in-stock book, When they press Add to Cart, Then the button becomes a quantity stepper with a Go to Cart link and the navbar cart badge updates.
- [x] US3-S2: Given the stepper, When the user decreases quantity to zero, Then the book is removed and the Add to Cart button returns.
- [x] US3-S3: Given stock is limited, When the user tries to raise quantity above available stock, Then the increase is refused with a clear message.
- [x] US3-S4: Given the product page, When it loads, Then it shows a stock badge, price, tentative delivery date, related books and an About the Writer section.
- [x] US3-S5: Given a physical book and a valid 6-digit pincode, When the user checks it, Then the page shows the delivery date for that pincode.
- [x] US3-S6: Given an out-of-stock book, When the page loads, Then Add to Cart is replaced by Notify Me, and pressing it confirms the user will be notified.
- [x] US3-S7: Given an eBook or audiobook, When its page loads, Then no pincode check or delivery date is shown.

## User Story 4 - Navbar, Pincode Picker and Theme (P1)
- [x] US4-S1: Given a logged-in user, When any page loads, Then the navbar shows all required links, the pincode picker, the wallet pill and the cart badge.
- [x] US4-S2: Given more than 9 items in the cart, When the badge is shown, Then it reads "9+".
- [x] US4-S3: Given the user menu, When the user picks Light, Dark or System, Then the whole application changes immediately and the choice persists across reloads; System follows the device setting.
- [x] US4-S4: Given the pincode picker, When the user enters a valid 6-digit pincode, Then it is saved and used for delivery dates across the app; an invalid pincode is rejected with a message.
- [x] US4-S5: Given a guest, When the navbar is shown, Then user-only items (wallet pill, user menu entries) are replaced by Login and Register.
- [x] US4-S6: Given any page in either theme, When it is viewed, Then text is legible and no element retains a fixed light or dark appearance.

## User Story 5 - Cart and Delivery Address Selection (P1)
- [x] US5-S1: Given a cart, When it loads, Then each item shows its details, a quantity stepper and a remove action.
- [x] US5-S2: Given a physical order under 500 rupees, When totals are shown, Then delivery is 49 rupees and the progress bar shows how much more is needed for free delivery.
- [x] US5-S3: Given a physical order of 500 rupees or more, When totals are shown, Then delivery is free and the progress bar shows it as achieved.
- [x] US5-S4: Given a saved default address, When the cart or checkout opens, Then that address is already selected.
- [x] US5-S5: Given no saved address and a physical item, When the user proceeds, Then they must add an address first, through the single address form used throughout the app.
- [x] US5-S6: Given a cart of digital items only, When the user proceeds, Then no address is asked for and no delivery charge applies.
- [x] US5-S7: Given any change to the cart, When totals update, Then all amounts and the points earned hint are the values reported by the server.
- [x] US5-S8: Given an empty cart, When it is opened, Then an empty state links back to browsing.
- [x] US5-S9: Given the cart page, Then no coupon or promo code field is present.

## User Story 6 - Checkout, Payment and Confirmation (P1)
- [x] US6-S1: Given the checkout page, When it loads, Then the six payment tabs are shown and the payable amount is displayed.
- [x] US6-S2: Given a card tab, When the user submits with invalid fields, Then submission is blocked and field errors are shown.
- [x] US6-S3: Given the UPI tab, When the UPI ID is malformed, Then submission is blocked with a message.
- [x] US6-S4: Given the Net Banking tab, When no bank is selected, Then submission is blocked.
- [x] US6-S5: Given the Wallet tab, When it is shown, Then it offers only the Book Haven Wallet with current balance.
- [x] US6-S6: Given a wallet balance lower than payable amount, When paying by wallet, Then payment is refused with insufficient balance message.
- [x] US6-S7: Given an order containing an eBook or audiobook, When tabs are shown, Then Cash on Delivery is disabled with explanation.
- [x] US6-S8: Given a gift point balance, When redeeming points, Then payable amount reduces by points/10, and redeeming above balance is refused.
- [x] US6-S9: Given a successful payment, When it completes, Then order is confirmed, cart cleared, confirmation page shown with delivery date and Continue Shopping.
- [x] US6-S10: Given confirmation, When points are shown as earned, Then value is server-reported (1 point per 10 rupees).
- [x] US6-S11: Given a failed payment, When failure occurs, Then stock and redeemed points are restored and retry is offered.
- [x] US6-S12: Given payment and confirmation pages, When viewed in Light or Dark, Then both respect theme.
- [x] US6-S13: Given payment page, Then no promo code field is present.

## User Story 7 - Order History, Tracking and Buy Again (P1)
- [x] US7-S1: Given a user with orders, When My Orders opens, Then orders are listed newest first with tracker (Confirmed, Processing, Shipped, Delivered, or Cancelled). Pending/Failed orders are excluded.
- [x] US7-S2: Given an order, When opened, Then items, quantities, prices, delivery charge, points, payment method, address, status, and dates are shown.
- [x] US7-S3: Given a past order, When pressing Buy Again, Then available items are added to cart and unavailable items are named in a message.
- [x] US7-S4: Given a user with no orders, When My Orders opens, Then an empty state links to browsing.
- [x] US7-S5: Given another user's order identifier, When requested, Then it is not shown (404/not found state).

## User Story 8 - Cancel an Order (P1)
- [x] US8-S1: Given an order placed less than 48 hours ago in cancellable status, When viewed, Then Cancel option is visible.
- [x] US8-S2: Given an order placed 48 hours or more ago, When viewed, Then no Cancel option is shown, and cancellation is rejected by server.
- [x] US8-S3: Given cancel flow, When items and reason are chosen, Then preview shows fee tier, fee, refund, and points restored before confirmation.
- [x] US8-S4: Given status Confirmed, Processing, or Shipped, When previewing, Then fee is 0%, 10%, or 20% respectively.
- [x] US8-S5: Given Delivered or Cancelled order, When viewed, Then it cannot be cancelled.
- [x] US8-S6: Given refund to wallet, When cancellation confirmed, Then wallet is credited immediately.
- [x] US8-S7: Given refund to bank, When details entered, Then validated, refund initiated, and account masked.
- [x] US8-S8: Given redeemed points, When cancelled, Then points restored proportionally.
- [x] US8-S9: Given digital-only order, When viewed, Then no Cancel option is offered.
- [x] US8-S10: Given mixed order, When cancelling, Then only physical items can be selected.
- [x] US8-S11: Given partial cancellation, When completed, Then cancelled items are shown and order remains active for remaining items.
