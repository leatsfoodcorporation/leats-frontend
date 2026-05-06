import { Suspense } from 'react';
import CheckoutPageClient from '@/components/checkout/CheckoutPageClient';
import { generatePageMetadata } from '@/lib/seo';
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/checkout",
    defaultTitle: "Checkout | Leats - Complete Your Order",
    defaultDescription: "Complete your order securely. Add delivery address, select payment method, and place your order.",
    defaultKeywords: "checkout, order, payment, delivery, secure checkout",
  });
}

// Loading fallback for Suspense
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-12 bg-gray-200" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-12 bg-gray-200" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-24 bg-gray-200" />
        </div>

        {/* Progress Steps Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-12 h-12 rounded-full bg-gray-200" />
                  <Skeleton className="h-4 w-24 mt-2 bg-gray-200" />
                </div>
                {index < 2 && <div className="w-24 h-1 mx-4 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <Skeleton className="h-6 w-48 bg-gray-200" />
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg bg-gray-200" />
                <Skeleton className="h-32 w-full rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <Skeleton className="h-6 w-32 bg-gray-200" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageClient />
    </Suspense>
  );
}
