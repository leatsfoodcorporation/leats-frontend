import CartPageClient from '@/components/cart/CartPageClient';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/cart",
    defaultTitle: "Shopping Cart | Leats - Fresh Groceries & Daily Essentials",
    defaultDescription: "Review your shopping cart and proceed to checkout. Get fresh groceries and daily essentials delivered to your doorstep with fast delivery.",
    defaultKeywords: "shopping cart, checkout, groceries, online shopping, delivery",
  });
}

export default function CartPage() {
  return <CartPageClient />;
}
