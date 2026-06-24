"use client";
import { usePermissions } from "@/hooks/usePermissions";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LogoSettings from "./logo/logo-settings";
import BannerList from "./banner/banner-list";
import { CompanySettings } from "./company/company-settings";
import { PageSEOList } from "./seo/page-seo-list";
import { PolicyEditor } from "./policies/policy-editor";
import  FAQ  from "./faq/faq";
import { useEffect, useState } from "react";

export const WebSettings = () => {
  const { canView } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("logo");

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/web-settings") {
      // Redirect to logo tab by default
      router.replace("/dashboard/web-settings/logo");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "logo");
    }
  }, [pathname, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/web-settings/${value}`);
  };

  return (
    <div className="w-full p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with Tabs */}
        <div className="mb-6 flex items-center gap-5">
          <TabsList className="w-auto">
            {canView("web_logo") && <TabsTrigger value="logo">Logo</TabsTrigger>}
            {canView("web_banner") && <TabsTrigger value="banner">Banner</TabsTrigger>}
            {canView("web_company") && <TabsTrigger value="company">Company</TabsTrigger>}
            {canView("web_seo") && <TabsTrigger value="seo">SEO</TabsTrigger>}
            {canView("web_policies") && <TabsTrigger value="policies">Policies</TabsTrigger>}
            {canView("web_policies") && <TabsTrigger value="faq">FAQ</TabsTrigger>}
          </TabsList>
        </div>

        {/* Tab Contents */}
        {canView("web_logo") && <TabsContent value="logo" className="mt-0 w-full">
          <LogoSettings />
        </TabsContent>}
        {canView("web_banner") && <TabsContent value="banner" className="mt-0 w-full">
          <BannerList />
        </TabsContent>}
        {canView("web_company") && <TabsContent value="company" className="mt-0 w-full">
          <CompanySettings />
        </TabsContent>}
        {canView("web_seo") && <TabsContent value="seo" className="mt-0 w-full">
          <PageSEOList />
        </TabsContent>}
        {canView("web_policies") && <TabsContent value="policies" className="mt-0 w-full">
          <PolicyEditor />
        </TabsContent>}
        {canView("web_policies") && <TabsContent value="faq" className="mt-0 w-full">
          <FAQ />
        </TabsContent>}
      </Tabs>
    </div>
  );
};
