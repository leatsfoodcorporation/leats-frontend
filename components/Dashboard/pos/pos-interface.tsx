"use client";

import React, { useState } from "react";
import { ProductCatalog } from "./product-catalog";
import { CartPanel } from "./cart-panel";
import { CheckoutModal } from "./checkout-modal";
import { PurchaseSuccessModal } from "./purchase-success-modal";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { authService } from "@/services/authService";
import { convertUOMValue } from "@/lib/uom-constants";

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  category?: string;
  sku?: string;
  sellingPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  mrp?: number;
  barcode?: string;
  brand?: string;
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;
  gstPercentage?: number;
  // Multi-UOM fields
  uom?: string;
  baseUom?: string;
  availableUoms?: string[];
  uomLocked?: boolean;
  variantUomValue?: number;
  uomVariants?: Array<{ name: string; uom: string; value: number; price: number; barcode?: string }>;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number;
  discountType?: "percentage" | "flat";
  // Selected UOM for this cart item
  variantUom?: string;
  variantUomValue?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
}

export const POSInterface = () => {
  const productCatalogRef = React.useRef<{ refreshProducts: () => Promise<void> }>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");
  const [currency, setCurrency] = useState<string>("INR");
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState<{
    companyName: string;
    logoUrl: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    gstNumber?: string;
  } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");
  const [lastOrderDate, setLastOrderDate] = useState("");
  const [lastPaymentMethod, setLastPaymentMethod] = useState("Cash");
  const [completedCartItems, setCompletedCartItems] = useState<CartItem[]>([]);
  const [completedCustomer, setCompletedCustomer] = useState<Customer | null>(null);
  const [completedTotals, setCompletedTotals] = useState({ subtotal: 0, total: 0, roundingOff: 0 });
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderDiscountType, setOrderDiscountType] = useState<"percentage" | "flat">("flat");
  
  // Hold orders state
  interface HeldOrder {
    id: string;
    cartItems: CartItem[];
    customer: Customer | null;
    orderDiscount: number;
    orderDiscountType: "percentage" | "flat";
    timestamp: Date;
  }
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);

  // Fetch admin currency and company settings on mount
  React.useEffect(() => {
    const fetchAdminCurrency = async () => {
      try {
        const adminData = await authService.getCurrentAdmin();
        const adminCurrency = adminData.currency || "INR";
        const symbol = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: adminCurrency,
        })
          .formatToParts(0)
          .find((part) => part.type === "currency")?.value || "₹";
        
        setCurrency(adminCurrency);
        setCurrencySymbol(symbol);
      } catch (error) {
        console.error("Error fetching admin currency:", error);
        // Keep defaults
      }
    };
    
    const loadCompanySettings = async () => {
      try {
        // Fetch both web settings (for logo) and admin settings (for company details)
        const [webSettingsResponse, adminResponse] = await Promise.all([
          axiosInstance.get("/api/web/web-settings"),
          axiosInstance.get("/api/auth/admin/settings")
        ]);
        
        if (webSettingsResponse.data.success || adminResponse.data.success) {
          const adminData = adminResponse.data.data || {};
          
          // Combine both settings
          setCompanySettings({
            companyName: adminData.companyName || 'Company',
            logoUrl: webSettingsResponse.data.data?.logoUrl || '',
            address: adminData.address || '',
            city: adminData.city || '',
            state: adminData.state || '',
            zipCode: adminData.zipCode || '',
            country: adminData.country || '',
            phone: '',
            email: '',
            gstNumber: adminData.gstNumber || '',
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    
    fetchAdminCurrency();
    loadCompanySettings();
  }, []);

  // Format currency helper
  const formatCurrency = (amount: number, options?: any): string => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Add product to cart
  const updateUOM = (productId: string, uom: string, value: number) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    // Calculate total required stock across ALL items for this product including this update
    const otherItemsWeight = cartItems
      .filter(i => i.id === productId && i !== item)
      .reduce((sum, i) => {
        const normalizedWeight = convertUOMValue(i.variantUomValue || 1, i.variantUom || i.uom || 'unit', item.baseUom || item.uom || 'unit') || (i.variantUomValue || 1);
        return sum + (i.quantity * normalizedWeight);
      }, 0);
    
    const normalizedNewValue = convertUOMValue(value, uom || 'unit', item.baseUom || item.uom || 'unit') || value;
    const newWeight = (item.quantity * normalizedNewValue) + otherItemsWeight;
    
    if (newWeight > item.stock) {
      toast.error("Insufficient stock for this variant", {
        description: `Total required: ${newWeight.toFixed(3)}${item.baseUom || item.uom || ''}. Available: ${item.stock.toFixed(3)}${item.baseUom || item.uom || ''}`,
      });
      return;
    }

    setCartItems(
      cartItems.map((i) => {
        if (i.id === productId) {
          // Find matching variant price if available
          let newPrice = i.price;
          if (i.uomVariants && Array.isArray(i.uomVariants)) {
            const variant = i.uomVariants.find(v => v.uom.toLowerCase() === uom.toLowerCase() && v.value === value);
            if (variant) {
              newPrice = variant.price;
            }
          }
          return { ...i, variantUom: uom, variantUomValue: value, price: newPrice };
        }
        return i;
      })
    );
  };

  const addToCart = (product: Product, selectedVariant?: any) => {
    if (product.stock <= 0) {
      toast.error("Product out of stock", {
        description: `${product.name} is currently unavailable`,
      });
      return;
    }

    // Determine UOM and Price based on variant if provided, otherwise default
    const uom = selectedVariant ? selectedVariant.uom : (product.baseUom || product.uom);
    const value = selectedVariant ? selectedVariant.value : (product.variantUomValue || 1);
    const price = selectedVariant ? selectedVariant.price : product.price;

    // Calculate total weight for this product currently in cart (normalized to base UOM)
    const currentWeightInCart = cartItems
      .filter(item => item.id === product.id)
      .reduce((sum, item) => {
        const normalizedWeight = convertUOMValue(item.variantUomValue || 1, item.variantUom || item.uom || 'unit', product.baseUom || product.uom || 'unit') || (item.variantUomValue || 1);
        return sum + (item.quantity * normalizedWeight);
      }, 0);

    // Normalize new variant weight to base UOM
    const normalizedNewWeight = convertUOMValue(value, uom || 'unit', product.baseUom || product.uom || 'unit') || value;

    // Check if adding 1 unit of this variant exceeds stock
    if (currentWeightInCart + normalizedNewWeight > product.stock) {
      toast.warning("Cannot add to cart", {
        description: `Insufficient stock for ${product.name}. Required total: ${(currentWeightInCart + normalizedNewWeight).toFixed(3)}${product.baseUom || product.uom || ''}. Available: ${product.stock.toFixed(3)}${product.baseUom || product.uom || ''}.`,
      });
      return;
    }

    const existingItem = cartItems.find((item) => 
      item.id === product.id && 
      item.variantUom?.toLowerCase() === uom?.toLowerCase() &&
      item.variantUomValue === value
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          (item.id === product.id && item.variantUom?.toLowerCase() === uom?.toLowerCase() && item.variantUomValue === value) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      );
      toast.success("Quantity updated", {
        description: `${product.name} (${uom}) quantity increased`,
      });
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity: 1,
          variantUom: uom,
          variantUomValue: value,
          price: price,
        },
      ]);
      toast.success("Added to cart", {
        description: `${product.name} (${uom}) added`,
      });
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cartItems.find((item) => item.id === productId);
    if (!item) return;

    // Calculate total weight across ALL items for this product IF we change this item's quantity
    const otherItemsWeight = cartItems
      .filter(i => i.id === productId && i !== item)
      .reduce((sum, i) => {
        const normalizedWeight = convertUOMValue(i.variantUomValue || 1, i.variantUom || i.uom || 'unit', item.baseUom || item.uom || 'unit') || (i.variantUomValue || 1);
        return sum + (i.quantity * normalizedWeight);
      }, 0);
    
    const normalizedItemValue = convertUOMValue(item.variantUomValue || 1, item.variantUom || item.uom || 'unit', item.baseUom || item.uom || 'unit') || (item.variantUomValue || 1);
    const newWeight = (quantity * normalizedItemValue) + otherItemsWeight;

    if (newWeight > item.stock) {
      toast.warning("Cannot exceed available stock", {
        description: `Required: ${newWeight.toFixed(3)}${item.baseUom || item.uom || ''}, Available: ${item.stock.toFixed(3)}${item.baseUom || item.uom || ''}`,
      });
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  // Apply discount to item
  const applyDiscount = (productId: string, discount: number, discountType: "percentage" | "flat" = "percentage") => {
    setCartItems(
      cartItems.map((item) =>
        item.id === productId ? { ...item, discount, discountType } : item
      )
    );
  };

  // Apply order-level discount
  const applyOrderDiscount = (discount: number, discountType: "percentage" | "flat") => {
    setOrderDiscount(discount);
    setOrderDiscountType(discountType);
  };

  // Hold current order
  const holdOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Cannot hold empty cart");
      return;
    }

    const heldOrder: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      cartItems: [...cartItems],
      customer: selectedCustomer,
      orderDiscount,
      orderDiscountType,
      timestamp: new Date(),
    };

    setHeldOrders([...heldOrders, heldOrder]);
    clearCart();
    toast.success("Order held successfully", {
      description: `Order ${heldOrder.id} saved`,
    });
  };

  // Retrieve held order
  const retrieveOrder = (orderId: string) => {
    const order = heldOrders.find((o) => o.id === orderId);
    if (!order) return;

    setCartItems(order.cartItems);
    setSelectedCustomer(order.customer);
    setOrderDiscount(order.orderDiscount);
    setOrderDiscountType(order.orderDiscountType);
    
    // Remove from held orders
    setHeldOrders(heldOrders.filter((o) => o.id !== orderId));
    setShowHeldOrders(false);
    
    toast.success("Order retrieved", {
      description: `Order ${orderId} loaded`,
    });
  };

  // Delete held order
  const deleteHeldOrder = (orderId: string) => {
    setHeldOrders(heldOrders.filter((o) => o.id !== orderId));
    toast.success("Held order deleted");
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setOrderDiscount(0);
    setOrderDiscountType("flat");
  };

  // Calculate totals
  const calculateTotals = () => {
    // Calculate subtotal with individual item discounts
    const subtotal = cartItems.reduce((sum, item) => {
      const itemPrice = item.price * item.quantity;
      
      // Calculate discount based on type
      let discountAmount = 0;
      if (item.discount && item.discount > 0) {
        if (item.discountType === "flat") {
          discountAmount = item.discount;
        } else {
          // percentage
          discountAmount = (itemPrice * item.discount) / 100;
        }
      }
      
      return sum + (itemPrice - discountAmount);
    }, 0);

    // Apply order-level discount
    let orderDiscountAmount = 0;
    if (orderDiscount > 0) {
      if (orderDiscountType === "flat") {
        orderDiscountAmount = orderDiscount;
      } else {
        // percentage
        orderDiscountAmount = (subtotal * orderDiscount) / 100;
      }
    }

    const total = subtotal - orderDiscountAmount;
    
    // Calculate rounding off to nearest whole number
    const finalTotal = Math.round(total);
    const roundingOff = finalTotal - total;

    return { subtotal, total, totalDiscount: orderDiscountAmount, roundingOff, finalTotal };
  };

  const { subtotal, total, totalDiscount, roundingOff, finalTotal } = calculateTotals();

  const handleCheckoutComplete = async (paymentMethod: string, order: any) => {
    try {
      const invoiceNumber = order.invoiceNumber || "";
      const orderDate = new Date(order.createdAt).toLocaleDateString();

      // Store completed order data
      setLastInvoiceNumber(invoiceNumber);
      setLastOrderDate(orderDate);
      setLastPaymentMethod(paymentMethod);
      setCompletedCartItems([...cartItems]);
      setCompletedCustomer(selectedCustomer);
      setCompletedTotals({ subtotal, total: finalTotal, roundingOff });

      // Clear cart and close checkout
      clearCart();
      setShowCheckout(false);

      // Show success toast
      toast.success("Sale completed successfully", {
        description: `Invoice #${invoiceNumber} - ${formatCurrency(total)}`,
      });

      // Show success modal
      setShowSuccess(true);

      // Refresh product catalog smoothly in background (multiple attempts for Kafka sync)
      refreshProductsWithRetry();
    } catch (error) {
      console.error("Error setting completed order status:", error);
      toast.error("Error displaying success details");
    }
  };

  // Refresh products with retry logic for smooth stock updates
  const refreshProductsWithRetry = async () => {
    const maxAttempts = 5;
    const delayBetweenAttempts = 800; // 800ms between each attempt

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
      
      if (productCatalogRef.current) {
        try {
          await productCatalogRef.current.refreshProducts();
          console.log(`✅ Product catalog refreshed (attempt ${attempt}/${maxAttempts})`);
          
          // Continue refreshing to catch Kafka updates
          if (attempt < maxAttempts) {
            continue;
          }
        } catch (error) {
          console.error(`❌ Failed to refresh products (attempt ${attempt}):`, error);
        }
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Point of Sale
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search products to add to cart
            </p>
          </div>
          <button
            onClick={() => setShowHeldOrders(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Held Orders
            {heldOrders.length > 0 && (
              <span className="bg-white text-orange-600 rounded-full px-2 py-0.5 text-xs font-bold">
                {heldOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Catalog - Left Side */}
        <div className="flex-1 overflow-auto">
          <ProductCatalog
            ref={productCatalogRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart Panel - Right Side */}
        <CartPanel
          cartItems={cartItems}
          subtotal={subtotal}
          total={total}
          totalDiscount={totalDiscount}
          orderDiscountValue={orderDiscount}
          orderDiscountType={orderDiscountType}
          roundingOff={roundingOff}
          finalTotal={finalTotal}
          onUpdateQuantity={updateQuantity}
          onUpdateUOM={updateUOM}
          onRemoveItem={removeFromCart}
          onApplyDiscount={applyDiscount}
          onApplyOrderDiscount={applyOrderDiscount}
          onClearCart={clearCart}
          onHoldOrder={holdOrder}
          onCheckout={() => setShowCheckout(true)}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cartItems={cartItems}
          customer={selectedCustomer}
          onCustomerChange={setSelectedCustomer}
          subtotal={subtotal}
          total={total}
          totalDiscount={orderDiscount}
          orderDiscountType={orderDiscountType}
          roundingOff={roundingOff}
          finalTotal={finalTotal}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Purchase Success Modal */}
      {showSuccess && (
        <PurchaseSuccessModal
          open={showSuccess}
          onClose={() => setShowSuccess(false)}
          invoiceNumber={lastInvoiceNumber}
          orderDate={lastOrderDate}
          cartItems={completedCartItems}
          customer={completedCustomer}
          companySettings={companySettings}
          subtotal={completedTotals.subtotal}
          total={completedTotals.total}
          roundingOff={completedTotals.roundingOff}
          paymentMethod={lastPaymentMethod}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Held Orders Modal */}
      {showHeldOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Held Orders ({heldOrders.length})
              </h2>
              <button
                onClick={() => setShowHeldOrders(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {heldOrders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No held orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {heldOrders.map((order) => {
                    const orderSubtotal = order.cartItems.reduce((sum, item) => {
                      const itemPrice = item.price * item.quantity;
                      let discountAmount = 0;
                      if (item.discount && item.discount > 0) {
                        if (item.discountType === "flat") {
                          discountAmount = item.discount;
                        } else {
                          discountAmount = (itemPrice * item.discount) / 100;
                        }
                      }
                      return sum + (itemPrice - discountAmount);
                    }, 0);

                    let orderDiscountAmount = 0;
                    if (order.orderDiscount > 0) {
                      if (order.orderDiscountType === "flat") {
                        orderDiscountAmount = order.orderDiscount;
                      } else {
                        orderDiscountAmount = (orderSubtotal * order.orderDiscount) / 100;
                      }
                    }

                    const orderTotal = orderSubtotal - orderDiscountAmount;
                    const orderFinalTotal = Math.round(orderTotal);

                    return (
                      <div
                        key={order.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {order.id}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {order.timestamp.toLocaleString()}
                            </p>
                            {order.customer && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Customer: {order.customer.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(orderFinalTotal)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {order.cartItems.length} items
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => retrieveOrder(order.id)}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Retrieve
                          </button>
                          <button
                            onClick={() => deleteHeldOrder(order.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
