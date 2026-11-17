# Coverage Matrix

Maps every item of `reference/projectA-backend-checklist.md` to a phase, a test and the
`contracts/openapi.yaml` operation. **Tier 2 rows are required** and built only after the Tier 1
verification gate (spec SC-011). Task IDs are assigned by `/speckit-tasks`; this matrix is its input.

Phases: **P1** backend foundation, **P2** catalogue/cart/addresses, **P3** checkout/orders,
**P4-P7** frontend, **P8** Tier 2 extras (required), **P9** polish.

Test names are `Class#method` targets. `IT` = integration test (MockMvc on `books_test`), `UT` = unit
test, `CT` = contract test.

## 1. Conventions

| Checklist item | Phase | Test | Status (2026-11-14) |
|---|---|---|---|
| Base path `/api`, stateless JWT, BCrypt | P1 | `SecurityIT#protectedRouteWithoutTokenIs401`, `PasswordHashingUT#storesBCryptNotPlaintext` | Passing |
| Response envelope on every JSON response | P1 | `ResponseEnvelopeIT#successAndErrorsUseEnvelope` | Passing |
| Stable error codes (`ErrorCode`) | P1 | `OpenApiContractTest#errorCodesInCodeMatchSpec` (CT) | Passing |
| One validation status, 400 (decision made) | P1 | `ValidationStatusIT#everyValidationFailureIs400WithFieldErrors`, `OpenApiContractTest#no422Documented` | Passing |
| Unexpected errors: 500, fixed message | P1 | `GlobalExceptionHandlerIT#unexpectedErrorHidesDetails` | Passing |
| Users reach only their own data | P2, P3 | `OwnershipIT#*` (addresses, cart, orders, wallet) | NOT COVERED: named test does not exist |
| Public vs JWT routes | P1 | `SecurityIT#publicRoutesNeedNoToken`, `SecurityIT#everyOtherRouteNeedsToken` | Passing |
| UUID ids, `BigDecimal` money, INR | P1 | `MoneyUT#roundsHalfUpToTwoDecimals` | Passing |

## 2. Endpoints (47 in checklist, plus 5 added for the spec)

