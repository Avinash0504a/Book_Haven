import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Truck, RotateCcw, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      {/* Value Badges Banner */}
      <div className="border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Truck className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-text">Free Shipping</p>
              <p className="text-xs text-muted">On all orders ₹500 & above</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-text">100% Genuine</p>
              <p className="text-xs text-muted">Direct from publishers</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-text">Easy Cancellation</p>
              <p className="text-xs text-muted">48-hour flexible window</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-text">Gift Points</p>
              <p className="text-xs text-muted">Earn on every purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-fg">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-text">Book Haven</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              India&apos;s premier destination for printed books, e-books, and audiobooks across multiple languages.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link to="/" className="hover:text-text transition-colors">Catalog & Browse</Link></li>
              <li><Link to="/library" className="hover:text-text transition-colors">Digital E-Library</Link></li>
              <li><Link to="/writers" className="hover:text-text transition-colors">Featured Writers</Link></li>
              <li><Link to="/wishlist" className="hover:text-text transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">Account</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link to="/orders" className="hover:text-text transition-colors">My Orders</Link></li>
              <li><Link to="/wallet" className="hover:text-text transition-colors">Book Haven Wallet</Link></li>
              <li><Link to="/profile" className="hover:text-text transition-colors">Profile & Addresses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">Policies & Safety</h4>
            <p className="text-xs text-muted leading-relaxed">
              All transactions are encrypted and secured. Zero sensitive payment numbers are logged or stored.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Book Haven Bookstore. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
