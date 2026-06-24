"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CateringServicesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/enquiries?tab=catering-services");
  }, [router]);
  return null;
}
