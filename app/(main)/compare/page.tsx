import ComparePageClient from '@/components/compare/ComparePageClient';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/compare",
    defaultTitle: "Compare Products | Leats - Fresh Groceries & Daily Essentials",
    defaultDescription: "Compare features, prices, and specifications of different products side by side. Make informed decisions before purchasing.",
    defaultKeywords: "compare products, product comparison, features, prices, specifications",
  });
}

export default function ComparePage() {
  return <ComparePageClient />;
}
