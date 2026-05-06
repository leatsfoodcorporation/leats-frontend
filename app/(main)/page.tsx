import HeroSection from '@/components/Home/HeroSection';
import PopularProducts from '@/components/Home/PopularProducts';
import DealsSection from '@/components/Home/DealsSection';
import MidBannerCategory from '@/components/Home/MidBannerCategory';
import TrendingProducts from '@/components/Home/TrendingProducts';
import NewArrivalProducts from '@/components/Home/NewArrivalProducts';
import HotDealsProducts from '@/components/Home/HotDealsProducts';
import ComboSection from '@/components/Home/ComboSection';
import DynamicBadgeSection from '@/components/Home/DynamicBadgeSection';
import { Metadata } from 'next';
import { 
  fetchBanners, 
  fetchCategories, 
  fetchHomepageProducts,
  fetchComboHomepageProducts,
  fetchHomepageBadges
} from '@/lib/server-fetch';
import { getPageSEO } from '@/services/online-services/seoService';

// CRITICAL: Force dynamic rendering - NO caching
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Badge interface
interface Badge {
  id: string;
  name: string;
  sortOrder: number;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    console.log('[Home Metadata] Fetching SEO data...');
    
    const seoData = await getPageSEO('/');
    
    if (seoData && seoData.metaTitle) {
      console.log('[Home Metadata] ✅ Using SEO:', seoData.metaTitle);
      
      return {
        title: seoData.metaTitle,
        description: seoData.metaDescription || "Welcome to our online store",
        keywords: seoData.metaKeywords ? seoData.metaKeywords.split(",").map((k: string) => k.trim()) : [],
        openGraph: {
          title: seoData.metaTitle,
          description: seoData.metaDescription || "Welcome to our online store",
          images: seoData.ogImage ? [{ url: seoData.ogImage, width: 1200, height: 630 }] : [],
        },
      };
    }
  } catch (error) {
    console.error('[Home Metadata] Error:', error);
  }

  // Fallback
  console.log('[Home Metadata] Using fallback');
  return {
    title: "Home - ECommerce Store",
    description: "Welcome to our online store. Shop quality products at great prices.",
  };
}

export default async function Home() {
  // Fetch all data in parallel on server-side using server-fetch utilities
  const [banners, categories, homepageBadges, comboProducts] = await Promise.all([
    fetchBanners(),
    fetchCategories(),
    fetchHomepageBadges(),
    fetchComboHomepageProducts({ limit: 6 })
  ]);

  console.log('[Homepage] Fetched badges:', homepageBadges);

  // Map badges by sortOrder for static components
  // sortOrder 0 = New Arrival, 1 = Bestseller, 2 = Trending, 3 = Hot Deal
  const badgesBySortOrder: Record<number, Badge | undefined> = {};
  homepageBadges.forEach((badge: Badge) => {
    badgesBySortOrder[badge.sortOrder] = badge;
  });

  // Get badges for static components (sortOrder 0-3)
  const categoryFilterBadge = badgesBySortOrder[0]; // sortOrder 0 - Shows with category filter
  const badge1 = badgesBySortOrder[1]; // sortOrder 1
  const badge2 = badgesBySortOrder[2]; // sortOrder 2
  const badge3 = badgesBySortOrder[3]; // sortOrder 3

  console.log('[Homepage] Badge mapping:', {
    categoryFilterBadge,
    badge1,
    badge2,
    badge3
  });

  // Filter additional badges (sortOrder >= 4)
  const additionalBadges = homepageBadges.filter((badge: Badge) => 
    badge.sortOrder >= 4
  );

  // Fetch products for enabled static badges
  const [
    categoryFilterProducts,
    badge1Products,
    badge2Products,
    badge3Products
  ] = await Promise.all([
    categoryFilterBadge ? fetchHomepageProducts({ badge: categoryFilterBadge.name, limit: 10 }) : Promise.resolve([]),
    badge1 ? fetchHomepageProducts({ badge: badge1.name, limit: 10 }) : Promise.resolve([]),
    badge2 ? fetchHomepageProducts({ badge: badge2.name, limit: 10 }) : Promise.resolve([]),
    badge3 ? fetchHomepageProducts({ badge: badge3.name, limit: 10 }) : Promise.resolve([])
  ]);

  console.log('[Homepage] Products fetched:', {
    categoryFilterProducts: categoryFilterProducts.length,
    badge1Products: badge1Products.length,
    badge2Products: badge2Products.length,
    badge3Products: badge3Products.length
  });

  // Fetch products for additional badges
  const additionalBadgeProducts = await Promise.all(
    additionalBadges.map((badge: Badge) => 
      fetchHomepageProducts({ badge: badge.name, limit: 10 })
    )
  );

  return (
    <div className="min-h-screen bg-white">
      <HeroSection banners={banners} />
      
      {/* sortOrder 0: Badge with Category Filter (PopularProducts component) */}
      {categoryFilterBadge && (
        <PopularProducts 
          badgeName={categoryFilterBadge.name}
          badgeSubtitle="Most popular products near you"
          initialProducts={categoryFilterProducts} 
          categories={categories} 
        />
      )}

      {/* sortOrder 1: Simple badge section */}
      {badge1 && (
        <NewArrivalProducts 
          badgeName={badge1.name}
          badgeSubtitle="Fresh products just for you"
          products={badge1Products} 
        />
      )}
      
      <DealsSection categories={categories} />

      {/* sortOrder 2: Simple badge section */}
      {badge2 && (
        <TrendingProducts 
          badgeName={badge2.name}
          badgeSubtitle="Best deals with maximum savings"
          products={badge2Products} 
        />
      )}

      {/* sortOrder 3: Simple badge section */}
      {badge3 && (
        <HotDealsProducts 
          badgeName={badge3.name}
          badgeSubtitle="Limited time offers"
          products={badge3Products} 
        />
      )}
      
      <MidBannerCategory />
      <ComboSection products={comboProducts} />

      {/* Dynamic Badge Sections - for badges with sortOrder >= 4 (no category filter) */}
      {additionalBadges.map((badge: Badge, index: number) => (
        <DynamicBadgeSection
          key={badge.id}
          badgeName={badge.name}
          initialProducts={additionalBadgeProducts[index] || []}
          backgroundColor={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        />
      ))}
    </div>
  );
}
