import { Metadata } from "next";
import { getPageSEO } from "@/services/online-services/seoService";

interface GeneratePageMetadataOptions {
  pagePath: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
}

/**
 * Generate metadata for a page using SEO settings from the database
 * This function should be used in page.tsx files with Next.js 13+ App Router
 */
export async function generatePageMetadata({
  pagePath,
  defaultTitle = "ECommerce Store",
  defaultDescription = "Your one-stop shop for quality products",
  defaultKeywords = "ecommerce, online shopping, products",
}: GeneratePageMetadataOptions): Promise<Metadata> {
  try {
    // Fetch SEO data (works in both build-time and runtime)
    const seoData = await getPageSEO(pagePath);

    const title = seoData?.metaTitle || defaultTitle;
    const description = seoData?.metaDescription || defaultDescription;
    const keywords = seoData?.metaKeywords || defaultKeywords;
    const ogImage = seoData?.ogImage || "/logo.jpeg";

    console.log(`[SEO] Generated metadata for ${pagePath}:`, { title, description, hasCustomSEO: !!seoData });

    return {
      title,
      description,
      keywords: keywords.split(",").map((k) => k.trim()),
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
      // Add alternates for better SEO
      alternates: {
        canonical: pagePath === "/" ? undefined : pagePath,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    
    // Return default metadata on error
    return {
      title: defaultTitle,
      description: defaultDescription,
      keywords: defaultKeywords.split(",").map((k) => k.trim()),
    };
  }
}

/**
 * Client-side hook to update document metadata dynamically
 * Use this for client components that need to update SEO
 */
export function usePageSEO(pagePath: string) {
  if (typeof window !== "undefined") {
    getPageSEO(pagePath).then((seoData) => {
      if (seoData) {
        // Update document title
        if (seoData.metaTitle) {
          document.title = seoData.metaTitle;
        }

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && seoData.metaDescription) {
          metaDescription.setAttribute("content", seoData.metaDescription);
        }

        // Update meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && seoData.metaKeywords) {
          metaKeywords.setAttribute("content", seoData.metaKeywords);
        }

        // Update OG image
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && seoData.ogImage) {
          ogImage.setAttribute("content", seoData.ogImage);
        }
      }
    });
  }
}
