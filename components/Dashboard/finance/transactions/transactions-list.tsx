"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Filter, Eye, Download } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import { financeService, type Transaction } from "@/services/financeService";



interface TransactionsListProps {
  transactionType: "online";
}

export function TransactionsList({ transactionType }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [financialYearFilter, setFinancialYearFilter] = useState("all");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 20,
  });

  const currencySymbol = useCurrency();

  // Fetch available financial years
  const fetchAvailableYears = async () => {
    try {
      const response = await financeService.getSalesByFinancialYear();
      if (response.success && response.data.length > 0) {
        const years = response.data.map((item) => item.financialYear).filter(Boolean);
        setAvailableYears(years);
      }
    } catch (error) {
      console.error("Error fetching financial years:", error);
    }
  };

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        page,
        limit: 20,
      };

      if (search) filters.search = search;
      if (paymentStatusFilter !== "all") filters.paymentStatus = paymentStatusFilter;
      if (financialYearFilter !== "all") filters.financialYear = financialYearFilter;
      
      // Only online transactions
      filters.transactionType = "sale";

      const response = await financeService.getTransactions(filters);
      
      if (response.success) {
        setTransactions(response.data);
        setPagination(response.pagination);
      } else {
        toast.error("Failed to fetch transactions");
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error(error.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, search, paymentStatusFilter, financialYearFilter, transactionType]);

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return colors[status] || "outline";
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sale: "default",
      refund: "destructive",
      adjustment: "secondary",
    };
    return colors[type] || "outline";
  };

  const handleViewTransaction = (transaction: Transaction) => {
    toast.info("Transaction details view coming soon");
  };

  const handleExportTransactions = () => {
    toast.info("Export functionality coming soon");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Online Order Transactions</span>
            <Button onClick={handleExportTransactions} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={financialYearFilter} onValueChange={setFinancialYearFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Financial Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transactionId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTransactionTypeColor(transaction.transactionType)}>
                          {transaction.transactionType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{transaction.referenceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.referenceType.replace('_', ' ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{transaction.customerName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.customerEmail || transaction.customerPhone || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {currencySymbol}{transaction.amount.toFixed(2)}
                          </p>
                          {transaction.taxAmount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Tax: {currencySymbol}{transaction.taxAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-green-600">
                            {currencySymbol}{transaction.revenueAmount.toFixed(2)}
                          </p>
                          {transaction.revenueRecognitionReason && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.revenueRecognitionReason.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{transaction.paymentMethod.toUpperCase()}</p>
                          {transaction.paymentGateway && (
                            <p className="text-xs text-muted-foreground">
                              via {transaction.paymentGateway}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusColor(transaction.paymentStatus)}>
                          {transaction.paymentStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {new Date(transaction.transactionDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.financialYear}
                          </p>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {pagination.totalPages} ({pagination.total} total transactions)
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {pagination.totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className={page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}