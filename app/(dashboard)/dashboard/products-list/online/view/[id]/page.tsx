import { ProductView } from "@/components/Dashboard/products/online/product-view";

export default async function ViewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductView id={id} />;
}
