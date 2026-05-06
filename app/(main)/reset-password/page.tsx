import ResetPasswordComponent from "@/components/Home/reset-password/reset-password";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/reset-password",
    defaultTitle: "Reset Password | Leats",
    defaultDescription: "Create a new password for your Leats account.",
    defaultKeywords: "reset password, new password, change password, password reset",
  });
}

export default function ResetPassword() {
  return <ResetPasswordComponent />;
}