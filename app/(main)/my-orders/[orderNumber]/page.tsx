import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

export const metadata = {
  title: 'Order Details | Leats',
  description: 'View your order details',
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailsClient orderNumber={orderNumber} />;
}
