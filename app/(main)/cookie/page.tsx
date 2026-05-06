import { PolicyPage } from "@/components/policies/policy-page";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/cookie",
    defaultTitle: "Cookie Policy | Leats",
    defaultDescription: "Learn about how we use cookies and tracking technologies on our website.",
    defaultKeywords: "cookie policy, cookies, tracking, privacy, website cookies",
  });
}

export default function CookiePolicyPage() {
  return <PolicyPage slug="cookie-policy" defaultTitle="Cookie Policy" />;
}
