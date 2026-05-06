"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DynamicProductCard from "@/components/Home/DynamicProductCard";
import type { Product } from "@/services/online-services/frontendProductService";

interface ComboSectionProps {
  products: Product[];
}

export default function ComboSection({ products }: ComboSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 bg-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold ">Value Combo Packs</h2>
            <p className="text-muted-foreground mt-2">Save more with our curated bundles</p>
          </div>
          <Link 
            href="/products?type=combo" 
            className="flex items-center gap-2  font-semibold  transition-colors"
          >
            View All Combos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {products.map((product) => (
            <DynamicProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
