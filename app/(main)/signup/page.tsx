import { SignUp } from "@/components/Home/signup/signUp";
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/signup",
    defaultTitle: "Sign Up | Leats",
    defaultDescription: "Create your Leats account and start shopping for fresh groceries with fast delivery.",
    defaultKeywords: "sign up, register, create account, new user, registration",
  });
}

export default function SignUpPage() {
  return <SignUp />;
}