"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormState } from "@/types/product";
import { badgeService, Badge } from "@/services/online-services/badgeService";
import { BadgeSelector } from "./badge-selector";
import { Eye, Search, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ecommerceProductService } from "@/services/online-services/ecommerceProductService";
import { Button } from "@/components/ui/button";

interface VisibilitySEOTabProps {
  formData: ProductFormState;
  onChange: (field: keyof ProductFormState, value: unknown) => void;
}

export function VisibilitySEOTab({ formData, onChange }: VisibilitySEOTabProps) {
  const [staticBadges, setStaticBadges] = useState<Badge[]>([]);
  const [customBadges, setCustomBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setIsLoadingBadges(true);
      const response = await badgeService.getAllBadges();
      if (response.success) {
        setStaticBadges(response.data.static);
        setCustomBadges(response.data.custom);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error("Failed to load badges");
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const handleGenerateSEO = async () => {
    // Get product name from the first variant's displayName
    // In online products, the product name is stored in variants
    const firstVariant = formData.variants?.[0];
    const productName = firstVariant?.displayName || firstVariant?.variantName || "";
    
    if (!productName || !productName.trim()) {
      toast.error("Please add a product variant with a display name first");
      return;
    }

    try {
      setIsGeneratingSEO(true);
      const response = await ecommerceProductService.generateSEO({
        productName: productName,
        category: formData.category,
        subCategory: formData.subCategory || "",
        shortDescription: formData.shortDescription || "",
      });

      if (response.success && response.data) {
        const { metaTitle, metaDescription, metaKeywords } = response.data;
        onChange("metaTitle", metaTitle);
        onChange("metaDescription", metaDescription);
        onChange("metaKeywords", metaKeywords);
        toast.success("SEO content generated successfully!");
      }
    } catch (error) {
      console.error("Error auto-generating SEO:", error);
      toast.error("Failed to generate SEO content");
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  // Handler for adding custom badges (only for Products Page)
  const handleAddBadge = async (badgeName: string, sortOrder?: number, enabledForHomepage?: boolean) => {
    if (!badgeName.trim()) return;

    try {
      const response = await badgeService.createBadge(badgeName.trim(), sortOrder, enabledForHomepage);
      
      if (response.success && response.data) {
        const newBadge: Badge = {
          id: response.data.id,
          name: badgeName.trim(),
          isStatic: false,
          sortOrder: response.data.sortOrder,
          enabledForHomepage: response.data.enabledForHomepage,
        };
        setCustomBadges((prev) => [...prev, newBadge]);
        onChange("productsPageBadge", badgeName.trim());
        
        toast.success("Badge created successfully");
        await fetchBadges(); // Refresh badges
      }
    } catch (error) {
      console.error("Error adding badge:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to create badge");
    }
  };

  // Handler for editing badges (both static and custom)
  const handleEditBadge = async (badgeId: string, badgeName: string, sortOrder?: number, enabledForHomepage?: boolean) => {
    if (!badgeName.trim()) return;

    try {
      const response = await badgeService.updateBadge(badgeId, badgeName.trim(), sortOrder, enabledForHomepage, false);
      
      // Check if there's a sortOrder conflict (409 response)
      if (response.conflict && response.requiresConfirmation && response.conflictBadge) {
        const confirmed = window.confirm(
          `Sort order ${sortOrder} is already used by "${response.conflictBadge.name}".\n\n` +
          `Do you want to swap the sort orders?\n\n` +
          `• "${badgeName.trim()}" will use sort order ${sortOrder}\n` +
          `• "${response.conflictBadge.name}" will use the current sort order of this badge`
        );

        if (confirmed) {
          try {
            const swapResponse = await badgeService.updateBadge(badgeId, badgeName.trim(), sortOrder, enabledForHomepage, true);
            if (swapResponse.success) {
              toast.success(swapResponse.message || "Badge updated successfully");
              await fetchBadges();
            }
          } catch (swapError) {
            console.error("Error swapping badges:", swapError);
            toast.error("Failed to swap badge sort orders");
          }
        }
        return;
      }
      
      // No conflict, update successful
      if (response.success) {
        // Update in both static and custom arrays
        setStaticBadges((prev) =>
          prev.map((badge) =>
            badge.id === badgeId
              ? { ...badge, name: badgeName.trim(), sortOrder: sortOrder || badge.sortOrder, enabledForHomepage: enabledForHomepage !== undefined ? enabledForHomepage : badge.enabledForHomepage }
              : badge
          )
        );
        
        setCustomBadges((prev) =>
          prev.map((badge) =>
            badge.id === badgeId
              ? { ...badge, name: badgeName.trim(), sortOrder: sortOrder || badge.sortOrder, enabledForHomepage: enabledForHomepage !== undefined ? enabledForHomepage : badge.enabledForHomepage }
              : badge
          )
        );
        
        toast.success(response.message || "Badge updated successfully");
        await fetchBadges(); // Refresh badges
      }
    } catch (error) {
      // Only actual errors reach here (network errors, etc.)
      console.error("Error editing badge:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to update badge");
    }
  };

  // Handler for toggling homepage visibility
  const handleToggleHomepage = async (badgeId: string, enabled: boolean) => {
    try {
      // Find the badge to get its current name and sortOrder
      const badge = [...staticBadges, ...customBadges].find(b => b.id === badgeId);
      if (!badge) return;

      await badgeService.updateBadge(badgeId, badge.name, badge.sortOrder, enabled);
      
      // Update in both static and custom arrays
      setStaticBadges((prev) =>
        prev.map((b) =>
          b.id === badgeId ? { ...b, enabledForHomepage: enabled } : b
        )
      );
      
      setCustomBadges((prev) =>
        prev.map((b) =>
          b.id === badgeId ? { ...b, enabledForHomepage: enabled } : b
        )
      );
      
      toast.success(enabled ? "Badge enabled for homepage" : "Badge disabled for homepage");
      await fetchBadges(); // Refresh badges
    } catch (error) {
      console.error("Error toggling homepage visibility:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to update badge");
    }
  };

  // Handler for resetting static badges
  const handleResetBadge = async (badgeId: string) => {
    try {
      await badgeService.resetStaticBadge(badgeId);
      
      toast.success("Badge reset to default successfully");
      await fetchBadges(); // Refresh badges
    } catch (error) {
      console.error("Error resetting badge:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to reset badge");
    }
  };

  // Dummy handlers for homepage badge (custom badges disabled)
  const handleHomepageAddBadge = async () => {
    // Custom badge creation disabled for homepage
    toast.error("Custom badge creation is disabled for homepage. Use static badges only.");
  };

  const handleHomepageEditBadge = async () => {
    // Custom badge editing disabled for homepage
    toast.error("Custom badge editing is disabled for homepage.");
  };

  const handleHomepageResetBadge = async () => {
    // Reset disabled for homepage
    toast.error("Badge reset is disabled for homepage.");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Website Visibility & SEO</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          Control how and where your product appears on the website
        </p>
      </div>

      {/* Product Status */}
      <div className="border rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Label htmlFor="productStatus" className="text-sm sm:text-base font-medium">
              Product Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.productStatus}
              onValueChange={(value: "draft" | "active") =>
                onChange("productStatus", value)
              }
            >
              <SelectTrigger id="productStatus" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Draft</span>
                    <span className="text-xs text-muted-foreground">
                      Not visible to customers
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">
                      Visible to customers
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Combo Homepage Visibility - ONLY for combo products */}
      {formData.type === "combo" && (
        <div className="border rounded-lg p-3 sm:p-4 bg-purple-50/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <Label htmlFor="isComboHomePageEnabled" className="text-sm sm:text-base font-medium text-purple-900">
                Show on Home Page (Combo Component)
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Display this combo product in the special Combo section on homepage
              </p>
            </div>
            <Switch
              id="isComboHomePageEnabled"
              checked={formData.isComboHomePageEnabled}
              onCheckedChange={(checked) => onChange("isComboHomePageEnabled", checked)}
              className="flex-shrink-0"
            />
          </div>
        </div>
      )}

      {/* Homepage Visibility */}
      <div className="border rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="showOnHomepage" className="text-sm sm:text-base font-medium">
              Show on Homepage (Regular Sections)
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Display this product in regular homepage sections (Bestseller, Trending, etc.)
            </p>
          </div>
          <Switch
            id="showOnHomepage"
            checked={formData.showOnHomepage}
            onCheckedChange={(checked) => onChange("showOnHomepage", checked)}
            className="flex-shrink-0"
          />
        </div>

        {formData.showOnHomepage && (
          <BadgeSelector
            value={formData.homepageBadge || ""}
            onChange={(value) => onChange("homepageBadge", value)}
            staticBadges={staticBadges.filter(badge => badge.enabledForHomepage)} // Only show enabled badges for homepage
            customBadges={[]} // No custom badges for homepage
            onAddBadge={handleHomepageAddBadge}
            onEditBadge={handleHomepageEditBadge}
            onResetBadge={handleHomepageResetBadge}
            onToggleHomepage={handleToggleHomepage}
            label="Homepage Badge"
            disabled={isLoadingBadges}
            allowCustomBadges={false} // Disable custom badge creation for homepage
            showStaticBadgesHeading={false} // Hide "STATIC BADGES" heading for homepage
          />
        )}
      </div>

      {/* Products Page Visibility */}
      <div className="border rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="showInProductsPage" className="text-sm sm:text-base font-medium">
              Show in Products Page
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Display this product in the products listing page
            </p>
          </div>
          <Switch
            id="showInProductsPage"
            checked={formData.showInProductsPage}
            onCheckedChange={(checked) => onChange("showInProductsPage", checked)}
            className="flex-shrink-0"
          />
        </div>

        {formData.showInProductsPage && (
          <BadgeSelector
            value={formData.productsPageBadge || ""}
            onChange={(value) => onChange("productsPageBadge", value)}
            staticBadges={staticBadges} // Show all static badges for products page
            customBadges={customBadges} // Show all custom badges for products page
            onAddBadge={handleAddBadge}
            onEditBadge={handleEditBadge}
            onResetBadge={handleResetBadge}
            onToggleHomepage={handleToggleHomepage}
            label="Products Page Badge"
            disabled={isLoadingBadges}
            allowCustomBadges={true} // Allow custom badge creation for products page
          />
        )}
      </div>

      {/* SEO Information */}
      <div className="border-t pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-sm sm:text-base font-semibold">SEO Information</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Optimize your product for search engines
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSEO}
            disabled={isGeneratingSEO}
            className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 text-purple-700 font-medium"
          >
            {isGeneratingSEO ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Auto Generate</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Meta Title */}
          <div>
            <Label htmlFor="metaTitle" className="text-sm sm:text-base">Meta Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle || ""}
              onChange={(e) => onChange("metaTitle", e.target.value)}
              placeholder="Enter SEO title"
              className="mt-2 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Recommended: 50-60 characters (Current: {(formData.metaTitle || "").length})
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <Label htmlFor="metaDescription" className="text-sm sm:text-base">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription || ""}
              onChange={(e) => onChange("metaDescription", e.target.value)}
              placeholder="Enter SEO description"
              className="mt-2 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Recommended: 150-160 characters (Current: {(formData.metaDescription || "").length})
            </p>
          </div>

          {/* Meta Keywords */}
          <div>
            <Label htmlFor="metaKeywords" className="text-sm sm:text-base">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={formData.metaKeywords || ""}
              onChange={(e) => onChange("metaKeywords", e.target.value)}
              placeholder="Enter keywords separated by commas"
              className="mt-2 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Separate keywords with commas (e.g., t-shirt, cotton, red)
            </p>
          </div>
        </div>
      </div>

      {/* SEO Preview */}
      {(formData.metaTitle || formData.metaDescription) && (
        <div className="border-t pt-4 sm:pt-6">
          <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Search Engine Preview</h4>
          <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
            <div className="text-blue-600 text-base sm:text-lg font-medium mb-1 break-words">
              {formData.metaTitle || "Product Title"}
            </div>
            <div className="text-green-700 text-xs sm:text-sm mb-2 break-all">
              www.yourstore.com/products/product-name
            </div>
            <div className="text-gray-700 text-xs sm:text-sm break-words">
              {formData.metaDescription || "Product description will appear here..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
