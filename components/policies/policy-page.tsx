"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { Policy } from "@/services/online-services/policyService";

interface PolicyPageProps {
  initialPolicy: Policy | null;
  slug: string;
  defaultTitle: string;
  defaultContent?: React.ReactNode;
}

export const PolicyPage = ({ initialPolicy, slug, defaultTitle, defaultContent }: PolicyPageProps) => {
  const [policy] = useState<Policy | null>(initialPolicy);

  // If no policy found, show default content
  if (!policy) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#e63946]">
                Home
              </Link>
              <IconChevronRight size={14} className="text-gray-400 sm:w-4 sm:h-4" />
              <span className="text-gray-800 font-medium truncate">{defaultTitle}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-[90rem] mx-auto bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
            {defaultContent || (
              <div className="text-center py-8 sm:py-12">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">{defaultTitle}</h1>
                <p className="text-xs sm:text-sm text-gray-500">This policy is currently being updated. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#e63946]">
              Home
            </Link>
            <IconChevronRight size={14} className="text-gray-400 sm:w-4 sm:h-4" />
            <span className="text-gray-800 font-medium truncate">{policy.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-[90rem] mx-auto bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">{policy.title}</h1>

          {/* Force responsive styles on raw HTML from dangerouslySetInnerHTML */}
          <style>{`
            .policy-content * {
              max-width: 100% !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              box-sizing: border-box !important;
            }
            .policy-content img,
            .policy-content video,
            .policy-content iframe,
            .policy-content table {
              max-width: 100% !important;
              height: auto !important;
              overflow-x: auto !important;
            }
            .policy-content table {
              display: block !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            .policy-content pre, .policy-content code {
              white-space: pre-wrap !important;
              word-break: break-all !important;
            }
            @media (max-width: 640px) {
              .policy-content h1 { font-size: 1.25rem !important; }
              .policy-content h2 { font-size: 1.1rem !important; }
              .policy-content h3 { font-size: 1rem !important; }
              .policy-content h4, .policy-content h5, .policy-content h6 { font-size: 0.9rem !important; }
              .policy-content p, .policy-content li, .policy-content td, .policy-content th,
              .policy-content span, .policy-content div, .policy-content a {
                font-size: 0.8rem !important;
                line-height: 1.5 !important;
              }
              .policy-content ul, .policy-content ol {
                padding-left: 1.2rem !important;
              }
              .policy-content [style*="font-size"] {
                font-size: inherit !important;
              }
              .policy-content [style*="width"] {
                width: auto !important;
                max-width: 100% !important;
              }
              .policy-content [style*="padding"] {
                padding: 4px !important;
              }
            }
          `}</style>
          <div
            className="policy-content prose prose-sm sm:prose-base md:prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </div>
      </div>
    </div>
  );
};
