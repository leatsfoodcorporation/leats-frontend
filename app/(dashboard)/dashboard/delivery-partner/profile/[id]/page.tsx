"use client";

import { use } from "react";
import ManageProfile from "@/components/Dashboard/delivery-partner/manage-profile/manage-profile";

export default function DeliveryPartnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ManageProfile partnerId={id} />;
}
