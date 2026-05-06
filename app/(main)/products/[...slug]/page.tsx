import { Metadata } from 'next';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { fetchProductById, fetchProducts, fetchFrequentlyBoughtTogether } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const productId = slug[slug.length - 1];
  
  // Fetch product for metadata
  const product = await fetchProductById(productId);
  
  if (!product) {
    return {
      title: 'Product Not Found | Leats',
      description: 'The product you are looking for could not be found.',
    };
  }

  const defaultVariant = product.variants?.find((v: { isDefault?: boolean }) => v.isDefault) || product.variants?.[0];
  const productName = defaultVariant?.displayName || product.shortDescription;
  const productImage = defaultVariant?.variantImages?.[0] || product.thumbnail;
  const productDescription = defaultVariant?.detailedDescription || product.shortDescription || 'View detailed product information and shop online';
  
  // Use product's SEO data if available, otherwise generate default
  const metaTitle = product.metaTitle || `${productName} | Leats - Fresh Groceries & Daily Essentials`;
  const metaDescription = product.metaDescription || productDescription;
  const metaKeywords = product.metaKeywords || `${productName}, ${product.brand}, ${product.category}, online shopping, groceries, buy online`;

  // Build Open Graph metadata - fix image URL construction
  const ogTitle = product.metaTitle || `${productName} | Leats`;
  const ogDescription = product.metaDescription || product.shortDescription;
  
  // Properly construct image URL
  let ogImage: string | undefined;
  if (productImage) {
    if (productImage.startsWith('http')) {
      ogImage = productImage;
    } else {
      // If path starts with /image/, it's already a proxy path from backend
      if (productImage.startsWith('/image/')) {
        ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api${productImage}`;
      } else {
        // Otherwise, construct the full path
        const cleanImagePath = productImage.replace(/^\/+/, '');
        ogImage = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/image/${cleanImagePath}`;
      }
    }
  }

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      images: ogImage ? [{
        url: ogImage,
        width: 800,
        height: 600,
        alt: productName,
      }] : [],
      siteName: 'Leats',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `/products/${slug.join('/')}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const productId = slug[slug.length - 1];
  
  // Fetch product data on server-side
  const product = await fetchProductById(productId);
  
  if (!product) {
    notFound();
  }

  // Fetch related products and frequently bought together in parallel
  const [relatedProductsData, frequentlyBoughtTogetherData] = await Promise.all([
    fetchProducts({ category: product.category, limit: 5 }),
    fetchFrequentlyBoughtTogether(productId),
  ]);

  // Filter out current product from related products
  const relatedProducts = relatedProductsData.data?.filter((p: { id: string }) => p.id !== productId) || [];
  
  return (
    <ProductDetailClient 
      productId={productId}
      initialProduct={product}
      initialRelatedProducts={relatedProducts}
      initialFrequentlyBoughtTogether={frequentlyBoughtTogetherData}
    />
  );
}
