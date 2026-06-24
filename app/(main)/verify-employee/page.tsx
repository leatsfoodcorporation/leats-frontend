"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employeeService";

export default function VerifyEmployeePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link — no token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await employeeService.verifyEmail(token);
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Email verified successfully! You can now login.");
        } else {
          setStatus("error");
          setMessage("Verification failed. The link may have expired.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.response?.data?.error || "Verification failed. Please try again or contact admin.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#e63946] mx-auto mb-4" />
            <h2 className="text-xl font-bold">Verifying your email...</h2>
            <p className="text-gray-500 mt-2">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700">Email Verified!</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link href="/signin" className="inline-block mt-6 px-6 py-3 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-[#d62839] transition-colors">
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700">Verification Failed</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link href="/signin" className="inline-block mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
