"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BulkOrdersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/enquiries?tab=bulk-orders");
  }, [router]);
  return null;
}
