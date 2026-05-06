"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import DeliveryPartnerList from "./devlivery-partner-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DeliveryPartner() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    approved: 0,
    rejected: 0,
  });

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      const { getDeliveryPartners } = await import("@/services/deliveryPartnerService");
      
      const [pendingRes, verifiedRes, approvedRes, rejectedRes] = await Promise.all([
        getDeliveryPartners({ status: "pending", limit: 1 }),
        getDeliveryPartners({ status: "verified", limit: 1 }),
        getDeliveryPartners({ status: "approved", limit: 1 }),
        getDeliveryPartners({ status: "rejected", limit: 1 }),
      ]);

      setStats({
        pending: pendingRes.pagination.totalCount,
        verified: verifiedRes.pagination.totalCount,
        approved: approvedRes.pagination.totalCount,
        rejected: rejectedRes.pagination.totalCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statsCards = [
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    {
      label: "Verified",
      value: stats.verified,
      icon: CheckCircle,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-950/20",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
    },
  ];

  // Get tab from URL path
  useEffect(() => {
    const normalizedPath =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedPath === "/dashboard/delivery-partner") {
      router.replace("/dashboard/delivery-partner/all");
    } else {
      const pathSegments = normalizedPath.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      setActiveTab(lastSegment || "all");
    }
  }, [pathname, router]);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/delivery-partner/${value}`);
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Delivery Partner Applications</h1>
          <p className="text-sm text-muted-foreground">
            Manage new applications and create partners manually
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/delivery-partner/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Partner Manually
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card
            key={stat.label}
            className={`${stat.bgColor} ${stat.borderColor} border-2`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.iconColor}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Applications List</h2>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Header with Tabs and Search */}
          <div className="mb-6 flex items-center justify-between gap-5">
            <TabsList className="w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            {/* Right Side - Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tab Contents */}
          <TabsContent value="all" className="mt-0 w-full">
            <DeliveryPartnerList key={`all-${refreshKey}`} status="all" searchQuery={searchQuery} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="pending" className="mt-0 w-full">
            <DeliveryPartnerList key={`pending-${refreshKey}`} status="pending" searchQuery={searchQuery} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="verified" className="mt-0 w-full">
            <DeliveryPartnerList key={`verified-${refreshKey}`} status="verified" searchQuery={searchQuery} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="approved" className="mt-0 w-full">
            <DeliveryPartnerList key={`approved-${refreshKey}`} status="approved" searchQuery={searchQuery} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="rejected" className="mt-0 w-full">
            <DeliveryPartnerList key={`rejected-${refreshKey}`} status="rejected" searchQuery={searchQuery} onDataChange={handleDataChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
