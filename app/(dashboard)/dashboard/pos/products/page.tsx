import { PosProductsList } from "@/components/Dashboard/pos/pos-products-list";

export default function PosProductsPage() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">POS Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your point of sale products (synced from inventory)
          </p>
        </div>
      </div>

      {/* Products List Component */}
      <PosProductsList />
    </div>
  );
}
