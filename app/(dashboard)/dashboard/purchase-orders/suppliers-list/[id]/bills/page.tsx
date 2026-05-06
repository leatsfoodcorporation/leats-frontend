import SupplierView from "@/components/Dashboard/purchase-orders/suppliers/supplier-view/supplier-view";

export default async function SupplierBillsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return <SupplierView supplierId={id} />;
}