| Tier | Method and path | Operation | Phase | Test | Status (2026-11-14) |
|---|---|---|---|---|---|
| 1 | POST `/api/auth/login` | login | P1 | `AuthIT#loginOk`, `#wrongPassword401GenericMessage` | Passing |
| 1 | POST `/api/auth/logout` | logout | P1 | `AuthIT#logoutIsPublicAndOk` | Passing |
| 1 | GET `/api/auth/me` | me | P1 | `AuthIT#meReturnsPointsAndWallet` | Passing |
| 2 | GET `/api/auth/points-history` | pointsHistory | P8 | `PointsHistoryIT#listsEarnedRedeemedRestored` | NOT COVERED: named test does not exist |
| 1 | POST `/api/auth/register` | register | P1 | `AuthIT#registerOk`, `#duplicateEmail409`, `#shortPassword400` | Passing |
| 1 | GET `/api/brands` | listBrands | P2 | `CatalogIT#brandsListed` | NOT COVERED: named test does not exist |
| 1 | GET `/api/brands/{slug}/products` | listBrandBooks | P2 | `CatalogIT#brandBooksFiltered` | NOT COVERED: named test does not exist |
| 1 | GET `/api/categories` | listCategories | P2 | `CatalogIT#categoriesSeeded` | NOT COVERED: named test does not exist |
| 1 | GET `/api/categories/{slug}/products` | listCategoryBooks | P2 | `CatalogIT#categoryBooksPaged` | NOT COVERED: named test does not exist |
| 1 | GET `/api/products` | listBooks | P2 | `CatalogIT#filtersSortSearchPagination` | NOT COVERED: named test does not exist |
| 1 | GET `/api/products/{id}` | getBook | P2 | `CatalogIT#detailHasDeliveryDateSoldCountWriter` | NOT COVERED: named test does not exist |
| 1 | GET `/api/products/{id}/related` | relatedBooks | P2 | `RecommendationServiceUT#relatedSameAuthorThenCategory` | NOT COVERED: named test does not exist |
| 2 | GET `/api/products/{id}/reviews` | listReviews | P8 | `ReviewIT#listed` | NOT COVERED: named test does not exist |
| 2 | POST `/api/products/{id}/reviews` | createReview | P8 | `ReviewIT#oneReviewPerBook`, `#bodyOver100Is400` | NOT COVERED: named test does not exist |
| 1 | GET `/api/recommendations` | recommendations | P2 | `RecommendationServiceUT#fromOrdersAndWishlistElseTopSellers` | NOT COVERED: named test does not exist |
| 1 | DELETE `/api/cart` | clearCart | P2 | `CartIT#clear` | NOT COVERED: named test does not exist |
| 1 | GET `/api/cart` | getCart | P2 | `CartIT#totalsShippingAndPointsHint` | NOT COVERED: named test does not exist |
| 1 | POST `/api/cart/items` | addCartItem | P2 | `CartIT#addLimitedByStock`, `#guestIs401` | NOT COVERED: named test does not exist |
| 1 | DELETE `/api/cart/items/{id}` | removeCartItem | P2 | `CartIT#removeItem` | NOT COVERED: named test does not exist |
| 1 | PATCH `/api/cart/items/{id}` | updateCartItem | P2 | `CartIT#quantityZeroRemoves` | NOT COVERED: named test does not exist |
| 1 | GET `/api/addresses` | listAddresses | P2 | `AddressIT#defaultFirst` | NOT COVERED: named test does not exist |
| 1 | POST `/api/addresses` | createAddress | P2 | `AddressIT#firstBecomesDefault`, `#badPincode400` | Passing (test lives in another class) |
| 1 | DELETE `/api/addresses/{id}` | deleteAddress | P2 | `AddressIT#softDeleteKeepsOrderSnapshot` | NOT COVERED: named test does not exist |
| 1 | PATCH `/api/addresses/{id}` | updateAddress | P2 | `AddressIT#newDefaultClearsOld` | Passing (test lives in another class) |
| 1 | POST `/api/checkout/apply-points` | applyPoints | P3 | `CheckoutIT#pointsOverBalance400`, `PricingUT#tenPointsOneRupee` | NOT COVERED: named test does not exist |
| 1 | POST `/api/checkout/confirm-payment` | confirmPayment | P3 | `CheckoutIT#eachPaymentMethod`, `#pointsEarnedFromServer`, `#idempotent` | NOT COVERED: named test does not exist |
| 1 | POST `/api/checkout/fail-payment` | failPayment | P3 | `CheckoutIT#failReleasesStockAndPoints` | NOT COVERED: named test does not exist |
| 1 | POST `/api/checkout/order` | createOrder | P3 | `CheckoutIT#reservesStockDeductsPointsPending`, `#duplicateKeySameOrder` | NOT COVERED: named test does not exist |
| 1 | POST `/api/checkout/validate` | validateCheckout | P3 | `CheckoutIT#emptyCart409` | NOT COVERED: named test does not exist |
| 1 | GET `/api/orders` | listOrders | P3 | `OrderIT#newestFirstConfirmedOnly` | NOT COVERED: named test does not exist |
| 1 | GET `/api/orders/{id}` | getOrder | P3 | `OrderIT#otherMembersOrderIs404` | NOT COVERED: named test does not exist |
| 1 | POST `/api/orders/{id}/buy-again` | buyAgain | P3 | `OrderIT#buyAgainReportsUnavailable` | NOT COVERED: named test does not exist |
| 1 | POST `/api/orders/{id}/cancel` | cancelOrder | P3 | `CancellationIT#*` (see section 4) | NOT COVERED: named test does not exist |
| 1 | GET `/api/orders/{id}/cancel-preview` | cancelPreview | P3 | `CancellationIT#previewMatchesCancel` | NOT COVERED: named test does not exist |
| 2 | GET `/api/authors/{slug}` | getAuthor (by slug) | P8 | `AuthorIT#profileWithBooks` | NOT COVERED: named test does not exist |
| 2 | GET `/api/following` | listFollowing | P8 | `AuthorIT#followList` | NOT COVERED: named test does not exist |
| 2 | POST `/api/following` | followAuthor | P8 | `AuthorIT#follow` | NOT COVERED: named test does not exist |
| 2 | DELETE `/api/following/{slug}` | unfollowAuthor (by slug) | P8 | `AuthorIT#unfollow` | NOT COVERED: named test does not exist |
| 2 | GET `/api/library` | listLibrary | P8 | `LibraryIT#onlyPurchasedDigital` | NOT COVERED: named test does not exist |
| 2 | GET `/api/library/{bookId}/audio` | streamLibraryAudio | P8 | `LibraryIT#audioRequiresPurchase` | NOT COVERED: named test does not exist |
| 2 | GET `/api/library/{bookId}/content` | readLibraryBook | P8 | `LibraryIT#contentRequiresPurchase` | NOT COVERED: named test does not exist |
| 2 | GET `/api/library/{bookId}/download` | downloadLibraryBook | P8 | `LibraryIT#downloadRequiresPurchase` | NOT COVERED: named test does not exist |
| 2 | GET `/api/wallet` | getWallet | P8 | `WalletIT#balanceAndTransactions` | NOT COVERED: named test does not exist |
| 2 | POST `/api/wallet/topup` | topUpWallet | P8 | `WalletIT#rangeOneToOneLakh`, `#invalidPayment400` | NOT COVERED: named test does not exist |
| 2 | GET `/api/wishlist` | listWishlist | P8 | `WishlistIT#list` | NOT COVERED: named test does not exist |
| 2 | POST `/api/wishlist` | addWishlistItem | P8 | `WishlistIT#addIdempotent` | NOT COVERED: named test does not exist |
| 2 | DELETE `/api/wishlist/{bookId}` | removeWishlistItem | P8 | `WishlistIT#remove` | NOT COVERED: named test does not exist |
| **added** 1 | POST `/api/products/{id}/notify-me` | notifyMe | P2 | `CatalogIT#notifyOnlyWhenOutOfStock`, `#duplicate409` | NOT COVERED: named test does not exist |
| **added** 1 | GET `/api/delivery/estimate` | estimateDelivery | P2 | `DeliveryEstimatorUT#*`, `CatalogIT#badPincode400` | NOT COVERED: named test does not exist |
| **added** 1 | GET `/api/checkout/banks` | listBanks | P3 | `CheckoutIT#banksFixedList` | NOT COVERED: named test does not exist |
| **added** 2 | GET `/api/authors` | listAuthors | P8 | `AuthorIT#browse` | NOT COVERED: named test does not exist |
| **added** 2 | PATCH `/api/auth/me` | updateProfile | P8 | `ProfileIT#updateName` | NOT COVERED: named test does not exist |

