import { DashboardLayout } from "@/components/Layouts/dashboardlayout";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";
import { SocketProvider } from "@/components/providers/socket-provider";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminRouteGuard>
      <SocketProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SocketProvider>
    </AdminRouteGuard>
  );
}