import BulkOrderForm from "@/components/Home/Enquiry/bulk-order";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/bulk-order",
    defaultTitle: "Bulk Order Enquiry - Get Best Wholesale Prices",
    defaultDescription: "Need to order in large quantities? Submit your bulk order enquiry and get the best wholesale prices with flexible delivery options.",
    defaultKeywords: "bulk order, wholesale, large quantity, business order, bulk purchase",
  });
}

export default function BulkOrderPage() {
  return <BulkOrderForm />;
}