Coverage check: `OpenApiContractTest#everyRouteIsInTheSpecAndViceVersa` proves that code and
`openapi.yaml` list the same 52 routes.

## 3. Entities (17 in checklist)

| Tier | Checklist entity | Book Haven | Phase | Test | Status (2026-11-14) |
|---|---|---|---|---|---|
| 1 | User | `Member` (no role column) | P1 | `MemberRepositoryIT#emailUniqueCaseInsensitive` | Passing |
| 1 | Address | `Address` + order snapshot | P1/P2 | `AddressIT#*` | NOT COVERED: named test does not exist |
| 1 | Category | `Category` | P1 | `SeedDataIT#categoriesPresent` | Passing |
| 1 | Brand | `Brand` | P1 | `SeedDataIT#brandsPresent` | Passing |
| 1 | Product | `Book` (+ `Author` table) | P1 | `SeedDataIT#booksCoverAllFormatsAndLanguages` | Passing |
| 1 | ProductRelation | **dropped**; replaced by the author-then-category rule (research D8) | P2 | `RecommendationServiceUT#*` | Passing |
| 1 | Cart / CartItem | `Cart`, `CartItem` | P1/P2 | `CartIT#*` | NOT COVERED: named test does not exist |
| 1 | Order | `Order` (table `orders`) | P1/P3 | `OrderIT#*` | NOT COVERED: named test does not exist |
| 1 | OrderItem | `OrderItem` | P1/P3 | `OrderIT#*` | NOT COVERED: named test does not exist |
| 1 | Payment | `Payment` | P1/P3 | `CheckoutIT#*` | NOT COVERED: named test does not exist |
| 1 | OrderCancellation | `OrderCancellation` | P1/P3 | `CancellationIT#*` | NOT COVERED: named test does not exist |
| 1 | GiftPointsTransaction | `GiftPointsTransaction` | P1/P3 | `CheckoutIT#pointsLedger` | NOT COVERED: named test does not exist |
| 2 | WalletTransaction | `WalletTransaction` (written in Tier 1 for payment and refund; listing and top-up are Tier 2) | P3/P8 | `CancellationIT#walletRefund`, `WalletIT#*` | NOT COVERED: named test does not exist |
| 2 | WishlistItem | `WishlistItem` | P8 | `WishlistIT#*` | NOT COVERED: named test does not exist |
| 2 | AuthorFollow | `AuthorFollow` | P8 | `AuthorIT#*` | NOT COVERED: named test does not exist |
| 2 | Review | `Review` | P8 | `ReviewIT#*` | NOT COVERED: named test does not exist |
| added 1 | (new) | `StockNotification` | P2 | `CatalogIT#notify*` | NOT COVERED: named test does not exist |

