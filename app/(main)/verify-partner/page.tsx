import VerifyPartnerComponent from "@/components/Home/verify-partner/verify-partner";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/verify-partner",
    defaultTitle: "Partner Email Verification | Leats",
    defaultDescription: "Verify your email address to activate your delivery partner account.",
    defaultKeywords: "partner verification, delivery partner, verify email",
  });
}

export default function VerifyPartner() {
  return <VerifyPartnerComponent />;
}
