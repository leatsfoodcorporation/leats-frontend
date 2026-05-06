"use client";

import { use } from "react";
import BillsView from "@/components/Dashboard/purchase-orders/bills/bills-view/bills-view";

export default function ViewBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <BillsView billId={id} />;
}
