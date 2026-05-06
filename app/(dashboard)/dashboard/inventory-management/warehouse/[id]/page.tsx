import WarehouseView from "@/components/Dashboard/inventory/warehouse/view-warehouse/warehouse-view";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WarehouseDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <WarehouseView warehouseId={id} />;
}
