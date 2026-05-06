
import { CategoryForm } from "@/components/Dashboard/products/category/category-form"


// app/dashboard/category-list/[id]/page.tsx

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-5">
      <CategoryForm id={id} />
    </div>
  );
}
  
