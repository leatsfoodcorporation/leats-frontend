import { Metadata } from 'next';
import CategoryDetailClient from '@/components/category/CategoryDetailClient';
import { fetchCategoryById, fetchSubcategoryById, fetchProducts, fetchCategories } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const lastSegment = slug[slug.length - 1];
  const isSubcategoryUrl = slug.length >= 3;
  
  let title = 'Category | Leats';
  let description = 'Browse products in this category';
  let keywords = 'category, groceries, fresh products, online shopping, food delivery';
  let ogImage: string | undefined;
  
  try {
    if (isSubcategoryUrl) {
      // Fetch subcategory data for metadata
      const subcategoryId = lastSegment;
      console.log('[Metadata] Fetching subcategory for ID:', subcategoryId);
      
      const subcategory = await fetchSubcategoryById(subcategoryId);
      console.log('[Metadata] Subcategory fetched:', subcategory ? subcategory.name : 'null');
      
      if (subcategory) {
        // Use subcategory's SEO data if available
        title = subcategory.metaTitle || `${subcategory.name} | ${subcategory.categoryName} | Leats`;
        description = subcategory.metaDescription || `Browse ${subcategory.name.toLowerCase()} products in ${subcategory.categoryName.toLowerCase()}. Find quality products at the best prices with fast delivery.`;
        keywords = subcategory.metaKeywords || `${subcategory.name}, ${subcategory.categoryName}, groceries, fresh products, online shopping`;
        
        console.log('[Metadata] Subcategory SEO data:', { title, description, keywords });
        
        // Get subcategory image for Open Graph
        if (subcategory.image) {
          if (subcategory.image.startsWith('http')) {
            ogImage = subcategory.image;
          } else {
            if (subcategory.image.startsWith('/image/')) {
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api${subcategory.image}`;
            } else {
              const cleanImagePath = subcategory.image.replace(/^\/+/, '');
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/image/${cleanImagePath}`;
            }
          }
        } else if (subcategory.categoryImage) {
          // Fallback to category image
          if (subcategory.categoryImage.startsWith('http')) {
            ogImage = subcategory.categoryImage;
          } else {
            if (subcategory.categoryImage.startsWith('/image/')) {
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api${subcategory.categoryImage}`;
            } else {
              const cleanImagePath = subcategory.categoryImage.replace(/^\/+/, '');
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/image/${cleanImagePath}`;
            }
          }
        }
      } else {
        console.log('[Metadata] Subcategory not found for ID:', subcategoryId);
      }
    } else {
      // The lastSegment could be either an ID or a slug (e.g., "chicken")
      // Try to fetch the category - the backend handles both ID and name
      const categoryIdentifier = lastSegment;
      console.log('[Metadata] Fetching category for identifier:', categoryIdentifier);
      
      const category = await fetchCategoryById(categoryIdentifier);
      console.log('[Metadata] Category fetched:', category ? category.name : 'null');
      
      if (category) {
        // Use category's SEO data if available, otherwise generate default
        title = category.metaTitle || `${category.name} | Leats - Fresh Groceries & Daily Essentials`;
        description = category.metaDescription || `Browse ${category.name.toLowerCase()} products. Find fresh groceries and daily essentials at the best prices with fast delivery.`;
        keywords = category.metaKeywords || `${category.name}, groceries, fresh products, online shopping, food delivery`;
        
        console.log('[Metadata] SEO data:', { title, description, keywords });
        
        // Get category image for Open Graph - fix URL construction
        if (category.image) {
          if (category.image.startsWith('http')) {
            ogImage = category.image;
          } else {
            // If path starts with /image/, it's already a proxy path from backend
            if (category.image.startsWith('/image/')) {
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api${category.image}`;
            } else {
              // Otherwise, construct the full path
              const cleanImagePath = category.image.replace(/^\/+/, '');
              ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/image/${cleanImagePath}`;
            }
          }
        }
      } else {
        console.log('[Metadata] Category not found for identifier:', categoryIdentifier);
      }
    }
  } catch (error) {
    console.error('[Metadata] Error generating metadata:', error);
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{
        url: ogImage,
        width: 800,
        height: 600,
        alt: title,
      }] : [],
      siteName: 'Leats',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `/category/${slug.join('/')}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const lastSegment = slug[slug.length - 1];
  const isSubcategoryUrl = slug.length >= 3;
  
  console.log('[CategoryPage] URL slug:', slug);
  console.log('[CategoryPage] Last segment:', lastSegment);
  console.log('[CategoryPage] Is subcategory URL:', isSubcategoryUrl);
  
  // Fetch categories for navigation
  const categories = await fetchCategories();
  
  if (isSubcategoryUrl) {
    const subId = lastSegment;
    
    // Fetch initial products for this subcategory
    const productsData = await fetchProducts({
      subCategory: subId,
      page: 1,
      limit: 15,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    // Fetch brands for this subcategory
    const allProductsForBrands = await fetchProducts({ 
      subCategory: subId, 
      page: 1, 
      limit: 200 
    });
    
    const availableBrands = [...new Set(
      (allProductsForBrands.data || [])
        .filter((p: { brand?: string }) => typeof p.brand === 'string' && p.brand !== 'Combo')
        .map((p: { brand: string }) => p.brand)
    )].sort() as string[];
    
    return (
      <CategoryDetailClient 
        subcategoryId={subId}
        categories={categories}
        initialProducts={productsData.data || []}
        initialPagination={productsData.pagination}
        availableBrands={availableBrands}
      />
    );
  } else {
    // Handle both formats: /category/slug/id and /category/identifier
    const categoryIdentifier = lastSegment;
    
    console.log('[CategoryPage] Fetching category by identifier:', categoryIdentifier);
    
    // Special case: if identifier is "combo-products", redirect to products page with type filter
    if (categoryIdentifier === 'combo-products' || categoryIdentifier.toLowerCase().includes('combo')) {
      console.log('[CategoryPage] Redirecting combo products to /products?type=combo');
      // Return a redirect component or handle differently
      // For now, fetch all products with combo type
      const productsData = await fetchProducts({
        type: 'combo',
        page: 1,
        limit: 15,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      const allProductsForBrands = await fetchProducts({ 
        type: 'combo',
        page: 1, 
        limit: 200 
      });
      
      const availableBrands = [...new Set(
        (allProductsForBrands.data || [])
          .filter((p: { brand?: string }) => typeof p.brand === 'string' && p.brand !== 'Combo')
          .map((p: { brand: string }) => p.brand)
      )].sort() as string[];
      
      // Create a fake category for combo products
      const comboCategory: any = {
        id: 'combo-products',
        name: 'Combo Products',
        slug: 'combo-products',
        metaDescription: 'Browse our combo product deals',
        isActive: true,
        subcategories: [],
        image: undefined,
        metaTitle: undefined,
        metaKeywords: undefined,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return (
        <CategoryDetailClient 
          categoryId="combo-products"
          initialCategory={comboCategory}
          categories={categories}
          initialProducts={productsData.data || []}
          initialPagination={productsData.pagination}
          availableBrands={availableBrands}
        />
      );
    }
    
    // Fetch category data (supports both ID and name)
    let category = await fetchCategoryById(categoryIdentifier);
    
    // If not found by identifier, try to find by matching slug in categories list
    if (!category && slug.length === 1) {
      console.log('[CategoryPage] Category not found by identifier, searching in categories list by slug');
      const matchingCategory = categories.find((cat: { name: string }) => {
        const catSlug = cat.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");
        return catSlug === categoryIdentifier;
      });
      
      if (matchingCategory) {
        console.log('[CategoryPage] Found matching category:', matchingCategory.name);
        category = matchingCategory;
      }
    }
    
    console.log('[CategoryPage] Category fetched:', category ? category.name : 'null');
    
    if (!category) {
      console.error('[CategoryPage] Category not found for identifier:', categoryIdentifier);
      notFound();
    }
    
    // Fetch initial products for this category
    const productsData = await fetchProducts({
      category: category.name,
      page: 1,
      limit: 15,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    console.log('[CategoryPage] Products fetched:', productsData.data?.length || 0);
    
    // Fetch brands for this category
    const allProductsForBrands = await fetchProducts({ 
      category: category.name, 
      page: 1, 
      limit: 200 
    });
    
    const availableBrands = [...new Set(
      (allProductsForBrands.data || [])
        .filter((p: { brand?: string }) => typeof p.brand === 'string' && p.brand !== 'Combo')
        .map((p: { brand: string }) => p.brand)
    )].sort() as string[];
    
    console.log('[CategoryPage] Available brands:', availableBrands);
    
    return (
      <CategoryDetailClient 
        categoryId={category.id}
        initialCategory={category}
        categories={categories}
        initialProducts={productsData.data || []}
        initialPagination={productsData.pagination}
        availableBrands={availableBrands}
      />
    );
  }
}
