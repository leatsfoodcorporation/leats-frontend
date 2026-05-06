"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import { useCurrency } from '@/hooks/useCurrency';
import * as faqService from '@/services/web/faqService';


export default function FAQPage() {
  const currencySymbol = useCurrency();

  const [faqCategories, setFaqCategories] = useState<Array<{ id: string | number; title: string; sortOrder?: number | null; faqs: { question: string; answer: string }[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    faqService.getActiveFaqs()
      .then((items) => {
        if (!mounted) return;
        // Map backend Faq model to categories used by this page
        const mapped = items.map((f: any) => ({
          id: f.id,
          title: f.title,
          sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : null,
          faqs: Array.isArray(f.contents)
            ? f.contents.map((c: any) => ({ question: c.title || '', answer: c.description || '' }))
            : [],
        }));

        // Sort categories by sortOrder (nulls last)
        mapped.sort((a, b) => {
          const sa = a.sortOrder == null ? Number.MAX_SAFE_INTEGER : a.sortOrder;
          const sb = b.sortOrder == null ? Number.MAX_SAFE_INTEGER : b.sortOrder;
          return sa - sb;
        });

        setFaqCategories(mapped);
      })
      .catch((err) => console.error('Failed to load FAQs', err))
      .finally(() => setLoading(false));

    return () => { mounted = false; };
  }, []);

  const toggleFAQ = (categoryId: string | number, faqIndex: number) => { 
    const key = `${categoryId}-${faqIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Link href="/" className="text-[#E63946] hover:underline">Home</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-800 font-medium">FAQ</span>
            </div>
          </div>
        </div>

        <div className="bg-[#E63946] py-6 sm:py-10">
          <div className="container mx-auto px-3 sm:px-4 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Frequently Asked Questions</h1>
            <p className="text-white/80 mb-4 sm:mb-6 text-sm sm:text-base">Find answers to common questions</p>
          
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">{category.title}</h2>
                <div className="space-y-2">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.id}-${index}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={key} className="border-b last:border-0 pb-2 last:pb-0">
                        <button
                          onClick={() => toggleFAQ(category.id, index)}
                          className="w-full flex items-center justify-between text-left py-2 hover:text-[#E63946]"
                        >
                          <span className="font-medium text-gray-800 text-xs sm:text-sm pr-2">{faq.question}</span>
                          <IconChevronDown size={14} className={`text-gray-500 transition-transform flex-shrink-0 sm:w-4 sm:h-4 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <p className="text-gray-600 text-xs sm:text-sm pb-2">{faq.answer}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-6 sm:mt-8 bg-[#E63946] rounded-lg p-4 sm:p-6 text-center text-white">
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Still have questions?</h3>
            <p className="mb-3 sm:mb-4 opacity-90 text-sm">Our support team is here to help</p>
            <Link href="/contact" className="inline-block bg-white text-[#E63946] px-5 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-100 text-sm">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    
  );
}
