import { AppLayout } from "@/components/Layouts/applayout";
import { Toaster } from "@/components/ui/sonner";
import { fetchCategories, fetchWebSettings, fetchCompanySettings, fetchPromotionalCoupons } from "@/lib/server-fetch";

// Force dynamic rendering for all pages in this layout
export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch data for Header and Footer on server-side
  const [categories, webSettings, companySettings, promotionalOffers] = await Promise.all([
    fetchCategories(),
    fetchWebSettings(),
    fetchCompanySettings(),
    fetchPromotionalCoupons(),
  ]);

  return (
    <AppLayout
      categories={categories}
      webSettings={webSettings}
      companySettings={companySettings}
      promotionalOffers={promotionalOffers}
    >
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
      {children}
    </AppLayout>
  )
}