`SchemaIT#flywayMatchesEntities` runs with `ddl-auto=validate`, so entity and migration drift fails
the build.

## 4. Business rules

| Rule | Phase | Test | Status (2026-11-14) |
|---|---|---|---|
| Unit price = price x (1 - discount/100), 2 dp | P2 | `PricingUT#unitPriceRoundsHalfUp` | Passing |
| Shipping 0 if no physical item or subtotal >= 500, else 49 | P2 | `PricingUT#shipping49Under500FreeAtOrAbove`, `CartIT#digitalOnlyNoShipping`, `#mixedCartThresholdUsesPhysicalOnly` | Passing (test lives in another class) |
| 10 points = 1 rupee, not above balance | P3 | `PricingUT#pointsDiscount`, `CheckoutIT#pointsOverBalance400` | NOT COVERED: named test does not exist |
| Total = max(0, subtotal + shipping - discount) | P3 | `PricingUT#totalNeverNegative` | Passing |
| Points earned = floor(total / 10), returned by server | P3 | `PricingUT#pointsEarnedFloor`, `CheckoutIT#pointsEarnedFromServer` | NOT COVERED: named test does not exist |
| Create order reserves stock, deducts points, PENDING | P3 | `CheckoutIT#reservesStockDeductsPointsPending`, `#lastCopyOnlyOneBuyer` | NOT COVERED: named test does not exist |
| Confirm: CONFIRMED, cart cleared, points earned | P3 | `CheckoutIT#confirmClearsCartAwardsPoints` | NOT COVERED: named test does not exist |
| Fail: stock released, points refunded | P3 | `CheckoutIT#failReleasesStockAndPoints` | NOT COVERED: named test does not exist |
| 15-minute expiry releases stock and points | P3 | `OrderExpiryUT#expiresAfterFifteenMinutes`, `CheckoutIT#payExpiredOrder409` | NOT COVERED: named test does not exist |
| Physical needs address; digital does not | P3 | `CheckoutIT#addressRequiredForPhysical`, `#digitalNeedsNoAddress` | NOT COVERED: named test does not exist |
| COD refused when cart has digital | P3 | `CheckoutIT#codBlockedForDigital` | NOT COVERED: named test does not exist |
| Payment details validated server-side (FR-043) | P3 | `PaymentDetailsValidatorUT#*` (each card, UPI, bank, COD cap), `CheckoutIT#invalidPayment400` | NOT COVERED: named test does not exist |
| Card number, CVV, UPI never stored or logged | P3 | `PaymentPrivacyIT#noSensitiveDataInDbOrLogs` | NOT COVERED: named test does not exist |
| Wallet payment needs balance | P3 | `CheckoutIT#walletInsufficient409` | NOT COVERED: named test does not exist |
| Add to cart limited by stock | P2 | `CartIT#addLimitedByStock` | NOT COVERED: named test does not exist |
| Status flow PENDING to DELIVERED or CANCELLED | P3 | `OrderStateUT#legalAndIllegalTransitions` | NOT COVERED: named test does not exist |
| Cancel window open while now < createdAt + 48h (closed at exactly 48h), checked before fee | P3 | `CancellationWindowIT#insideWindowAllowed`, `#oneSecondBeforeBoundaryAllowed`, `#atExactBoundaryRefused`, `#afterWindow409CannotCancel`, `#previewBlockedReason` | NOT COVERED: named test does not exist |
| Fee tiers 0 / 10 / 20 percent; DELIVERED and CANCELLED blocked | P3 | `CancellationIT#feeTiers`, `#deliveredBlocked`, `#alreadyCancelledBlocked` | NOT COVERED: named test does not exist |
| Physical only; partial by item and quantity | P3 | `CancellationIT#digitalNotCancellable`, `#partialByQuantity`, `#overQuantity400` | NOT COVERED: named test does not exist |
| Refund = max(0, value - discountShare - fee) | P3 | `CancellationMathUT#refundFormula` | Passing |
| Points restored = round(used x value / subtotal) | P3 | `CancellationMathUT#pointsRestoredProportional` | Passing |
| Refund to wallet instant, or bank initiated and masked | P3 | `CancellationIT#walletRefundCreditsAtOnce`, `#bankRefundInitiatedMasked`, `#badIfsc400` | NOT COVERED: named test does not exist |
| Cancelled quantity returns to stock | P3 | `CancellationIT#restocks` | NOT COVERED: named test does not exist |
| Buy Again re-adds, reports unavailable | P3 | `OrderIT#buyAgainReportsUnavailable` | NOT COVERED: named test does not exist |
| Recommendations by orders and wishlist; related by author then category | P2 | `RecommendationServiceUT#*` | Passing |
| Product detail: delivery date, sold count | P2 | `CatalogIT#detailHasDeliveryDateSoldCountWriter` | NOT COVERED: named test does not exist |
| Delivery date rule (research D4) | P2 | `DeliveryEstimatorUT#cutoffAfterTwoPm`, `#skipsSunday`, `#metroVsOther`, `#digitalHasNone` | Passing |
| Seed: categories, brands, books always; demo member only in `dev` | P1 | `SeedDataIT#catalogSeededInAnyProfile`, `DevDemoMemberSeederIT#onlyInDevAndOnlyWhenAbsent` | Passing |

