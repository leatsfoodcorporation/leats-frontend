/**
 * Utility functions for calculating and displaying product discounts
 */

export interface DiscountInfo {
  amount: number; // Discount amount in currency
  percentage: number; // Discount percentage
  type: 'percentage' | 'flat';
  displayText: string; // Formatted display text (e.g., "26% OFF" or "₹9 OFF")
}

/**
 * Calculate discount information for a product variant
 * @param mrp - Maximum Retail Price
 * @param sellingPrice - Actual selling price
 * @param discountType - Type of discount ("percent" or "flat")
 * @param discountValue - Discount value (percentage or flat amount)
 * @param currencySymbol - Currency symbol from admin settings (use useCurrency hook)
 * @returns DiscountInfo object with calculated values
 */
export function calculateDiscount(
  mrp: number,
  sellingPrice: number,
  discountType?: string,
  discountValue?: number,
  currencySymbol?: string
): DiscountInfo {
  // Calculate actual discount amount
  const discountAmount = mrp - sellingPrice;
  
  // Calculate percentage
  const discountPercentage = mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;
  
  // Determine the type - normalize to lowercase and check
  const normalizedType = discountType?.toLowerCase();
  const isFlatDiscount = normalizedType === 'flat';
  
  // For display, use the configured discount value if available
  let displayText = '';
  
  if (isFlatDiscount && discountValue && discountValue > 0) {
    // Flat discount - show the flat amount with currency symbol
    displayText = `${currencySymbol || ''}${discountValue} OFF`;
  } else if (discountPercentage > 0) {
    // Percentage discount - show the calculated percentage
    displayText = `${discountPercentage}% OFF`;
  }
  
  return {
    amount: discountAmount,
    percentage: discountPercentage,
    type: isFlatDiscount ? 'flat' : 'percentage',
    displayText,
  };
}

/**
 * Get discount badge text for a product
 * @param product - Product object
 * @param variantIndex - Index of the variant (optional)
 * @param currencySymbol - Currency symbol from admin settings (use useCurrency hook)
 * @returns Discount display text or empty string
 */
export function getDiscountBadge(
  product: any,
  variantIndex: number = 0,
  currencySymbol?: string
): string {
  const variant = product.variants?.[variantIndex];
  const mrp = variant?.variantMRP || product.defaultMRP;
  const price = variant?.variantSellingPrice || product.defaultSellingPrice;
  
  // Use variant-level discount if available, otherwise use product-level
  const discountType = variant?.discountType || product.discountType;
  const discountValue = variant?.variantDiscount || product.defaultDiscountValue;
  
  const discountInfo = calculateDiscount(mrp, price, discountType, discountValue, currencySymbol);
  
  return discountInfo.displayText;
}
