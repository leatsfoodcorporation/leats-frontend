"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Dashboard/sidebar/app-sidebar";
import { DashboardNavbar } from "@/components/Dashboard/sidebarNavbar/dashboard-navbar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import axiosInstance from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { getPagePermission } from "@/lib/pagePermissions";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Check authentication
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        router.replace("/signin");
        return;
      }

      try {
        // Validate token expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("fcm_token"); // ✅ Clear FCM token on expiry
          router.replace("/signin");
          return;
        }

        const userData = JSON.parse(userStr);

        // For admin users, fetch fresh data from server to check onboarding status
        if (userData.role === "admin") {
          try {
            const response = await axiosInstance.get("/api/auth/admin/me");
            
            if (response.data.success) {
              const serverUserData = response.data.data;
              
              // Update localStorage with fresh data
              const updatedUser = {
                ...userData,
                onboardingCompleted: serverUserData.onboardingCompleted,
                name: serverUserData.name,
                phoneNumber: serverUserData.phoneNumber,
                companyName: serverUserData.companyName,
              };
              localStorage.setItem("user", JSON.stringify(updatedUser));

              // Check if admin needs onboarding (skip if already on onboarding page)
              if (!serverUserData.onboardingCompleted && pathname !== "/onboarding") {
                router.replace("/onboarding");
                return;
              }

              // If on onboarding page but already completed, redirect to dashboard
              if (serverUserData.onboardingCompleted && pathname === "/onboarding") {
                router.replace("/dashboard");
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching admin profile:", error);
            // If API fails, fall back to localStorage data
            if (!userData.onboardingCompleted && pathname !== "/onboarding") {
              router.replace("/onboarding");
              return;
            }
          }
        }

        setIsCheckingAuth(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("fcm_token"); // ✅ Clear FCM token on error
        router.replace("/signin");
        return;
      }
    };

    checkAuthAndOnboarding();
  }, [router, pathname]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If on onboarding page, render without sidebar/navbar
  if (pathname === "/onboarding") {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardNavbar />

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <PagePermissionGate pathname={pathname}>
              {children}
            </PagePermissionGate>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}

// Page-level permission gate — blocks unauthorized access for employees
function PagePermissionGate({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const { hasPermission, isFullAccess } = usePermissions();
  const { isLoading } = useAuth(false);

  // While auth is loading, show nothing (prevents child useEffects from firing with no permissions)
  if (isLoading) return null;

  // Admin = full access, skip check
  if (isFullAccess()) return <>{children}</>;

  // Check if current page requires permission
  const pagePerm = getPagePermission(pathname);

  // No permission required for this page
  if (!pagePerm) return <>{children}</>;

  // Check if employee has the required permission — render children ONLY if permitted
  if (hasPermission(pagePerm.module, pagePerm.action)) return <>{children}</>;

  // Permission denied — children are NOT rendered, so no useEffects fire, no API calls
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border p-8 sm:p-12 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You don&apos;t have permission to view this page. Please contact your administrator to request access.
        </p>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
      </div>
    </div>
  );
}
