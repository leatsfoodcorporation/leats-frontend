"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success("Account deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="mb-6">
              <Image 
                src="/logo.jpeg" 
                alt="LEATS" 
                width={100} 
                height={40} 
                className="mx-auto mb-4"
                priority
              />
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h1>
              <p className="text-gray-600 mb-4">
                The account for <strong>{email}</strong> has been permanently deleted from our system.
              </p>
              <p className="text-sm text-gray-500">
                All associated data including orders, preferences, and personal information has been removed.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 mb-6">
              <p className="font-medium mb-2">Deletion Complete</p>
              <ul className="text-left space-y-1">
                <li>• User account permanently deleted</li>
                <li>• All personal data removed</li>
                <li>• Order history anonymized</li>
                <li>• Confirmation email sent</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact us at{" "}
                <a href="mailto:support@leats.in" className="text-blue-600 hover:underline">
                  support@leats.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <Image 
              src="/logo.jpeg" 
              alt="LEATS" 
              width={100} 
              height={40} 
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete Account</h1>
            <p className="text-gray-600">
              Request permanent deletion of your account and all associated data
            </p>
          </div>

          {/* Warning Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Warning: This action cannot be undone</h3>
                <p className="text-sm text-red-700">
                  Deleting your account will permanently remove all your data, including orders, preferences, and account history.
                </p>
              </div>
            </div>
          </div>

          {/* Delete Form */}
          <form onSubmit={handleDeleteRequest} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your registered email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the email address associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Processing..." : "Submit Deletion Request"}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Data Deletion Policy</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Account deletion requests are processed within 7-14 business days</li>
              <li>• All personal information will be permanently removed</li>
              <li>• Order history and transaction records will be anonymized</li>
              <li>• Some data may be retained for legal compliance purposes</li>
              <li>• You will receive email confirmation once deletion is complete</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{" "}
              <a href="mailto:support@leats.in" className="text-blue-600 hover:underline">
                support@leats.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}