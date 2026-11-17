import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { HomePage } from './features/catalog/pages/HomePage.jsx';
import { ProductPage } from './features/catalog/pages/ProductPage.jsx';
import { LoginPage } from './features/auth/pages/LoginPage.jsx';
import { RegisterPage } from './features/auth/pages/RegisterPage.jsx';
import { CartPage } from './features/cart/pages/CartPage.jsx';
import { CheckoutPage } from './features/checkout/pages/CheckoutPage.jsx';
import { ConfirmationPage } from './features/checkout/pages/ConfirmationPage.jsx';
import { OrdersPage } from './features/orders/pages/OrdersPage.jsx';
import { OrderDetailPage } from './features/orders/pages/OrderDetailPage.jsx';
import WishlistPage from './features/wishlist/pages/WishlistPage.jsx';
import LibraryPage from './features/library/pages/LibraryPage.jsx';
import ReaderPage from './features/library/pages/ReaderPage.jsx';
import WritersPage from './features/writers/pages/WritersPage.jsx';
import AuthorPage from './features/writers/pages/AuthorPage.jsx';
import WalletPage from './features/wallet/pages/WalletPage.jsx';
import GiftPointsPage from './features/wallet/pages/GiftPointsPage.jsx';
import ProfilePage from './features/profile/pages/ProfilePage.jsx';
import HelpPage from './features/help/pages/HelpPage.jsx';
import { RequireAuth } from './routes/RequireAuth.jsx';

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-bg text-text">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/writers" element={<WritersPage />} />
        <Route path="/writers/:slug" element={<AuthorPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <WishlistPage />
            </RequireAuth>
          }
        />
        <Route
          path="/library"
          element={
            <RequireAuth>
              <LibraryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/library/:bookId/read"
          element={
            <RequireAuth>
              <ReaderPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wallet"
          element={
            <RequireAuth>
              <WalletPage />
            </RequireAuth>
          }
        />
        <Route
          path="/gift-points"
          element={
            <RequireAuth>
              <GiftPointsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout/confirmation"
          element={
            <RequireAuth>
              <ConfirmationPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
