"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";

function VerifyPartnerContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your partner account...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage(
            "Invalid verification link. Please check your email and try again."
          );
          return;
        }

        console.log("🔍 Verifying partner email with token...");

        // Using the partner-specific verification endpoint
        const response = await axiosInstance.post("/api/partner/auth/verify-email", {
          token,
        });
        const data = response.data;

        console.log("✅ Partner verification response:", data);

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now login to the partner app.");
        } else {
          setStatus("error");
          setMessage(data.error || "Email verification failed");
        }
      } catch (error: any) {
        console.error("❌ Verification error:", error);
        setStatus("error");
        setMessage(error.response?.data?.error || error.response?.data?.message || "Invalid or expired verification token.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verifying Partner Account"}
            {status === "success" && "Account Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-slate-500 mt-2">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          {status === "loading" && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <span className="text-green-600 text-5xl">✓</span>
                </div>
              </div>
              <p className="text-slate-600">
                Welcome to our delivery team! You can now use your credentials to login to the Delivery Partner mobile app.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-semibold mb-1">Next steps:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Open the Partner Mobile App</li>
                  <li>Login with your Partner ID/Email</li>
                  <li>Complete your onboarding</li>
                </ul>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-red-100 p-4 rounded-full">
                  <span className="text-red-600 text-5xl">!</span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Please contact the administrator or try resending the verification email from the app.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPartnerComponent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyPartnerContent />
    </Suspense>
  );
}
