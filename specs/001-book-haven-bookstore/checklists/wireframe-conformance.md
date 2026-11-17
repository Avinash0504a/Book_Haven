# Wireframe conformance (SC-003, T146a)

Source: seven JPG files in `docs/wireframes`. Method: each wireframe was read and compared with the page source and its tests. Afterwards the app was driven in headless Chrome against the running backend, in both Light and Dark. The walk covered 18 pages (home, catalogue, product, writers, writer, help, login, not-found, wishlist, library, wallet, gift points, profile, orders, empty cart) and one full purchase (register, add to cart, quantity stepper, add address, six payment tabs, invalid card blocked, pay, confirmation, orders list, order detail, cancel preview, cancel confirmed). Every step had no console errors and no HTTP errors. Screenshots were saved outside version control. "Present" means present in the code and covered by the named test or source file; the walked pages above are also confirmed in the browser. A second walk, also in both themes with no console or HTTP errors, covered: wishlist add and remove, wallet top-up by card and by UPI, a Wallet purchase of an eBook, the eBook reader, a review post, COD, UPI and Net Banking purchases of paperbacks, the orders list (four orders), the gift points page with data, and profile address edit and delete. The audiobook player and file download were not walked.

Defects found by the walk and fixed: the cart read flat item fields while the API returns a nested `book`; cart update and remove used the wrong routes; checkout sent `pointsToRedeem` and no `paymentMethod`; order screens read field names the API does not return; and the cancel dialog lost its "Cancellation Processed" result after the order refetch. Each now has a regression test.

Legend: **Present** = element exists. **Different** = exists in another form, or deliberately changed by the spec. **Absent** = not built, reason given.

Spec assumptions that override the wireframes (`spec.md`, Assumptions): the product name is "Book Haven" (wireframes say "Book Worm"); there is no tax line and no coupon box; there are six payment methods (wireframes show four).

## 1. Home

| Element | Status | Note |
|---|---|---|
| Top navigation bar with logo and search | Present | `Navbar.jsx` |
| Left category list | Present | `HomePage.jsx`; filters by category slug. Below the `lg` breakpoint it becomes scrollable pills (FR-017). Browser-checked at 390, 768 and desktop widths. |
| Filter row (search, language, format, price, sort) | Present | `HomePage.jsx`; URL params `category`, `price`, `language`, `format`, `sort`, `search` (`useFilterParams.js`). Browser-checked in Light and Dark. |
| Recommended row | Present | `HomePage.jsx` |
| Bestsellers row | Present | `HomePage.jsx` |
| New Launches row | Present | `HomePage.jsx` |
| Book tile: cover, title, author link, format, price, delivery date | Present | `BookTile.jsx` (`variant="row"`); whole-rupee prices, "Delivery by Mon, 21 Jul" format from `formatDeliveryDate`. Covered by `BookTile.test.jsx` and `format.test.js`. |
| Book tile: short description | Present | `BookSummary.description` added to `contracts/openapi.yaml` and the backend DTO. |
| Book tile: category links | Present | Links to `/?category=<slug>`. |
| Brand name "Book Worm" | Different | Shown as "Book Haven" (spec assumption). |

## 2. Catalogue

| Element | Status | Note |
|---|---|---|
| Category list | Present | `HomePage.jsx` |
| Search, language, format, price, sort controls | Present | `useFilterParams.js` |
| Grid of book tiles | Present | `BookTile.jsx` |
| Empty result state | Present | `PageStatesTest` |

## 3. Cart and product details

| Element | Status | Note |
|---|---|---|
| Breadcrumb (Home / Category / Title) | Present | `ProductPage.jsx`; category link goes to `/?category=<slug>`; asserted in `ProductPage.test.jsx` |
| Cover, title, author link, writer link | Present | `ProductPage.jsx` |
| Rating card | Present | `ProductPage.jsx` |
| Sells (copies sold) card | Present | `ProductPage.jsx`, from `soldCount` |
| Publisher | Present | Read from `brand.name` |
| Price, delivery estimate | Present | `ProductPage.test.jsx` |
| Overview and Description | Present | `ProductPage.test.jsx` |
| Add to cart, wishlist | Present | `WishlistButton` |
| Related Reads | Present | `ProductPage.jsx` |
| About the Writer | Present | `ProductPage.jsx` |
| Reviews list and form | Present | `ReviewForm.test.jsx` |
| "Shopping Cart" heading | Present | `CartPage.jsx` |
| Cart line items with quantity and remove | Present | `CartPage.jsx` |
| "Use Saved Address" checkbox | Different | Replaced by a radio group of saved addresses with an Add New Address dialog (`AddressSelector.jsx`). Default address is pre-selected. |
| Grand Total box: items subtotal, delivery, total | Present | `CartPage.jsx` |
| Tax line | Absent | Spec assumption: no tax line. |
| Coupon box and discount line | Absent | Spec assumption: no coupons. |

## 4. Checkout

| Element | Status | Note |
|---|---|---|
| Delivery address selection | Present | `AddressSelector.jsx` |
| Order summary | Present | `CheckoutPage.jsx` |
| Payable Amount | Present | `CheckoutPage.jsx` |
| Pay Now button | Different | Button reads "Pay ₹<amount>", or "Place Order (COD)" for Cash on Delivery. |

## 5. Payment

| Element | Status | Note |
|---|---|---|
| "Complete Payment" heading | Different | Heading is "Payment Method". |
| Payable Amount | Present | `PaymentTabs.jsx` |
| Credit Card tab | Present | `PaymentTabs.jsx` |
| Debit Card tab | Present | `PaymentTabs.jsx` |
| UPI tab | Present | `PaymentTabs.jsx` |
| Wallet tab | Different | Labelled "Book Haven Wallet"; shows balance and blocks payment when the balance is too low. |
| Net Banking tab | Present | Extra tab required by the spec (six methods). |
| Cash on Delivery tab | Present | Extra tab required by the spec; disabled when the cart has digital items. |
| Card number, name, CVV, expiry fields | Present | `PaymentTabs.jsx` |

## 6. Purchase confirmation

| Element | Status | Note |
|---|---|---|
| Success icon | Present | `ConfirmationPage.jsx` |
| Thank-you message with order number | Present | `ConfirmationPage.jsx` |
| Items list | Present | `ConfirmationPage.jsx` |
| Grand Total Paid | Present | `ConfirmationPage.jsx` |
| Continue Shopping button | Present | `ConfirmationPage.test.jsx` |

## 7. Architecture sheet

Not a screen. It documents the layers (React frontend, Spring Boot backend, PostgreSQL) and is matched by `plan.md` (React 18 and Vite, Spring Boot 4.1.2 on Java 21, PostgreSQL). No UI element to mark.

## Outstanding

- Keyboard-only walk (see `a11y.md`) and a visual comparison by a person against the JPGs; the headless walk checked for errors and content, not pixel fidelity.
- Optional: add description and category links to the book tile. This needs a `description` field in `BookSummary` and a contract change, so it was left out.
