import { useState } from 'react';
import { Card } from '../../../components/ui/Card.jsx';

const HELP_TOPICS = [
  {
    id: 'ordering',
    title: 'Ordering & Checkout',
    content: `You can browse books across multiple genres, formats (Hardcover, Paperback, E-Book, Audiobook), and Indian languages.
When you are ready to purchase, proceed to your Cart to select your delivery address and view server-calculated totals.
During checkout, you can redeem your accumulated Gift Points (10 points = ₹1) to receive an instant discount on your order.`
  },
  {
    id: 'payments',
    title: 'Payments & Book Haven Wallet',
    content: `We support six secure payment methods: Credit Card, Debit Card, UPI, Net Banking, Book Haven Wallet, and Cash on Delivery (COD).
Note: Cash on Delivery is disabled for orders containing digital eBooks or audiobooks.
You can top up your Book Haven Wallet with any amount from ₹1 to ₹100,000 for instant one-click checkouts.`
  },
  {
    id: 'cancellation',
    title: 'Order Cancellation & Refund Policy',
    content: `Physical book orders can be cancelled (fully or partially by line item) within 48 hours of placing the order.
Cancellation fee tiers based on order processing status:
• 0% fee (100% refund) when the order is Confirmed before packing.
• 10% cancellation fee when the order is in Processing status.
• 20% cancellation fee once the order has been Shipped.
Delivered orders, already cancelled orders, and digital products (eBooks / audiobooks) cannot be cancelled.
Refunds can be directed immediately to your Book Haven Wallet or to your validated Bank Account.`
  },
  {
    id: 'delivery',
    title: 'Delivery & PIN Code Serviceability',
    content: `Book Haven delivers to all valid 6-digit Indian PIN codes.
Physical orders of ₹500 and above qualify for Free Delivery. For orders below ₹500, a flat delivery fee of ₹49 is applied.
Digital items require no shipping address and incur zero delivery charges.`
  },
  {
    id: 'digital',
    title: 'E-Library & Digital Reading',
    content: `Purchased eBooks and audiobooks are accessible instantly in your E-Library under your account.
You can read eBooks directly in your browser with chapter navigation and customizable font sizes, stream audiobooks with our web player, or download files to your device for offline reading.`
  }
];

export default function HelpPage() {
  const [openTopicId, setOpenTopicId] = useState('cancellation');

  const toggleTopic = (id) => {
    setOpenTopicId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Help & Customer Support</h1>
        <p className="text-muted text-sm mt-1">
          Find answers to frequently asked questions regarding orders, payments, cancellation policies, and digital content.
        </p>
      </div>

      <div className="space-y-4">
        {HELP_TOPICS.map((topic) => {
          const isOpen = openTopicId === topic.id;

          return (
            <Card key={topic.id} className="overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => toggleTopic(topic.id)}
                aria-expanded={isOpen}
                className="w-full p-5 text-left flex items-center justify-between bg-surface hover:bg-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <span className="font-semibold text-base text-text">
                  {topic.title}
                </span>
                <span className="text-xl text-muted font-bold ml-4">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="p-5 pt-0 bg-surface border-t border-border/50 text-sm text-muted whitespace-pre-line leading-relaxed">
                  {topic.content}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
