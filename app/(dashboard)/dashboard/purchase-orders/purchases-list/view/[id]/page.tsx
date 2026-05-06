"use client";

import { use } from "react";
import PurchaseView from "@/components/Dashboard/purchase-orders/purchases/purchase-view/purchase-view";

export default function ViewPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <PurchaseView  purchaseOrderId={id}  />;
}
