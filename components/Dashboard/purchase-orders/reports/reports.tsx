"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import PurchaseSummaryReport from "./purchase-summary-report";
import BillsSummaryReport from "./bills-summary-report";
import ExpensesSummaryReport from "./expenses-summary-report";

export default function Reports() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeReport = searchParams.get("report") || "purchase-summary-report";

  const handleReportChange = (reportType: string) => {
    router.push(`/dashboard/purchase-orders/reports?report=${reportType}`);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeReport === "purchase-summary-report" ? "default" : "outline"}
          onClick={() => handleReportChange("purchase-summary-report")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Purchase Summary
        </Button>
        <Button
          variant={activeReport === "bills-summary-report" ? "default" : "outline"}
          onClick={() => handleReportChange("bills-summary-report")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Bills Summary
        </Button>
        <Button
          variant={activeReport === "expenses-summary-report" ? "default" : "outline"}
          onClick={() => handleReportChange("expenses-summary-report")}
          size="sm"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Expenses Summary
        </Button>
      </div>

      {/* Report Content */}
      {activeReport === "purchase-summary-report" && <PurchaseSummaryReport />}
      {activeReport === "bills-summary-report" && <BillsSummaryReport />}
      {activeReport === "expenses-summary-report" && <ExpensesSummaryReport />}
    </div>
  );
}
