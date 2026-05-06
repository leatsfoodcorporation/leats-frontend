"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Plus, Search, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { expenseService, type Expense } from "@/services/expenseService";
import { expenseCategoryService } from "@/services/expenseCategoryService";
import AddExpense from "./add-expense";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

export default function ExpensesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const currencySymbol = useCurrency();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  // Check URL params for editing
  useEffect(() => {
    const expenseId = searchParams.get("id");
    if (
      expenseId &&
      !isEditDialogOpen &&
      !isClosingRef.current &&
      expenses.length > 0
    ) {
      const expense = expenses.find((e) => e.id === expenseId);
      if (expense) {
        setSelectedExpense(expense);
        setIsEditDialogOpen(true);
      }
    }
  }, [searchParams, expenses, isEditDialogOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: {
        status?: string;
        categoryId?: string;
      } = {};

      if (statusFilter !== "all") filters.status = statusFilter;
      if (categoryFilter !== "all") filters.categoryId = categoryFilter;

      const [expensesData, categoriesData] = await Promise.all([
        expenseService.getAll(filters),
        expenseCategoryService.getCategoryNames(),
      ]);

      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (data: {
    expenseNumber?: string;
    categoryId: string;
    expense: string;
    description: string;
    amount: number;
    expenseDate: string;
    paymentMethod: string;
    supplierId?: string;
    supplierName?: string;
    receiptUrl?: string;
    status: string;
    notes: string;
  }) => {
    setIsSubmitting(true);
    try {
      await expenseService.create(data);
      toast.success("Expense added successfully");
      isClosingRef.current = true;
      setIsAddDialogOpen(false);
      router.push("/dashboard/purchase-orders/expenses-list");
      await loadData();
      setTimeout(() => {
        isClosingRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to add expense";
      toast.error(errorMessage || "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (data: {
    expenseNumber?: string;
    categoryId: string;
    expense: string;
    description: string;
    amount: number;
    expenseDate: string;
    paymentMethod: string;
    supplierId?: string;
    supplierName?: string;
    receiptUrl?: string;
    status: string;
    notes: string;
  }) => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      await expenseService.update(selectedExpense.id, data);
      toast.success("Expense updated successfully");
      isClosingRef.current = true;
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      router.push("/dashboard/purchase-orders/expenses-list");
      await loadData();
      setTimeout(() => {
        isClosingRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error updating expense:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to update expense";
      toast.error(errorMessage || "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    router.push(`/dashboard/purchase-orders/expenses-list?id=${expense.id}`);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      paid: { label: "Paid", variant: "default" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.expense.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis-end");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setSelectedExpense(null);
              setIsAddDialogOpen(true);
              router.push("/dashboard/purchase-orders/expenses-list");
            }}
          >
            <Plus className="size-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Expense</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              currentExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-mono text-xs">
                    {expense.expenseNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.expense}
                  </TableCell>
                  <TableCell>{expense.categoryName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell>{expense.supplierName || "-"}</TableCell>
                  <TableCell>
                    {currencySymbol}{expense.amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>{expense.paymentMethod || "-"}</TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      title="Edit expense"
                    >
                      <Edit className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of{" "}
            {filteredExpenses.length} expenses
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis-start" || page === "ellipsis-end" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            isClosingRef.current = true;
            setIsAddDialogOpen(false);
            router.push("/dashboard/purchase-orders/expenses-list");
            setTimeout(() => {
              isClosingRef.current = false;
            }, 500);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new expense
            </DialogDescription>
          </DialogHeader>
          <AddExpense
            onSubmit={handleAddExpense}
            onCancel={() => {
              isClosingRef.current = true;
              setIsAddDialogOpen(false);
              router.push("/dashboard/purchase-orders/expenses-list");
              setTimeout(() => {
                isClosingRef.current = false;
              }, 500);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            isClosingRef.current = true;
            setIsEditDialogOpen(false);
            setSelectedExpense(null);
            router.push("/dashboard/purchase-orders/expenses-list");
            setTimeout(() => {
              isClosingRef.current = false;
            }, 500);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details</DialogDescription>
          </DialogHeader>
          <AddExpense
            expense={
              selectedExpense
                ? {
                    expenseNumber: selectedExpense.expenseNumber,
                    categoryId: selectedExpense.categoryId,
                    expense: selectedExpense.expense,
                    description: selectedExpense.description,
                    amount: selectedExpense.amount,
                    expenseDate: selectedExpense.expenseDate,
                    paymentMethod: selectedExpense.paymentMethod || "Cash",
                    supplierId: selectedExpense.supplierId,
                    supplierName: selectedExpense.supplierName,
                    receiptUrl: selectedExpense.receiptUrl,
                    status: selectedExpense.status,
                    notes: selectedExpense.notes || "",
                  }
                : null
            }
            onSubmit={handleEditExpense}
            onCancel={() => {
              isClosingRef.current = true;
              setIsEditDialogOpen(false);
              setSelectedExpense(null);
              router.push("/dashboard/purchase-orders/expenses-list");
              setTimeout(() => {
                isClosingRef.current = false;
              }, 500);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
