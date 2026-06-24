/**
 * Maps every dashboard page URL to its required permission module
 * Used by DashboardLayout to block unauthorized page access
 */

interface PagePermission {
  pattern: string; // URL pattern (prefix match)
  module: string;  // Permission module key
  action: string;  // Required action (usually 'view')
}

// Order matters — more specific patterns FIRST
export const PAGE_PERMISSIONS: PagePermission[] = [
  // Products
  { pattern: "/dashboard/products-list/online/add-product", module: "online_products", action: "add" },
  { pattern: "/dashboard/products-list/online/edit", module: "online_products", action: "edit" },
  { pattern: "/dashboard/products-list/online/view", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list/online", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list/combo/add", module: "online_products", action: "add" },
  { pattern: "/dashboard/products-list/combo/edit", module: "online_products", action: "edit" },
  { pattern: "/dashboard/products-list/combo", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list/category-list/add-category", module: "online_products", action: "add" },
  { pattern: "/dashboard/products-list/category-list/add-subcategory", module: "online_products", action: "add" },
  { pattern: "/dashboard/products-list/category-list/edit-subcategory", module: "online_products", action: "edit" },
  { pattern: "/dashboard/products-list/category-list/add", module: "online_products", action: "add" },
  { pattern: "/dashboard/products-list/category-list/edit", module: "online_products", action: "edit" },
  { pattern: "/dashboard/products-list/category-list", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list/subcategory-list", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list/offline", module: "online_products", action: "view" },
  { pattern: "/dashboard/products-list", module: "online_products", action: "view" },

  // Coupons
  { pattern: "/dashboard/coupons", module: "coupons", action: "view" },

  // Inventory
  { pattern: "/dashboard/inventory-management/warehouse", module: "warehouse", action: "view" },
  { pattern: "/dashboard/inventory-management/stock-adjustment", module: "stock_adjustment", action: "view" },
  { pattern: "/dashboard/inventory-management/processing", module: "processing", action: "view" },
  { pattern: "/dashboard/inventory-management/reports", module: "inventory_reports", action: "view" },
  { pattern: "/dashboard/inventory-management", module: "warehouse", action: "view" },

  // POS
  { pattern: "/dashboard/pos/products/edit", module: "pos_products", action: "edit" },
  { pattern: "/dashboard/pos/products", module: "pos_products", action: "view" },
  { pattern: "/dashboard/pos", module: "pos_billing", action: "view" },

  // Customer Management
  { pattern: "/dashboard/customer-management", module: "customers", action: "view" },

  // Orders
  { pattern: "/dashboard/orders/online", module: "online_orders", action: "view" },
  { pattern: "/dashboard/orders/pos", module: "pos_orders", action: "view" },
  { pattern: "/dashboard/orders", module: "online_orders", action: "view" },

  // Delivery Tracking
  { pattern: "/dashboard/delivery/tracking", module: "delivery_tracking", action: "view" },

  // Finance — Sales
  { pattern: "/dashboard/finances/sales/online-sales", module: "online_sales", action: "view" },
  { pattern: "/dashboard/finances/sales/pos-sales", module: "pos_sales", action: "view" },
  { pattern: "/dashboard/finances/sales/reports", module: "sales_reports", action: "view" },
  { pattern: "/dashboard/finances/sales", module: "online_sales", action: "view" },
  { pattern: "/dashboard/finances/transactions", module: "transactions", action: "view" },
  { pattern: "/dashboard/finances", module: "online_sales", action: "view" },

  // Purchase
  { pattern: "/dashboard/purchase-orders/suppliers-list", module: "suppliers", action: "view" },
  { pattern: "/dashboard/purchase-orders/purchases-list", module: "purchase_orders", action: "view" },
  { pattern: "/dashboard/purchase-orders/bills-list", module: "bills", action: "view" },
  { pattern: "/dashboard/purchase-orders/expenses-list", module: "expenses", action: "view" },
  { pattern: "/dashboard/purchase-orders/reports", module: "purchase_reports", action: "view" },
  { pattern: "/dashboard/purchase-orders", module: "suppliers", action: "view" },

  // Delivery Partners
  { pattern: "/dashboard/delivery-partner/new", module: "partner_applications", action: "add" },
  { pattern: "/dashboard/delivery-partner/edit", module: "partner_applications", action: "edit" },
  { pattern: "/dashboard/delivery-partner/manage", module: "partner_management", action: "view" },
  { pattern: "/dashboard/delivery-partner/reports", module: "partner_reports", action: "view" },
  { pattern: "/dashboard/delivery-partner", module: "partner_applications", action: "view" },

  // Enquiries
  { pattern: "/dashboard/enquiries/bulk-orders", module: "bulk_enquiries", action: "view" },
  { pattern: "/dashboard/enquiries/catering-services", module: "catering_enquiries", action: "view" },
  { pattern: "/dashboard/enquiries", module: "bulk_enquiries", action: "view" },

  // Employees
  { pattern: "/dashboard/employees/roles/new", module: "roles", action: "add" },
  { pattern: "/dashboard/employees/roles/edit", module: "roles", action: "edit" },
  { pattern: "/dashboard/employees/roles", module: "roles", action: "view" },
  { pattern: "/dashboard/employees/departments", module: "departments", action: "view" },
  { pattern: "/dashboard/employees/new", module: "employees", action: "add" },
  { pattern: "/dashboard/employees/edit", module: "employees", action: "edit" },
  { pattern: "/dashboard/employees/profile", module: "employees", action: "view" },
  { pattern: "/dashboard/employees", module: "employees", action: "view" },

  // Settings
  { pattern: "/dashboard/settings/general", module: "settings_general", action: "view" },
  { pattern: "/dashboard/settings/email-configuration", module: "settings_email", action: "view" },
  { pattern: "/dashboard/settings/payment-gateway", module: "settings_payment", action: "view" },
  { pattern: "/dashboard/settings/invoice", module: "settings_invoice", action: "view" },
  { pattern: "/dashboard/settings/gst", module: "settings_gst", action: "view" },
  { pattern: "/dashboard/settings/delivery-zones", module: "settings_zones", action: "view" },
  { pattern: "/dashboard/settings/delivery-charge", module: "settings_charge", action: "view" },
  { pattern: "/dashboard/settings/order-schedule", module: "settings_schedule", action: "view" },
  { pattern: "/dashboard/settings", module: "settings_general", action: "view" },

  // Web Settings
  { pattern: "/dashboard/web-settings/logo", module: "web_logo", action: "view" },
  { pattern: "/dashboard/web-settings/banner", module: "web_banner", action: "view" },
  { pattern: "/dashboard/web-settings/company", module: "web_company", action: "view" },
  { pattern: "/dashboard/web-settings/seo", module: "web_seo", action: "view" },
  { pattern: "/dashboard/web-settings/policies", module: "web_policies", action: "view" },
  { pattern: "/dashboard/web-settings", module: "web_logo", action: "view" },

  // Dashboard (must be LAST — matches /dashboard exactly)
  { pattern: "/dashboard", module: "dashboard", action: "view" },
];

/**
 * Get required permission for a given URL path
 * Returns null if no permission required (public dashboard page)
 */
export const getPagePermission = (pathname: string): PagePermission | null => {
  // Exact match first, then prefix match
  for (const perm of PAGE_PERMISSIONS) {
    if (pathname === perm.pattern || pathname.startsWith(perm.pattern + "/")) {
      return perm;
    }
  }
  return null;
};
