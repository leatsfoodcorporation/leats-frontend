import { redirect } from "next/navigation";

export default function FinancesPage() {
  // Redirect to sales page by default
  redirect("/dashboard/finances/sales");
}
