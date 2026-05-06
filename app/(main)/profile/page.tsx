"use client";

import { UserProfile } from "@/components/auth/user-profile";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { isLoading } = useAuth(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings, preferences, and view your activity
          </p>
        </div>
        
        <UserProfile />
      </div>
    </div>
  );
}