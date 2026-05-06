"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronsUpDown,
  Home,
  LogOut,
  Users,
  Settings,
  Mail,
  Ticket,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Receipt,
  Truck,
  Globe,
  Store,
  MessageSquare,
} from "lucide-react";
import { GiCash } from "react-icons/gi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { LogoutAlert } from "@/components/ui/logout-alert";
import { useAuth } from "@/hooks/useAuth";
import { TbReceipt, TbTruckDelivery } from "react-icons/tb";
import {
  getWebSettings,
  type WebSettings,
} from "@/services/online-services/webSettingsService";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

// Define the type for navigation items
type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

// Navigation data
const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Online Products",
    url: "/dashboard/products-list",
    icon: ShoppingBag,
  },
  {
    title: "Coupons",
    url: "/dashboard/coupons",
    icon: Ticket,
  },
  {
    title: "Inventory",
    url: "/dashboard/inventory-management",
    icon: Package,
    isActive: true,
    items: [
      {
        title: "Warehouse",
        url: "/dashboard/inventory-management/warehouse",
      },
      {
        title: "Stock Adjustment",
        url: "/dashboard/inventory-management/stock-adjustment",
      },
      {
        title: "Reports",
        url: "/dashboard/inventory-management/reports",
      },
    ],
  },
  // {
  //   title: "Purchase Order",
  //   url: "/dashboard/purchase-orders",
  //   icon: FileText,
  //   isActive: true,
  //   items: [
  //     {
  //       title: "Suppliers",
  //       url: "/dashboard/purchase-orders/suppliers-list",
  //     },
  //     {
  //       title: "Purchase Orders",
  //       url: "/dashboard/purchase-orders/purchases-list",
  //     },
  //     {
  //       title: "Bills",
  //       url: "/dashboard/purchase-orders/bills-list",
  //     },
  //     {
  //       title: "Expenses",
  //       url: "/dashboard/purchase-orders/expenses-list",
  //     },
  //   ],
  // },
  {
    title: "POS",
    url: "/dashboard/pos",
    icon: TbReceipt,
    isActive: true,
    items: [
      {
        title: "Products",
        url: "/dashboard/pos/products",
      },
    ],
  },
  {
    title: "Customer Management",
    url: "/dashboard/customer-management",
    icon: Users,
    isActive: true,
  },

  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingCart,
    isActive: true,
    items: [
      {
        title: "Online Orders",
        url: "/dashboard/orders/online",
      },
      {
        title: "Pos Orders",
        url: "/dashboard/orders/pos",
      },
    ],
  },
  {
    title: "Finances",
    url: "/dashboard/finances",
    icon: DollarSign,
    isActive: true,
    items: [
      {
        title: "Sales",
        url: "/dashboard/finances/sales",
      },
      {
        title: "Transactions",
        url: "/dashboard/finances/transactions",
      },
      {
        title: "Purchase",
        url: "/dashboard/purchase-orders",
      },
    ],
  },
  {
    title: "Delivery Partners",
    url: "/dashboard/delivery-partner",
    icon: Truck,
    isActive: true,
    items: [
      {
        title: "New Application",
        url: "/dashboard/delivery-partner/all",
      },
      {
        title: "Manage Profile",
        url: "/dashboard/delivery-partner/manage",
      },
      // {
      //   title: "Reports",
      //   url: "/dashboard/delivery-partner/reports",
      // },
    ],
  },
  {
    title: "Enquiries",
    url: "/dashboard/enquiries",
    icon: MessageSquare,
    isActive: true,
    items: [
      {
        title: "Bulk Orders",
        url: "/dashboard/enquiries/bulk-orders",
      },
      {
        title: "Catering Services",
        url: "/dashboard/enquiries/catering-services",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth(false);
  const [showLogoutAlert, setShowLogoutAlert] = React.useState(false);
  const [logoutTimeoutId, setLogoutTimeoutId] =
    React.useState<NodeJS.Timeout | null>(null);
  const [webSettings, setWebSettings] = React.useState<WebSettings | null>(
    null
  );
  const [isLoadingLogo, setIsLoadingLogo] = React.useState(true);

  // Fetch web settings on mount
  React.useEffect(() => {
    const fetchWebSettings = async () => {
      try {
        setIsLoadingLogo(true);
        const response = await getWebSettings();
        if (response.success) {
          setWebSettings(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch web settings:", error);
      } finally {
        setIsLoadingLogo(false);
      }
    };

    fetchWebSettings();
  }, []);

  const handleLogoutClick = () => {
    // Clear any existing timeout
    if (logoutTimeoutId) {
      clearTimeout(logoutTimeoutId);
      setLogoutTimeoutId(null);
    }
    setShowLogoutAlert(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      // Add 1 second delay before closing alert and redirecting
      const timeoutId = setTimeout(() => {
        setShowLogoutAlert(false);
        setLogoutTimeoutId(null);
      }, 1000);
      setLogoutTimeoutId(timeoutId);
    } catch (error) {
      console.error("Logout failed:", error);
      // Keep the alert open on error
    }
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      // Clear any pending timeout when modal is closed
      if (logoutTimeoutId) {
        clearTimeout(logoutTimeoutId);
        setLogoutTimeoutId(null);
      }
    }
    setShowLogoutAlert(open);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (logoutTimeoutId) {
        clearTimeout(logoutTimeoutId);
      }
    };
  }, [logoutTimeoutId]);

  // Helper function to check if a path is active
  const isActive = (url: string): boolean => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(url);
  };

  // Helper function to check if settings section is active
  const isSettingsActive = () => {
    return pathname.startsWith("/dashboard/settings");
  };

  // Helper function to check if web settings section is active
  const isWebSettingsActive = () => {
    return pathname.startsWith("/dashboard/web-settings");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex items-center justify-center">
        <div className="w-full flex items-center justify-center ">
          {isLoadingLogo ? (
            <Store className="size-8 animate-pulse text-muted-foreground" />
          ) : webSettings?.logoUrl ? (
            <Image
              src={webSettings.logoUrl}
              alt="Store Logo"
              width={80}
              height={48}
              className="object-contain max-w-full h-auto"
              priority
            />
          ) : (
            <Store className="size-8 text-muted-foreground" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
              // If item has submenu items
              if (item.items && item.items.length > 0) {
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isActive(item.url)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <div className="flex items-center w-full gap-1">
                        {/* Main link that navigates */}
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={isActive(item.url)}
                          className="flex-1 pr-0"
                        >
                          <Link href={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        
                        {/* Separate toggle button for collapsible */}
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            aria-label={`Toggle ${item.title} submenu`}
                          >
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.url)}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              // Regular menu item without submenu
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Web Settings Dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Web Settings"
                  isActive={isWebSettingsActive()}
                >
                  <Globe />
                  <span>Web Settings</span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel>Web Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/web-settings/logo">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Logo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/web-settings/banner">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Banner</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/web-settings/company">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Company</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Settings Dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Settings"
                  isActive={isSettingsActive()}
                >
                  <Settings />
                  <span>Settings</span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>General</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/email-configuration">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Email Configuration</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/payment-gateway">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Payment gateways</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/invoice">
                      <Receipt className="mr-2 h-4 w-4" />
                      <span>Invoice</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/gst">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span>Gst / Tax</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/delivery-zones">
                      <TbTruckDelivery className="mr-2 h-4 w-4" />
                      <span>Delivery Zone</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/dashboard/settings/delivery-charge">
                      <GiCash className="mr-2 h-4 w-4" />
                      <span>Delivery Charge</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* User Profile Dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || "Loading..."}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.image} alt={user?.name} />
                      <AvatarFallback className="rounded-lg">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || "Loading..."}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      {/* Logout Confirmation Alert */}
      <LogoutAlert
        open={showLogoutAlert}
        onOpenChange={handleModalChange}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
      />
    </Sidebar>
  );
}
