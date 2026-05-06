import CateringServicesList from "@/components/Dashboard/enquiries/catering-services-list";

export default function CateringServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catering Service Enquiries</h1>
        <p className="text-muted-foreground">
          Manage catering service enquiries from customers
        </p>
      </div>

      <CateringServicesList />
    </div>
  );
}
