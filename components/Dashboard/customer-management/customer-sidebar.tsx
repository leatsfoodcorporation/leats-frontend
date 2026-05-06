"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ArrowLeft, ChevronUp } from "lucide-react";
import { customerService, type Customer } from "@/services/customerService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useDebounce from "@/hooks/use-debounce";

interface CustomerSidebarProps {
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
}

export default function CustomerSidebar({
  selectedCustomerId,
  onSelectCustomer,
}: CustomerSidebarProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch customers with pagination
  const fetchCustomers = useCallback(async (pageNum: number, search: string, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await customerService.getAll(pageNum, 10, search);
      
      if (append) {
        setCustomers(prev => [...prev, ...result.customers]);
      } else {
        setCustomers(result.customers);
      }
      
      setTotalCustomers(result.pagination.total);
      setHasMore(pageNum < result.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCustomers(1, "");
  }, [fetchCustomers]);

  // Handle search
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchCustomers(1, debouncedSearch);
    // Reset scroll position when searching
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [debouncedSearch, fetchCustomers]);

  // Scroll event listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        setShowScrollTop(scrollAreaRef.current.scrollTop > 200);
      }
    };

    const scrollContainer = scrollAreaRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCustomers(nextPage, debouncedSearch, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget && hasMore) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, debouncedSearch, fetchCustomers]);

  const handleCustomerClick = (customerId: string) => {
    onSelectCustomer(customerId);
  };

  const handleBack = () => {
    router.push("/dashboard/customer-management");
  };

  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-80 border-r flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="font-semibold text-lg">Customers</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Customers List - Simple overflow scroll */}
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No customers found" : "No customers"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {customers.map((customer, index) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerClick(customer.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-accent hover:shadow-sm group ${
                  selectedCustomerId === customer.id
                    ? "bg-accent border-primary shadow-sm ring-1 ring-primary/20"
                    : "bg-background border-transparent hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={customer.image} alt={customer.name} />
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {customer.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {customer.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">
                    {customer.phone || "No phone"}
                  </span>
                  <span className="font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </button>
            ))}
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="py-4 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && customers.length > 10 && (
              <div className="py-4 text-center">
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-full px-3 py-1 inline-block">
                  End of list • {customers.length} customers
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-4 z-10 shadow-lg bg-background/95 backdrop-blur-sm"
          onClick={scrollToTop}
        >
          <ChevronUp className="size-4" />
        </Button>
      )}

      {/* Footer Stats */}
      {!loading && customers.length > 0 && (
        <div className="p-4 border-t flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Total Customers:</span>
              <span className="font-medium text-foreground">
                {totalCustomers}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Showing:</span>
              <span className="font-medium text-foreground">
                {customers.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
