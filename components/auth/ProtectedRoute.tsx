"use client";

import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth(requireAuth);

  if (isLoading) {
    return <Loading message="Authenticating..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return null; // useAuth will handle redirect
  }

  return <>{children}</>;
}