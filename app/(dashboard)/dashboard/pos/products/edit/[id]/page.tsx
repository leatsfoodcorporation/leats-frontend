"use client";

import { useParams } from "next/navigation";
import { PosProductEdit } from "@/components/Dashboard/pos/pos-product-edit";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return <PosProductEdit productId={productId} />;
}
