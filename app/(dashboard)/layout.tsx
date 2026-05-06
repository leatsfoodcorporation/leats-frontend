import { DashboardLayout } from "@/components/Layouts/dashboardlayout";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminRouteGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminRouteGuard>
  );
}