"use client";

import { useState } from "react";
import Image from "next/image";
import { type CompanySettings } from "@/services/online-services/webSettingsService";

interface Footer02Props {
  initialCompanySettings: CompanySettings | null;
}

export default function Footer02({ initialCompanySettings }: Footer02Props) {
  const [companySettings] = useState<CompanySettings | null>(
    initialCompanySettings,
  );

  const currentYear = new Date().getFullYear();

  const paymentMethods = [
    { name: "Visa", image: "/payment/visa.png" },
    { name: "Master Card", image: "/payment/logo.png" },
    { name: "Google Pay", image: "/payment/google-pay.png" },
    { name: "Cash on Delivery", image: "/payment/cash-on-delivery.png" },
  ];

  return (
    <div className="bg-[#f1f1f1f1] text-gray-400 py-3 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-center sm:text-left text-black">
            {companySettings?.companyName || "Leats"} © {currentYear}. All
            rights reserved.
          </p>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
            <span className="text-xs text-black sm:text-sm">We Accept:</span>
            <div className="flex items-center gap-2 sm:gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="relative h-6 w-12 sm:h-11 sm:w-14 flex items-center justify-center"
                  title={method.name}
                >
                  <Image
                    src={method.image}
                    alt={method.name}
                    fill
                    className="h-12 w-auto object-contain"
                    // sizes="(max-width: 640px) 48px, 56px"
                    priority={false}
                    quality={90}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
