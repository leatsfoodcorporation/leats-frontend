"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Package,
  XCircle,
  Star,
  Users,
  Activity,
  RefreshCw,
  Download,
  Search,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface PartnerStats {
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  totalDeliveries: number;
  todayDeliveries: number;
  weeklyDeliveries: number;
  monthlyDeliveries: number;
  averageRating: number;
  totalRatings: number;
  isAvailable: boolean;
  isOnline: boolean;
  periodStats: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
    successRate: number;
  };
}

interface OverallStats {
  totalPartners: number;
  activePartners: number;
  onlinePartners: number;
  totalOrders: number;
  totalDelivered: number;
  totalPending: number;
  totalCancelled: number;
  overallSuccessRate: number;
}

interface ReportsData {
  period: string;
  partners: PartnerStats[];
  overallStats: OverallStats;
}

export default function PartnerReports() {
  const [period, setPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/delivery-partners/reports?period=${period}`
      );

      if (response.data.success) {
        setReportsData(response.data.data);
      } else {
        toast.error("Failed to load reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!reportsData) return;

    try {
      const { partners, overallStats } = reportsData;

      // Prepare data for Excel
      const excelData = partners.map((partner) => ({
        "Partner ID": partner.partnerId,
        "Name": partner.name,
        "Email": partner.email,
        "Phone": partner.phone,
        "Status": partner.isOnline ? "Online" : "Offline",
        "Available": partner.isAvailable ? "Yes" : "No",
        "Average Rating": partner.averageRating.toFixed(1),
        "Total Ratings": partner.totalRatings,
        "Total Deliveries": partner.totalDeliveries,
        "Today Deliveries": partner.todayDeliveries,
        "Weekly Deliveries": partner.weeklyDeliveries,
        "Monthly Deliveries": partner.monthlyDeliveries,
        [`${period} - Total`]: partner.periodStats.total,
        [`${period} - Delivered`]: partner.periodStats.delivered,
        [`${period} - Pending`]: partner.periodStats.pending,
        [`${period} - Cancelled`]: partner.periodStats.cancelled,
      }));

      // Add overall stats at the end
      excelData.push({
        "Partner ID": "OVERALL STATS",
        "Name": "",
        "Email": "",
        "Phone": "",
        "Status": "",
        "Available": "",
        "Average Rating": "",
        "Total Ratings": "",
        "Total Deliveries": "",
        "Today Deliveries": "",
        "Weekly Deliveries": "",
        "Monthly Deliveries": "",
        [`${period} - Total`]: overallStats.totalOrders,
        [`${period} - Delivered`]: overallStats.totalDelivered,
        [`${period} - Pending`]: overallStats.totalPending,
        [`${period} - Cancelled`]: overallStats.totalCancelled,
      } as any);

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Partner Reports");

      // Auto-size columns
      const maxWidth = 20;
      const wscols = Object.keys(excelData[0] || {}).map(() => ({ wch: maxWidth }));
      ws["!cols"] = wscols;

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const filename = `Partner_Reports_${period}_${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download report");
    }
  };

  // Filter partners based on search query (name or partner ID)
  const filteredPartners = useMemo(() => {
    if (!reportsData) return [];
    
    const { partners } = reportsData;
    if (!searchQuery.trim()) return partners;
    
    const query = searchQuery.toLowerCase();
    return partners.filter(
      (partner) =>
        partner.name.toLowerCase().includes(query) ||
        partner.partnerId.toLowerCase().includes(query) ||
        partner.email.toLowerCase().includes(query)
    );
  }, [reportsData, searchQuery]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredPartners.slice(0, 10).map((partner) => ({
      name: partner.partnerId,
      fullName: partner.name,
      delivered: partner.periodStats.delivered,
      pending: partner.periodStats.pending,
      cancelled: partner.periodStats.cancelled,
    }));
  }, [filteredPartners]);

  const pieData = useMemo(() => {
    if (!reportsData) return [];
    
    const { overallStats } = reportsData;
    return [
      { name: "Delivered", value: overallStats.totalDelivered, color: "#22c55e" },
      { name: "Pending", value: overallStats.totalPending, color: "#eab308" },
      { name: "Cancelled", value: overallStats.totalCancelled, color: "#ef4444" },
    ];
  }, [reportsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { partners, overallStats } = reportsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Reports</h1>
          <p className="text-muted-foreground">
            Analytics and performance metrics for delivery partners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchReports} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.activePartners} active • {overallStats.onlinePartners} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalDelivered} delivered • {overallStats.totalPending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overallStats.totalCancelled}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalOrders > 0
                ? ((overallStats.totalCancelled / overallStats.totalOrders) * 100).toFixed(1)
                : 0}
              % cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart - Top 10 Partners Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Partners Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-green-600">
                            Delivered: {payload[0].value}
                          </p>
                          <p className="text-sm text-yellow-600">
                            Pending: {payload[1].value}
                          </p>
                          <p className="text-sm text-red-600">
                            Cancelled: {payload[2].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="delivered" fill="#22c55e" name="Delivered" />
                <Bar dataKey="pending" fill="#eab308" name="Pending" />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Overall Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Overall Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Partner Performance</CardTitle>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                {filteredPartners.length} result{filteredPartners.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPartners.map((partner) => (
              <div
                key={partner.partnerId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        partner.profilePhoto
                          ? `/image/${partner.profilePhoto}`
                          : undefined
                      }
                      alt={partner.name}
                    />
                    <AvatarFallback>
                      {partner.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{partner.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {partner.partnerId}
                      </Badge>
                      {partner.isOnline && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Online
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {partner.averageRating.toFixed(1)} ({partner.totalRatings})
                      </span>
                      <span>•</span>
                      <span>{partner.totalDeliveries} total deliveries</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold">{partner.periodStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {partner.periodStats.delivered}
                    </div>
                    <div className="text-xs text-muted-foreground">Delivered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {partner.periodStats.pending}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {partner.periodStats.cancelled}
                    </div>
                    <div className="text-xs text-muted-foreground">Cancelled</div>
                  </div>
                </div>
              </div>
            ))}

            {filteredPartners.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No partner data available for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
