import { SignIn } from "@/components/Home/signIn/signIn";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/signin",
    defaultTitle: "Sign In | Leats",
    defaultDescription: "Sign in to your Leats account to access your orders, wishlist, and personalized shopping experience.",
    defaultKeywords: "sign in, login, account, user login, customer login",
  });
}

export default function SignInPage() {
  return <SignIn />;
}