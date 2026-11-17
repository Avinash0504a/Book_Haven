# Tier 2 Verification Checklist (Stories 9 to 14)

Each tick names the automated test that proves the scenario. Frontend tests live under
`frontend/src`; backend tests under `backend/src/test/java`.

## User Story 9 - Wallet Top-up and Gift Points History (P2)
- [x] US9-S1: Given the wallet page, When it opens, Then the balance and transactions are shown, newest first. (`WalletPage.test.jsx#showsBalanceAndTransactions`)
- [x] US9-S2: Given a top-up amount between 1 and 100,000 rupees and valid payment details, When the user submits, Then the balance increases and the navbar pill updates. (`WalletPage.test.jsx#topUpUpdatesPill`, `useWallet.test.jsx`)
- [x] US9-S3: Given an amount outside the range or non-numeric, When submitted, Then it is refused with a message. (`WalletPage.test.jsx#amountOutOfRangeRefused`, `topUpSchema.test.js`)
- [x] US9-S4: Given the gift points page, When it opens, Then each entry shows date, reason and points, and the current balance. (`GiftPointsPage.test.jsx#listsEntriesAndBalance`, `#emptyState`)

## User Story 10 - Wishlist (P2)
- [x] US10-S1: Given a logged-in user, When they press Add to Wishlist, Then the book appears in their wishlist and the control shows its saved state. (`WishlistButton.test.jsx#showsSavedState`, `#toggleCallsApi`)
- [x] US10-S2: Given the wishlist, When the user removes an item, Then it disappears. (`WishlistPage.test.jsx#removeDisappears`)
- [x] US10-S3: Given a guest, When they use the wishlist control, Then they are asked to log in. (`WishlistButton.test.jsx#guestRedirect`)
- [x] US10-S4: Given an empty wishlist, When opened, Then an empty state is shown. (`WishlistPage.test.jsx#emptyState`, `PageStatesTest`)

## User Story 11 - Writers: Browse, Profile and Follow (P2)
- [x] US11-S1: Given a writer link on any tile or page, When followed, Then the writer page shows bio, photo and their books. (`AuthorPage.test.jsx#showsBioPhotoBooks`; links from `BookTile.jsx` and `ProductPage.jsx` go to `/writers/:slug`)
- [x] US11-S2: Given a logged-in user, When they press Follow, Then the writer appears in their Writers list and the button changes to Unfollow. (`FollowButton.test.jsx`, `AuthorPage.test.jsx#followChangesButton`, `WritersPage.test.jsx#listsFollowed`)
- [x] US11-S3: Given a guest, When they press Follow, Then they are asked to log in. (`FollowButton.test.jsx`)

## User Story 12 - Reviews and Ratings (P2)
- [x] US12-S1: Given the product page, When it loads, Then the average rating and reviews are shown. (`ReviewList.test.jsx#showsAverageAndReviews`)
- [x] US12-S2: Given a logged-in user, When they submit a rating and text up to 100 characters, Then the review appears with a live character counter shown while typing. (`ReviewForm.test.jsx#counterShowsWhileTyping`)
- [x] US12-S3: Given a user who already reviewed the book, When they try again, Then the second review is refused with a message. (`ReviewForm.test.jsx#duplicateMessage`)
- [x] US12-S4: Given missing rating or over-length text, When submitted, Then it is blocked with field messages. (`ReviewForm.test.jsx#ratingRequired`, `#over100Blocked`)

## User Story 13 - Digital Library and Reader (P2)
- [x] US13-S1: Given a purchased digital book, When the E-Library opens, Then it is listed. (`LibraryPage.test.jsx#listsPurchased`, `#downloadSendsToken`)
- [x] US13-S2: Given a listed eBook, When the user opens it, Then the reader shows its content. (`ReaderPage.test.jsx#showsChapters`)
- [x] US13-S3: Given a listed audiobook, When the user plays it, Then audio plays with basic controls. (`AudioPlayer.test.jsx#playPauseSeek`)
- [x] US13-S4: Given a book the user has not bought, When its content is requested, Then access is refused. (`ReaderPage.test.jsx#refusedShowsMessage`; server rule in `LibraryService`)
- [x] US13-S5: Given an empty library, When opened, Then an empty state links to digital books. (`LibraryPage.test.jsx#emptyStateLinksToDigital`)

## User Story 14 - Profile, Address Management and Help (P2)
- [x] US14-S1: Given the profile page, When it opens, Then name, email, wallet balance and gift points are shown. (`ProfilePage.test.jsx#showsNameEmailWalletPoints`)
- [x] US14-S2: Given saved addresses, When the user sets one as default, Then the previous default is cleared and the new one is pre-selected in the cart. (`AddressList.test.jsx#setDefaultClearsOld`, `AddressServiceTest#newDefaultClearsOld`)
- [x] US14-S3: Given an address in use by past orders, When it is deleted, Then past orders still show their original address. (`AddressServiceTest#deleteIsSoft`, `AddressList.test.jsx#deleteLeavesNoneSelected`)
- [x] US14-S4: Given an invalid address (e.g. pincode not 6 digits), When submitted, Then field errors are shown and nothing is saved. (`AddressList.test.jsx#invalidPincodeBlocked`)
- [x] US14-S5: Given the Help page, When opened, Then it shows answers to common questions (ordering, payment, cancellation, delivery, digital books). (`HelpPage.test.jsx#showsAllFiveTopics`, `#accordionKeyboardOperable`)

## Not covered by this checklist
- A scripted Light and Dark walk in headless Chrome against the live backend covered cart, checkout (five of the six payment methods; Debit Card shares the card form with Credit Card), cancellation, wallet, wishlist, library and reader, reviews and profile addresses, with no console or HTTP errors (see `clean-checkout.md`). A person still needs to do the keyboard-only walk in `a11y.md`. The dark-class render check in `NoDeadButtonsTest` and `npm run check:tokens` remain as automated checks.
