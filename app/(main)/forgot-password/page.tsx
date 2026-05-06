import ForgotPasswordComponent from "@/components/Home/forgotpassword/forgot-password";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/forgot-password",
    defaultTitle: "Forgot Password | Leats",
    defaultDescription: "Reset your password to regain access to your Leats account.",
    defaultKeywords: "forgot password, reset password, password recovery, account recovery",
  });
}

export default function ForgotPassword() {
  return <ForgotPasswordComponent />;
}