"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/Dashboard/onboarding/onboarding-form";

export default function OnboardingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication and onboarding status from localStorage
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.replace("/signin");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      
      // If onboarding is already completed, redirect to dashboard
      if (userData.onboardingCompleted) {
        router.replace("/dashboard");
        return;
      }

      // Show onboarding form
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      router.replace("/signin");
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <OnboardingForm />
    </div>
  );
}
