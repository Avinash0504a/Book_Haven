import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  MapPin,
  ShoppingCart,
  User,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Wallet,
  Gift,
  Heart,
  BookMarked,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useCart } from '../../features/cart/hooks/useCart.js';
import { usePincode } from '../../providers/PincodeProvider.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { formatRupees } from '../../lib/format.js';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Modal } from '../ui/Modal.jsx';

export function Navbar() {
  const navigate = useNavigate();
  const { member, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { pincode, setPincode, error: pincodeError, clearError } = usePincode();
  const { theme, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [tempPincode, setTempPincode] = useState(pincode);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close the account dropdown on any click outside it, or on Escape.
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handlePincodeSave = (e) => {
    e.preventDefault();
    if (setPincode(tempPincode)) {
      setIsPincodeModalOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-fg shadow-sm">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-text tracking-tight">Book Haven</span>
          </Link>

          {/* Delivery Pincode Trigger */}
          <button
            type="button"
            onClick={() => {
              setTempPincode(pincode);
              clearError();
              setIsPincodeModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted hover:text-text bg-bg border border-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label={`Deliver to pincode ${pincode}`}
          >
            <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Deliver to <span className="font-semibold text-text">{pincode}</span></span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search books, authors, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>
          </form>

          {/* Navigation Links & Actions */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Quick Links */}
            <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted">
              <Link to="/orders" className="px-2.5 py-1.5 rounded-lg hover:text-text hover:bg-bg transition-colors">
                My Orders
              </Link>
              <Link to="/wishlist" className="px-2.5 py-1.5 rounded-lg hover:text-text hover:bg-bg transition-colors">
                Wishlist
              </Link>
              <Link to="/library" className="px-2.5 py-1.5 rounded-lg hover:text-text hover:bg-bg transition-colors">
                E-Library
              </Link>
              <Link to="/writers" className="px-2.5 py-1.5 rounded-lg hover:text-text hover:bg-bg transition-colors">
                Writers
              </Link>
            </div>

            {/* Wallet Pill (When Logged In) */}
            {isAuthenticated && (
              <Link
                to="/wallet"
                className="hidden sm:flex items-center gap-1.5 bg-bg border border-border px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text hover:border-primary transition-colors"
                aria-label={`Wallet balance: ${formatRupees(member?.walletBalance || 0)}`}
              >
                <Wallet className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                <span>{formatRupees(member?.walletBalance || 0)}</span>
              </Link>
            )}

            {/* Cart Button with 9+ Badge */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-text hover:bg-bg border border-border transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 bg-primary text-primary-fg text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow-xs"
                  data-testid="cart-badge"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Account / Auth Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-border hover:bg-bg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-expanded={isUserMenuOpen}
                  aria-label="User account menu"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {member?.fullName ? member.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-text hidden sm:inline-block max-w-[100px] truncate">
                    {member?.fullName}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-text truncate">{member?.fullName}</p>
                      <p className="text-xs text-muted truncate">{member?.email}</p>
                      <div className="mt-2 flex items-center justify-between text-xs bg-bg p-2 rounded-lg border border-border">
                        <span className="flex items-center gap-1 text-muted">
                          <Gift className="w-3.5 h-3.5 text-warning" /> Points
                        </span>
                        <span className="font-semibold text-text">{member?.giftPoints || 0} pts</span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <User className="w-4 h-4 text-muted" /> Profile
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-muted" /> Wallet
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <BookMarked className="w-4 h-4 text-muted" /> My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <Heart className="w-4 h-4 text-muted" /> Wishlist
                    </Link>
                    <Link
                      to="/gift-points"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <Gift className="w-4 h-4 text-muted" /> Gift Points
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text hover:bg-bg transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-muted" /> Help & Support
                    </Link>

                    {/* Theme Toggle in Menu */}
                    <div className="px-4 py-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted">Theme</span>
                      <div className="flex items-center gap-1 bg-bg border border-border rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`p-1 rounded ${theme === 'light' ? 'bg-surface text-primary' : 'text-muted'}`}
                          aria-label="Light theme"
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`p-1 rounded ${theme === 'dark' ? 'bg-surface text-primary' : 'text-muted'}`}
                          aria-label="Dark theme"
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`p-1 rounded ${theme === 'system' ? 'bg-surface text-primary' : 'text-muted'}`}
                          aria-label="System theme"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-muted hover:text-text rounded-lg border border-border"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile Search & Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border space-y-3">
            <form onSubmit={handleSearchSubmit}>
              <Input
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-text hover:bg-bg"
              >
                My Orders
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-text hover:bg-bg"
              >
                Wishlist
              </Link>
              <Link
                to="/library"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-text hover:bg-bg"
              >
                E-Library
              </Link>
              <Link
                to="/writers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-text hover:bg-bg"
              >
                Writers
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pincode Modal */}
      <Modal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        title="Delivery Location"
      >
        <form onSubmit={handlePincodeSave} className="space-y-4">
          <Input
            label="Postal Code (6 digits)"
            placeholder="e.g. 110001"
            value={tempPincode}
            onChange={(e) => setTempPincode(e.target.value)}
            error={pincodeError}
            helperText="Enter your Indian pincode to see accurate delivery estimates and shipping rates."
            maxLength={6}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPincodeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Set Location
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