## 5. Fixes from the checklist (known defects in A)

| Fix | Phase | Test or check | Status (2026-11-14) |
|---|---|---|---|
| Cancel hidden after 48 hours (server field `cancellable`, UI uses it) | P3, P7 | `CancellationWindowIT#orderDtoCancellableFalseAfterWindow`, `OrderCardTest#noCancelButtonWhenNotCancellable` | NOT COVERED: named test does not exist |
| Points earned from server | P3, P6 | `CheckoutIT#pointsEarnedFromServer`, `ConfirmationPageTest#showsServerPoints` | NOT COVERED: named test does not exist |
| Wallet tab offers Book Haven wallet only | P6 | `PaymentTabsTest#walletTabOnlyBookHavenWallet` | Passing |
| CORS limited to one configured origin | P1 | `CorsIT#allowedOriginOnly`, `#otherOriginRejected` | Passing |
| No committed `.env`, DB password or JWT secret | P1 | `ConfigIT#startupFailsWithoutRequiredEnv`, `scripts/check-secrets.ps1` (CI step) | Passing |
| No password reset on startup; no admin seed | P1 | `DevDemoMemberSeederIT#neverResetsPassword`, `#noAdminAccountExists` | Passing |
| README variable names match the properties file | P9 | `scripts/check-env-docs.ps1` compares both lists | n/a: no test named |
| Contract test keeps code and spec equal | P1 | `OpenApiContractTest#*` | Passing |

