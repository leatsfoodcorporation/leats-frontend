"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import SalesSummaryReport from "./sales-summary-report";
import PosSalesReport from "./pos-sales-report";
import OnlineSalesReport from "./online-sales-report";

export default function SalesReports() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeReport = searchParams.get("report") || "sales-summary";

  const handleReportChange = (reportType: string) => {
    router.push(`/dashboard/finances/sales/reports?report=${reportType}`);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeReport === "sales-summary" ? "default" : "outline"}
          onClick={() => handleReportChange("sales-summary")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Sales Summary
        </Button>
        <Button
          variant={activeReport === "pos-sales" ? "default" : "outline"}
          onClick={() => handleReportChange("pos-sales")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          POS Sales
        </Button>
        <Button
          variant={activeReport === "online-sales" ? "default" : "outline"}
          onClick={() => handleReportChange("online-sales")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Online Sales
        </Button>
      </div>

      {/* Report Content */}
      {activeReport === "sales-summary" && <SalesSummaryReport />}
      {activeReport === "pos-sales" && <PosSalesReport />}
      {activeReport === "online-sales" && <OnlineSalesReport />}
    </div>
  );
}
