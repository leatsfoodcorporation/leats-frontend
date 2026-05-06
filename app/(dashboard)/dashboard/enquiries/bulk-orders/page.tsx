import BulkOrdersList from "@/components/Dashboard/enquiries/bulk-orders-list";

export default function BulkOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Order Enquiries</h1>
        <p className="text-muted-foreground">
          Manage bulk order enquiries from customers
        </p>
      </div>

      <BulkOrdersList />
    </div>
  );
}
