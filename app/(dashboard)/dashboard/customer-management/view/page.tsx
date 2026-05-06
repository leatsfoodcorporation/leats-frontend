import { redirect } from "next/navigation";

/**
 * This page handles requests to /dashboard/customer-management/view without a customerId
 * It redirects to the main customer management page
 * 
 * This prevents 404 errors from Next.js prefetching dynamic routes
 */
export default function ViewPage() {
  redirect("/dashboard/customer-management");
}
