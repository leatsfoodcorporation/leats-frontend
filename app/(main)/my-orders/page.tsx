import MyOrdersClient from '@/components/orders/MyOrdersClient';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/my-orders",
    defaultTitle: "My Orders | Leats",
    defaultDescription: "View and track your orders. Check order status, delivery details, and order history.",
    defaultKeywords: "my orders, order history, track order, order status, delivery tracking",
  });
}

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
