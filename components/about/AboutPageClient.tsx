'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { type Category } from '@/services/online-services/frontendCategoryService';
import { generateCategoryUrl } from '@/lib/slugify';

interface AboutPageClientProps {
  initialCategories: Category[];
}

export default function AboutPageClient({ initialCategories }: AboutPageClientProps) {
  const [categories] = useState<Category[]>(initialCategories);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Link href="/" className="text-[#e63946] hover:text-[#c1121f]">Home</Link>
            <span>/</span>
            <span className="text-gray-900">About Us</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Content - About Text */}
          <div className="w-full lg:w-[76%]">
            <div className="prose max-w-none">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">About Us – LEATS Food Corporation</h1>
              
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                LEATS Food Corporation is an e-commerce based food service company established with the aim of delivering fresh and hygienic meat products directly to customers' homes. We provide fresh chicken, mutton, fish, and dry fish through a convenient door delivery service, ensuring quality, cleanliness, and safety in every order.
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-6 sm:mt-8">Our Mission</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                Our mission is to make purchasing fresh meat easier for everyone. In today's busy lifestyle, many people find it difficult to visit markets directly. This is especially true for elderly people, pregnant women, families with small children, and working professionals who may not have the time or ability to go out and buy fresh products. To solve this problem, we focus on home delivery, bringing fresh products directly to your doorstep.
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-6 sm:mt-8">Quality & Hygiene Standards</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                At LEATS Food Corporation, all products are handled with strict hygiene standards. We ensure proper cleaning, cutting, and hygienic packaging, so customers receive fresh and high-quality products every time. Our business operates with the required government certifications and GST registration, ensuring transparency and trust.
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-6 sm:mt-8">Easy Ordering & Payment</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                Our service mainly works through a mobile application, where customers can easily place their orders. We provide a secure payment gateway for safe transactions. Customers pay the original product price, and only a minimal travel or delivery expense is added based on the distance.
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-6 sm:mt-8">Our Goal</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                At LEATS Food Corporation, our goal is simple: to deliver fresh, hygienic, and high-quality meat products directly to your home with convenience, freshness, and trust.
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[24%]">
            <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-4">
              {/* Search Bar */}
              <div className="bg-white border rounded-lg p-3 sm:p-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] text-sm text-gray-600"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#e63946]">
                    <IconSearch size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>


              {/* Categories */}
              <div className="bg-white border rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Categories</h3>
                <div className="w-12 sm:w-16 h-1 bg-[#e63946] mb-4 sm:mb-6"></div>
                
                <div className="space-y-2 sm:space-y-3">
                  {categories.map((category) => (
                    <Link 
                      key={category.id}
                      href={generateCategoryUrl(category)}
                      className="flex items-center justify-between py-1.5 sm:py-2 hover:text-[#e63946] transition group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-sm sm:text-base text-gray-700 group-hover:text-[#e63946]">{category.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Advertisement */}
             
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
