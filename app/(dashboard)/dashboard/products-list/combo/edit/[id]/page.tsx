import {ComboProductForm} from "@/components/Dashboard/products/combo/combo-product-form";

export default async function EditComboProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="p-5">
      <ComboProductForm productId={id} />
    </div>
  );
}
