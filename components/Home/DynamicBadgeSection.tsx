'use client';

import { useState } from 'react';
import Link from 'next/link';
import DynamicProductCard from './DynamicProductCard';
import { getHomepageProducts, type Product } from '@/services/online-services/frontendProductService';

interface Category {
  id: string;
  name: string;
}

interface DynamicBadgeSectionProps {
  badgeName: string;
  badgeSubtitle?: string;
  initialProducts: Product[];
  categories?: Category[]; // Make categories optional
  backgroundColor?: string;
}

// Badge subtitle mapping
const BADGE_SUBTITLES: Record<string, string> = {
  'Bestseller': 'Most popular products near you',
  'Trending': 'Best deals with maximum savings',
  'New Arrival': 'Fresh products just for you',
  'Hot Deal': 'Limited time offers',
  'Limited Stock': 'Grab them before they\'re gone',
  'Sale': 'Special discounts for you',
};

export default function DynamicBadgeSection({ 
  badgeName, 
  badgeSubtitle,
  initialProducts, 
  categories,
  backgroundColor = 'bg-white'
}: DynamicBadgeSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Get subtitle from mapping or use provided subtitle
  const subtitle = badgeSubtitle || BADGE_SUBTITLES[badgeName] || 'Discover amazing products';

  // Fetch products when category changes
  const handleCategoryChange = async (categoryName: string) => {
    setActiveCategory(categoryName);
    setLoading(true);
    
    try {
      const response = await getHomepageProducts({
        badge: badgeName,
        category: categoryName || undefined,
        limit: 10,
      });
      
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no products
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className={`py-4 sm:py-6 md:py-8 ${backgroundColor}`}>
      <div className="container mx-auto px-3 sm:px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{badgeName}</h2>
            <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
          </div>
          <Link 
            href="/products" 
            className="text-[#e63946] font-medium hover:underline text-xs sm:text-sm md:text-base"
          >
            View All →
          </Link>
        </div>

        {/* Category Tabs - Only show if categories are provided */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors active:scale-95 ${
                activeCategory === ''
                  ? 'bg-[#e63946] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.name)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors active:scale-95 ${
                  activeCategory === category.name
                    ? 'bg-[#e63946] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {products.map((product) => (
              <DynamicProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
