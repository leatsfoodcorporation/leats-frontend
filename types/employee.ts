// ============================================
// Permission Types
// ============================================

export interface Permission {
  module: string;
  actions: ('view' | 'add' | 'edit' | 'delete')[];
}

export interface PermissionModule {
  key: string;
  label: string;
  group: string;
  actions: string[];
}

// 42 sub-modules — mirrors backend permissionConstants.js
export const PERMISSION_MODULES: PermissionModule[] = [
  // Main
  { key: "dashboard", label: "Dashboard", group: "Main", actions: ["view"] },
  { key: "online_products", label: "Online Products", group: "Main", actions: ["view", "add", "edit", "delete"] },
  { key: "coupons", label: "Coupons", group: "Main", actions: ["view", "add", "edit", "delete"] },

  // Inventory
  { key: "warehouse", label: "Warehouse", group: "Inventory", actions: ["view", "add", "edit", "delete"] },
  { key: "stock_adjustment", label: "Stock Adjustment", group: "Inventory", actions: ["view", "add"] },
  { key: "processing", label: "Processing", group: "Inventory", actions: ["view", "add"] },

  // POS
  { key: "pos_products", label: "POS Products", group: "POS", actions: ["view", "add", "edit", "delete"] },
  { key: "pos_billing", label: "POS Billing", group: "POS", actions: ["view", "add"] },

  // Orders
  { key: "online_orders", label: "Online Orders", group: "Orders", actions: ["view", "edit"] },
  { key: "pos_orders", label: "POS Orders", group: "Orders", actions: ["view"] },

  // Finance
  { key: "online_sales", label: "Online Sales", group: "Finance", actions: ["view"] },
  { key: "pos_sales", label: "POS Sales", group: "Finance", actions: ["view"] },
  { key: "transactions", label: "Transactions", group: "Finance", actions: ["view"] },

  // Purchase
  { key: "suppliers", label: "Suppliers", group: "Purchase", actions: ["view", "add", "edit", "delete"] },
  { key: "purchase_orders", label: "Purchase Orders", group: "Purchase", actions: ["view", "add", "edit", "delete"] },
  { key: "bills", label: "Bills / GRN", group: "Purchase", actions: ["view", "add", "edit"] },
  { key: "expenses", label: "Expenses", group: "Purchase", actions: ["view", "add", "edit", "delete"] },
  { key: "purchase_reports", label: "Purchase Reports", group: "Purchase", actions: ["view"] },

  // Delivery
  { key: "partner_applications", label: "Partner Applications", group: "Delivery", actions: ["view", "add", "edit"] },
  { key: "partner_management", label: "Partner Management", group: "Delivery", actions: ["view", "edit"] },
  // { key: "delivery_tracking", label: "Delivery Tracking", group: "Delivery", actions: ["view"] }, // Hidden from role form — not in use currently

  // Customers
  { key: "customers", label: "Customer Management", group: "Customers", actions: ["view"] },

  // Enquiries
  { key: "bulk_enquiries", label: "Bulk Orders", group: "Enquiries", actions: ["view", "edit", "delete"] },
  { key: "catering_enquiries", label: "Catering Services", group: "Enquiries", actions: ["view", "edit", "delete"] },

  // Web Settings
  { key: "web_logo", label: "Logo", group: "Web Settings", actions: ["view", "edit"] },
  { key: "web_banner", label: "Banner", group: "Web Settings", actions: ["view", "add", "edit", "delete"] },
  { key: "web_company", label: "Company Info", group: "Web Settings", actions: ["view", "edit"] },
  { key: "web_seo", label: "SEO", group: "Web Settings", actions: ["view", "add", "edit", "delete"] },
  { key: "web_policies", label: "Policies & FAQ", group: "Web Settings", actions: ["view", "add", "edit", "delete"] },

  // Settings
  { key: "settings_general", label: "General", group: "Settings", actions: ["view"] },
  { key: "settings_email", label: "Email Config", group: "Settings", actions: ["view", "edit"] },
  { key: "settings_payment", label: "Payment Gateway", group: "Settings", actions: ["view", "edit"] },
  { key: "settings_invoice", label: "Invoice", group: "Settings", actions: ["view", "edit"] },
  { key: "settings_gst", label: "GST / Tax", group: "Settings", actions: ["view", "add", "edit", "delete"] },
  { key: "settings_zones", label: "Delivery Zone", group: "Settings", actions: ["view", "add", "edit", "delete"] },
  { key: "settings_charge", label: "Delivery Charge", group: "Settings", actions: ["view", "add", "edit", "delete"] },
  { key: "settings_schedule", label: "Order Schedule", group: "Settings", actions: ["view", "edit"] },

  // Management
  { key: "employees", label: "Employees", group: "Management", actions: ["view", "add", "edit", "delete"] },
  { key: "roles", label: "Roles", group: "Management", actions: ["view", "add", "edit", "delete"] },
  { key: "departments", label: "Departments", group: "Management", actions: ["view", "add", "edit", "delete"] },

  // Reports
  { key: "inventory_reports", label: "Inventory Reports", group: "Reports", actions: ["view"] },
  { key: "sales_reports", label: "Sales Reports", group: "Reports", actions: ["view"] },
  // { key: "partner_reports", label: "Partner Reports", group: "Reports", actions: ["view"] }, // Hidden — sidebar link commented out, not in use currently
];

export const PERMISSION_GROUPS = [...new Set(PERMISSION_MODULES.map(m => m.group))];

// ============================================
// Department Types
// ============================================

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Role Types
// ============================================

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  isActive: boolean;
  employeeCount?: number;
  permissionCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Employee Types
// ============================================

export type EmployeeStatus = 'draft' | 'invited' | 'verified' | 'active' | 'suspended' | 'inactive';

export interface StatusHistoryEntry {
  from: string | null;
  to: string;
  reason: string;
  changedAt: string;
}

export interface Employee {
  id: string;
  employeeId?: string;
  email: string;
  name: string;
  phone: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  status: EmployeeStatus;
  statusHistory: StatusHistoryEntry[];

  // Relations
  roleId?: string;
  role?: Role;
  departmentId?: string;
  department?: Department;

  // Personal
  dateOfBirth?: string;
  gender?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;

  // Documents
  aadharNumber?: string;
  aadharDocument?: string;
  aadharDocumentUrl?: string;
  panNumber?: string;
  panDocument?: string;
  panDocumentUrl?: string;
  idProofDocument?: string;
  idProofDocumentUrl?: string;

  // Employment
  joiningDate?: string;

  // Suspension
  suspensionReason?: string;
  suspensionNote?: string;
  suspendedAt?: string;

  // Account
  isActive: boolean;
  lastLogin?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface EmployeesResponse {
  success: boolean;
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    draft: number;
    invited: number;
    verified: number;
    active: number;
    suspended: number;
    inactive: number;
  };
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee;
  message?: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface RoleResponse {
  success: boolean;
  data: Role;
  message?: string;
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
}

export interface DepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export interface PermissionModulesResponse {
  success: boolean;
  data: {
    modules: PermissionModule[];
    groups: string[];
  };
}
