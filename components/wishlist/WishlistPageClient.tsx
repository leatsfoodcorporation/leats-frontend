'use client';

import ProductCard from '@/components/Home/ProductCard';
import DynamicProductCard from '@/components/Home/DynamicProductCard';
import { useWishlist } from '@/context/WishlistContext';
import Link from 'next/link';
import { IconHeart, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function WishlistPageClient() {
  const { items, clearWishlist, totalItems, isLoading } = useWishlist();

  // Check if items are from MockData (have 'name' property) or from API (have 'shortDescription')
  const isMockProduct = (product: any) => 'name' in product;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading wishlist...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            My Wishlist ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>
          {totalItems > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconTrash size={16} className="mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-lg p-8 sm:p-12 text-center">
            <IconHeart size={36} className="text-gray-300 mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 mb-4">Save items you love by clicking the heart icon on products</p>
            <Link href="/products" className="inline-block bg-[#E63946] text-white px-5 sm:px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#d62839] transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {items.map((product) => (
              isMockProduct(product) ? (
                <ProductCard key={product.id} product={product as any} />
              ) : (
                <DynamicProductCard key={product.id} product={product as any} />
              )
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
