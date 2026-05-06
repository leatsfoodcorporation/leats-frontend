"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { getPageSEO, PageSEO } from "@/services/online-services/seoService";

interface PageSEOComponentProps {
  pagePath: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
}

export const PageSEOComponent = ({
  pagePath,
  defaultTitle = "ECommerce Store",
  defaultDescription = "Your one-stop shop for quality products",
  defaultKeywords = "ecommerce, online shopping, products",
}: PageSEOComponentProps) => {
  const [seoData, setSeoData] = useState<PageSEO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const data = await getPageSEO(pagePath);
        setSeoData(data);
      } catch (error) {
        console.error("Error loading SEO data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSEO();
  }, [pagePath]);

  // Use SEO data if available, otherwise use defaults
  const metaTitle = seoData?.metaTitle || defaultTitle;
  const metaDescription = seoData?.metaDescription || defaultDescription;
  const metaKeywords = seoData?.metaKeywords || defaultKeywords;
  const ogImage = seoData?.ogImage || "/logo.jpeg";

  if (loading) {
    return null; // Don't render anything while loading
  }

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};
