import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { AuthProvider } from "@/components/providers/auth-provider";
import { CompanyProvider } from "@/components/providers/company-provider";
// TODO: Enable real-time socket provider in future
// import { SocketProvider } from "@/components/providers/socket-provider";
import NotificationProviderWrapper from "@/components/NotificationProviderWrapper";
import { Toaster } from "sonner";
import FaviconUpdater from "@/components/FaviconUpdater";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  title: "ECommerce App",
  description: "Modern ecommerce application with authentication",
  icons: {
    // Keep only a simple fallback; runtime updater will inject the dynamic favicon.
    icon: [{ url: '/favicon.ico' }],
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
     
      <body
        className={`${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <FaviconUpdater />
        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* Stripe.js Script */}
        <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />

        <AuthProvider>
          <CompanyProvider>
            {/* TODO: Enable SocketProvider in future for real-time features */}
            {/* <SocketProvider> */}
              <NotificationProviderWrapper>
                {children}
              </NotificationProviderWrapper>
            {/* </SocketProvider> */}
          </CompanyProvider>
        </AuthProvider>

        <Toaster
          position="top-center"
          toastOptions={{
            className: "border border-border shadow-lg rounded-lg text-sm sm:text-base",
            duration: 4000,
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              padding: "12px 16px",
              minWidth: "auto",
              maxWidth: "calc(100vw - 32px)",
              width: "100%",
            },
          }}
          richColors
          expand
          gap={8}
        />
      </body>
    </html>
  );
}
