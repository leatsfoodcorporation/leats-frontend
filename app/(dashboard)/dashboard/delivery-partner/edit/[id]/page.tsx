"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import CreatePartner from "@/components/Dashboard/delivery-partner/create-delivery-partner/create/create-partner";
import { getDeliveryPartnerById, type DeliveryPartner } from "@/services/deliveryPartnerService";
import { toast } from "sonner";

export default function EditDeliveryPartnerPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        const response = await getDeliveryPartnerById(partnerId);
        setPartner(response.data);
      } catch (err: unknown) {
        console.error("Error fetching partner:", err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        toast.error("Failed to load partner details", {
          description: error.response?.data?.message || error.message,
        });
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Partner Not Found</h2>
        <p className="text-muted-foreground">
          The delivery partner you are trying to edit does not exist.
        </p>
        <Button onClick={() => router.push("/dashboard/delivery-partner")}>
          Back to Partners
        </Button>
      </div>
    );
  }

  return (
    <CreatePartner 
      mode="edit" 
      partnerId={partnerId}
      initialData={partner}
    />
  );
}
