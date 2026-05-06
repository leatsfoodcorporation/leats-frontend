import CustomerView from "@/components/Dashboard/customer-management/customer-view";

interface PageProps {
  params: Promise<{
    customerId: string;
  }>;
}

export default async function CustomerViewPage({ params }: PageProps) {
  const { customerId } = await params;

  return <CustomerView customerId={customerId} />;
}