## 6. Spec-level checks that are not in the checklist

| Spec item | Phase | Test or check | Status (2026-11-14) |
|---|---|---|---|
| Theme tokens only; no hard-coded colours (FR-071, SC-004) | P4+ | `npm run check:tokens` | n/a: no test named |
| No dead buttons (FR-070) | P4-P7 | `NoDeadButtonsTest` renders each page and asserts every `button` has a handler or `type=submit` | n/a: no test named |
| No promo code field, no language picker (FR-017, FR-035) | P5, P6 | `NoForbiddenControlsTest` | n/a: no test named |
| Default address pre-selected (FR-036) | P6 | `CartPageTest#defaultAddressPreselected` | NOT COVERED: named test does not exist |
| Cart badge shows 9+ (FR-021) | P4 | `NavbarTest#badgeNinePlus` | NOT COVERED: named test does not exist |
| Filters live in the URL (FR-012) | P5 | `HomePageTest#filtersRoundTripThroughUrl` | NOT COVERED: named test does not exist |
| One address form (FR-037) | P6 | `AddressFormTest` is the only form; a grep check fails on a second one | n/a: no test named |
| Client validation mirrors server rules (FR-043) | P6 | `paymentSchema.test` uses the same table of cases as `PaymentDetailsValidatorUT` | n/a: no test named |
| Totals, delivery, points and fees match the server for every order type and payment method (SC-005) | P3 | `OrderTotalsMatrixIT` (3 order types x 6 payment methods, with and without points) | n/a: no test named |
| Every data page has loading, empty and error states (FR-076) | P7, P8 | `PageStatesTest` over the page registry | n/a: no test named |
| Wireframed screens are all present (SC-003) | P9 | `checklists/wireframe-conformance.md`, row by row, no unmarked row | n/a: no test named |
| Login and register have no dead buttons (FR-070) | P5 | `NoDeadButtonsTest` (login, register, home, product) | n/a: no test named |
| Digital-only order is delivered at confirm; library opens at once | P3 | `CheckoutIT#digitalOnlyOrderDeliveredAtConfirm`, `OrderIT#digitalOnlyOrderIsDeliveredAtOnce` | NOT COVERED: named test does not exist |
| Cancel window closed at exactly 48 hours | P3 | `CancellationWindowIT#oneSecondBeforeBoundaryAllowed`, `#atExactBoundaryRefused` | NOT COVERED: named test does not exist |
| Token in memory only, never in browser storage (decision H5) | P4 | `AuthProvider.test.jsx#tokenNotInStorage`, `#logoutClearsToken` | n/a: no test named |
| JWT lifetime 60 minutes; tampered and expired tokens refused | P1 | `JwtServiceTest#issuesTokenWith60MinuteLifetime`, `#rejectsTamperedToken`, `#rejectsExpiredToken` | Passing |
| Structured JSON logs; failed logins and 401/403 logged without secrets | P1 | `LoggingIT#*` | Passing |
| CI, SAST and dependency scan exist | P1 | `.github/workflows/ci.yml` (T026a) | n/a: no test named |
| Services have Mockito unit tests (constitution IV) | P1 to P3 | `AuthServiceTest`, `CatalogServiceTest`, `StockNotificationServiceTest`, `CartServiceTest`, `AddressServiceTest`, `CheckoutServiceTest`, `WalletServiceTest`, `OrderServiceTest`, `CancellationServiceTest` | n/a: no test named |
