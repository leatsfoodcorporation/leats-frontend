"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getWebSettings } from "@/services/online-services/webSettingsService";

const FALLBACK_FAVICON = "/favicon.ico";

const buildCacheSafeUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl, window.location.origin);
    url.searchParams.set("cb", Date.now().toString());
    return url.toString();
  } catch {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}cb=${Date.now()}`;
  }
};

const applyFavicon = (faviconUrl: string) => {
  const finalUrl = buildCacheSafeUrl(faviconUrl);
  const upsertLink = (
    id: string,
    rel: string,
    href: string,
    type?: string,
    sizes?: string
  ) => {
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
    if (type) link.type = type;
    if (sizes) link.sizes = sizes;
  };

  // Update any existing icon links created by Next/metadata to the same URL.
  document.querySelectorAll('link[rel*="icon"]').forEach((node) => {
    const link = node as HTMLLinkElement;
    link.href = finalUrl;
  });

  // Maintain our own explicit links (safe, no node removals).
  upsertLink("dynamic-favicon-icon", "icon", finalUrl, "image/png");
  upsertLink("dynamic-favicon-shortcut", "shortcut icon", finalUrl, "image/png");
  upsertLink("dynamic-favicon-apple", "apple-touch-icon", finalUrl, "image/png", "180x180");
};

export default function FaviconUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const response = await getWebSettings();

        if (response.success && response.data.faviconUrl) {
          applyFavicon(response.data.faviconUrl);
          console.log("? Favicon loaded from web settings:", response.data.faviconUrl);
        } else {
          applyFavicon(FALLBACK_FAVICON);
          console.log("?? No custom favicon in web settings, using default");
        }
      } catch (error) {
        applyFavicon(FALLBACK_FAVICON);
        console.error("? Error updating favicon:", error);
      }
    };

    updateFavicon();
  }, [pathname]);

  return null;
}
