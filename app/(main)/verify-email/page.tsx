import VerifyEmailComponent from "@/components/Home/verify-email/verify-email";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/verify-email",
    defaultTitle: "Verify Email | Leats",
    defaultDescription: "Verify your email address to activate your Leats account.",
    defaultKeywords: "verify email, email verification, activate account, confirm email",
  });
}

export default function VerifyEmail() {
  return <VerifyEmailComponent />;
}