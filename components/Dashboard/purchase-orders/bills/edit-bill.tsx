"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BillForm from "./bill-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { billService } from "@/services/billService";
import type { BillFormData } from "./bill-form";

export default function EditBill() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new"; 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<BillFormData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  // Load existing bill data if editing
  useEffect(() => {
    if (!isNew) {
      const loadBill = async () => {
        try {
          setLoading(true);
          const bill = await billService.getById(id);
          setInitialData(bill as BillFormData);
        } catch (error) {
          console.error("Error loading bill:", error);
          toast.error("Failed to load bill data");
          router.push("/dashboard/purchase-orders/bills-list");
        } finally {
          setLoading(false);
        }
      };

      loadBill();
    }
  }, [id, isNew, router]);

  const handleSubmit = async (data: BillFormData) => {
    setIsSubmitting(true);
    try {
      if (isNew) {
        const result = await billService.create(data);
        toast.success(result.message);
      } else {
        const result = await billService.update(id, data);
        toast.success(result.message);
      }

      router.push("/dashboard/purchase-orders/bills-list");
    } catch (error: unknown) {
      console.error("Error saving bill:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to save bill"
          : "Failed to save bill";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }; 

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/purchase-orders/bills-list")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "Create Bill / GRN" : "Edit Bill"}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Record goods received and update inventory"
              : "Edit bill details"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 border rounded-lg bg-card">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading bill data...</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-card">
          <BillForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() =>
              router.push("/dashboard/purchase-orders/bills-list")
            }
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
