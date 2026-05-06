import WishlistPageClient from '@/components/wishlist/WishlistPageClient';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/wishlist",
    defaultTitle: "My Wishlist | Leats - Fresh Groceries & Daily Essentials",
    defaultDescription: "View and manage your saved products. Add items from your wishlist to cart and never miss out on your favorite products.",
    defaultKeywords: "wishlist, saved products, favorites, groceries, online shopping",
  });
}

export default function WishlistPage() {
  return <WishlistPageClient />;
}
