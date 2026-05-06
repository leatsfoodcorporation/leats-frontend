"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ecommerceProductService } from "@/services/online-services/ecommerceProductService";
import { ProductData } from "@/types/product";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Warehouse,
  Eye,
  Tag,
  Calendar,
  Shield,
  Truck,
  Globe,
  FileText,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductViewProps {
  id: string;
}

export function ProductView({ id }: ProductViewProps) {
  const router = useRouter();
  const currencySymbol = useCurrency();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await ecommerceProductService.getProductById(id);

        if (response.success) {
          setProduct(response.data);
        } else {
          toast.error("Product not found");
          router.push("/dashboard/products-list/online");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
        router.push("/dashboard/products-list/online");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  // Reset image index when variant changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariantIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const selectedVariant = product.variants[selectedVariantIndex];
  const mainImage =
    typeof selectedVariant?.variantImages?.[selectedImageIndex] === "string"
      ? selectedVariant.variantImages[selectedImageIndex]
      : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/products-list/online")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {selectedVariant?.displayName ||
                selectedVariant?.variantName ||
                product.brand}
            </h1>
            <p className="text-muted-foreground">
              {product.brand} • {product.shortDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              product.productStatus === "active" ? "default" : "secondary"
            }
          >
            {product.productStatus === "active" ? "Active" : "Draft"}
          </Badge>
          <Button
            onClick={() =>
              router.push(`/dashboard/products-list/online/edit/${id}`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Variants */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main Image */}
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={selectedVariant.variantName}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load image:", mainImage);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-20 w-20 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No image</p>
                  </div>
                )}
              </div>

              {/* Variant Images Thumbnails */}
              {selectedVariant.variantImages &&
                selectedVariant.variantImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {selectedVariant.variantImages.map((img, idx) => {
                      const imgUrl = typeof img === "string" ? img : null;
                      return imgUrl ? (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`aspect-square bg-muted rounded border-2 transition-colors hover:border-primary cursor-pointer overflow-hidden ${
                            selectedImageIndex === idx
                              ? "border-primary"
                              : "border-transparent"
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            alt={`Image ${idx + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Variants Selection */}
          {product.variants.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Variants ({product.variants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedVariantIndex === idx
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{variant.variantName}</p>
                        <p className="text-sm text-muted-foreground">
                          {variant.variantSKU}
                        </p>
                      </div>
                      {variant.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subcategory</p>
                  <p className="font-medium">{product.subCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{product.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">HSN Code</p>
                  <p className="font-medium">{product.hsnCode || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Variant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Variant Details: {selectedVariant.variantName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium font-mono">
                    {selectedVariant.variantSKU}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">HSN</p>
                  <p className="font-medium">
                    {selectedVariant.variantHSN || "N/A"}
                  </p>
                </div>
                {selectedVariant.variantBarcode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Barcode</p>
                    <p className="font-medium font-mono">
                      {selectedVariant.variantBarcode}
                    </p>
                  </div>
                )}
                {selectedVariant.variantColour && (
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">
                      {selectedVariant.variantColour}
                    </p>
                  </div>
                )}
                {selectedVariant.variantSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium">{selectedVariant.variantSize}</p>
                  </div>
                )}
                {selectedVariant.variantMaterial && (
                  <div>
                    <p className="text-sm text-muted-foreground">Material</p>
                    <p className="font-medium">
                      {selectedVariant.variantMaterial}
                    </p>
                  </div>
                )}
              </div>

              {selectedVariant.detailedDescription && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Description
                    </p>
                    <p className="text-sm">
                      {selectedVariant.detailedDescription}
                    </p>
                  </div>
                </>
              )}

              {/* Custom Attributes */}
              {selectedVariant.customAttributes &&
                selectedVariant.customAttributes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Custom Attributes
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedVariant.customAttributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted/50 rounded-lg border"
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {attr.key}
                            </p>
                            <p className="text-sm font-medium">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Tax
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">MRP</p>
                  <p className="text-2xl font-bold">
                    {currencySymbol}
                    {selectedVariant.variantMRP.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                  <p className="text-2xl font-bold text-primary">
                    {currencySymbol}
                    {selectedVariant.variantSellingPrice.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedVariant.discountType === "percent"
                      ? `${selectedVariant.variantDiscount}%`
                      : `${currencySymbol}${selectedVariant.variantDiscount}`}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">GST</p>
                  <p className="text-2xl font-bold">
                    {selectedVariant.variantGST}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Stock Quantity
                  </p>
                  <p className="text-xl font-bold">
                    {selectedVariant.variantStockQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-xl font-bold">
                    {selectedVariant.variantWeight} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedVariant.variantStatus === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedVariant.variantStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.isCODAvailable ? "default" : "secondary"}
                  >
                    {product.isCODAvailable
                      ? "COD Available"
                      : "COD Not Available"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.freeShipping ? "default" : "secondary"}
                  >
                    {product.freeShipping
                      ? "Free Shipping"
                      : `${currencySymbol}${product.shippingCharge} Shipping`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility & SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Visibility & SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Show on Homepage:</span>
                <Badge
                  variant={product.showOnHomepage ? "default" : "secondary"}
                >
                  {product.showOnHomepage ? "Yes" : "No"}
                </Badge>
                {product.showOnHomepage && product.homepageBadge !== "none" && (
                  <Badge variant="outline">{product.homepageBadge}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Show in Products Page:</span>
                <Badge
                  variant={product.showInProductsPage ? "default" : "secondary"}
                >
                  {product.showInProductsPage ? "Yes" : "No"}
                </Badge>
                {product.showInProductsPage &&
                  product.productsPageBadge !== "none" && (
                    <Badge variant="outline">{product.productsPageBadge}</Badge>
                  )}
              </div>
              {product.metaTitle && (
                <div>
                  <p className="text-sm text-muted-foreground">Meta Title</p>
                  <p className="text-sm">{product.metaTitle}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Country of Origin
                  </p>
                  <p className="font-medium">{product.countryOfOrigin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Return Policy</p>
                  <p className="font-medium">
                    {product.returnPolicyApplicable
                      ? `${product.returnWindowDays} days`
                      : "Not Applicable"}
                  </p>
                </div>
              </div>
              {product.warrantyDetails && (
                <div>
                  <p className="text-sm text-muted-foreground">Warranty</p>
                  <p className="text-sm">{product.warrantyDetails}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(product.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(product.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
