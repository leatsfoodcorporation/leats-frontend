"use client";

import { Fragment, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatOrderItemQuantity } from "@/lib/uom-constants";

interface OrderItem {
  productName: string;
  variantName?: string;
  displayName?: string;
  selectedCuttingStyle?: string;
  quantity: number;
  unitPrice?: number;
  total?: number;
  totalPrice?: number; // API returns this field
  gstPercentage?: number;
  gstAmount?: number;
  totalGstAmount?: number; // Total GST for the item
  igstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  variantUom?: string;
  variantUomValue?: number;
}

interface OnlineOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  
  // GST Breakdown (based on admin and customer states)
  gstType?: string; // "cgst_sgst" or "igst"
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGstAmount?: number;
  
  // State Information for GST calculation
  adminState?: string;
  customerState?: string;
  
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  shippingCharge: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceViewProps {
  order: OnlineOrder | null;
  companySettings: {
    companyName: string;
    logoUrl: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    gstNumber?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceView({ order, companySettings, isOpen, onClose }: InvoiceViewProps) {
  const currencySymbol = useCurrency();
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number | undefined) => {
    const value = amount ?? 0;
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  const formatThermalCurrency = (amount: number | undefined) => {
    const value = amount ?? 0;
    return value.toFixed(2);
  };

  const getGstPercentageText = (orderData: OnlineOrder) => {
    const unique = Array.from(
      new Set(
        orderData.items
          .map((item) => Number(item.gstPercentage || 0))
          .filter((rate) => rate > 0)
      )
    ).sort((a, b) => a - b);

    if (unique.length === 0) return "-";
    return unique.map((rate) => `${rate}%`).join(", ");
  };

  const formatGstRateLabel = (rate: number) => {
    const normalized = Number.isInteger(rate) ? `${rate}` : rate.toFixed(2).replace(/\.?0+$/, "");
    return `${normalized}%`;
  };

  const getCgstSgstRateBreakdown = (orderData: OnlineOrder) => {
    const map = new Map<string, { rate: number; cgst: number; sgst: number }>();

    orderData.items.forEach((item) => {
      const gstRate = Number(item.gstPercentage || 0);
      if (gstRate <= 0) return;

      const splitRate = Number((gstRate / 2).toFixed(2));
      const key = splitRate.toString();
      const totalGst = Number(item.totalGstAmount ?? item.gstAmount ?? 0);
      const cgstValue = Number(item.cgstAmount ?? (totalGst > 0 ? totalGst / 2 : 0));
      const sgstValue = Number(item.sgstAmount ?? (totalGst > 0 ? totalGst / 2 : 0));

      const existing = map.get(key);
      if (existing) {
        existing.cgst += cgstValue;
        existing.sgst += sgstValue;
      } else {
        map.set(key, { rate: splitRate, cgst: cgstValue, sgst: sgstValue });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.rate - b.rate);
  };

  const getThermalLogoUrl = () => {
    if (!companySettings?.logoUrl) return "";
    try {
      const logoUrl = new URL(companySettings.logoUrl, window.location.origin);
      logoUrl.searchParams.set("ts", Date.now().toString());
      return logoUrl.toString();
    } catch {
      return `${companySettings.logoUrl}${companySettings.logoUrl.includes("?") ? "&" : "?"}ts=${Date.now()}`;
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Clone the exact modal content
    const content = printRef.current.innerHTML;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${order.invoiceNumber || order.orderNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@600&display=swap');
  @media print {
    @page { size: 80mm auto; margin: 3mm 2mm; }
    html, body { overflow-x: hidden; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, body * {
    font-family: 'Noto Sans Tamil', 'Nirmala UI', 'Latha', sans-serif !important;
    font-size: 12px;
    font-weight: 600;
    color: #000;
    line-height: 1.5;
  }
  body {
    background: #fff;
    width: 76mm;
    margin: 0 auto;
    padding: 2mm 0;
  }
  table { border-collapse: collapse; width: 100%; }
  /* Fix Next.js Image: remove absolute positioning, show as normal block */
  img {
    position: static !important;
    max-width: 160px !important;
    max-height: 80px !important;
    width: auto !important;
    height: auto !important;
    display: block !important;
    margin: 0 auto !important;
    object-fit: contain !important;
  }
  /* Kill Next.js Image wrapper spans */
  span[style*="position"] { display: contents !important; }
  /* Ensure logo container has proper height */
  .relative, [style*="position: relative"] {
    position: relative;
    width: 160px;
    height: 80px;
    margin: 0 auto;
    overflow: hidden;
  }
</style>
</head>
<body>
${content}
</body>
</html>`);

    printWindow.document.close();

    // Fix images: convert Next.js Image to simple img, remove absolute positioning
    const images = printWindow.document.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src') || img.getAttribute('srcset')?.split(' ')[0] || '';
      if (src) {
        img.setAttribute('src', src);
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.style.position = 'static';
        img.style.maxWidth = '160px';
        img.style.maxHeight = '80px';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        img.style.margin = '0 auto';
        img.style.display = 'block';
      }
    });

    // Wait for images to load
    await new Promise<void>((resolve) => {
      const imgs = printWindow.document.querySelectorAll('img');
      let loaded = 0;
      const total = imgs.length;
      if (total === 0) { resolve(); return; }
      const done = () => { loaded++; if (loaded >= total) resolve(); };
      imgs.forEach((img) => {
        if (img.complete) { done(); } else { img.onload = done; img.onerror = done; }
      });
      setTimeout(resolve, 2000);
    });

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  };

  const handleDownload = async () => {
    if (!order) return;

    setIsDownloading(true);
    try {
      // Create a temporary hidden div with the thermal print design
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '0';
      tempDiv.style.left = '0';
      tempDiv.style.zIndex = '-9999';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.width = '80mm'; // Thermal print width
      tempDiv.style.fontFamily = "'Courier New', monospace";
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.padding = '10px';
      
      // Create the thermal print HTML
      tempDiv.innerHTML = generateThermalPrintHTML(order);
      document.body.appendChild(tempDiv);

      // Ensure logo is CORS-friendly for html2canvas
      const logoImg = tempDiv.querySelector('img') as HTMLImageElement;
      if (logoImg && companySettings?.logoUrl) {
        logoImg.crossOrigin = "anonymous";
        logoImg.referrerPolicy = "no-referrer";
        logoImg.src = companySettings.logoUrl;
        // Wait for logo to load
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF using html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF with thermal print dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, Math.max(200, (canvas.height * 80) / canvas.width)], // Dynamic height based on content
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image to PDF
      if (imgHeight > pdfHeight) {
        // If content is too tall, scale it down
        const scale = pdfHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = pdfHeight;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      // Download the PDF
      pdf.save(`invoice-${order.orderNumber}.pdf`);
      
    } catch (error: unknown) {
      console.error('Error downloading PDF:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Unknown error';
      alert(`Failed to download PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateThermalPrintHTML = (order: OnlineOrder): string => {
    const deliveryAddressHtml = order.deliveryAddress ? `
      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>Delivery:</span>
        <span>${order.deliveryAddress.name || order.customerName}</span>
      </div>
      <div style="font-size: 10px; color: #333; margin: 2px 0;">
        <div>${order.deliveryAddress.addressLine1}</div>
        ${order.deliveryAddress.addressLine2 ? `<div>${order.deliveryAddress.addressLine2}</div>` : ''}
        <div>${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}</div>
      </div>
    ` : '';

    const itemRowsHtml = order.items.map(item => {
      const qtyUOM = formatOrderItemQuantity(item.quantity, item.variantUom, item.variantUomValue);
      
      return `
      <tr>
        <td style="width:40%; word-break: break-word; overflow-wrap:anywhere; vertical-align: top; font-size: 11px; padding: 1px 0.4mm;">${item.displayName || item.variantName || item.productName}</td>
        <td style="width:14%; text-align: center; white-space: nowrap; vertical-align: top; font-size: 11px; padding: 1px 0.4mm;">${qtyUOM}</td>
        <td style="width:20%; text-align: right; white-space: nowrap; vertical-align: top; font-size: 11px; padding: 1px 0.4mm;">${formatThermalCurrency(item.unitPrice)}</td>
        <td style="width:26%; text-align: right; white-space: nowrap; vertical-align: top; font-size: 11px; padding: 1px 0.4mm; font-weight: 600;">${formatThermalCurrency(item.totalPrice || item.total)}</td>
      </tr>
      ${item.selectedCuttingStyle ? `<tr><td colspan="4" style="font-size: 10px; padding: 0 2px 2px;">Cutting: ${item.selectedCuttingStyle}</td></tr>` : ''}
    `;
    }).join('');

    return `
      <!-- Invoice Header -->
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
        ${companySettings?.logoUrl ? `
          <div style="position: relative; width: 160px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <img 
              src="${getThermalLogoUrl()}" 
              alt="Company Logo" 
              style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;" 
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
            />
          </div>
        ` : ''}
      </div>

      <!-- Invoice Info -->
      <div style="margin-bottom: 10px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Invoice No:</span>
          <span style="font-weight: bold;">${order.invoiceNumber || order.orderNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Order No:</span>
          <span>${order.orderNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Date:</span>
          <span>${formatDate(order.createdAt)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Time:</span>
          <span>${new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Customer:</span>
          <span>${order.customerName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Phone:</span>
          <span>${order.customerPhone}</span>
        </div>
        ${deliveryAddressHtml}
      </div>

      <!-- Items Table -->
      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0;">
        <table style="width:76mm; table-layout: fixed; border-collapse: separate; border-spacing:0;">
          <thead>
            <tr>
              <th style="width:40%; text-align:left; font-size: 11px; border-bottom: 1px dashed #000; padding: 1px 0.4mm 3px;">Item</th>
              <th style="width:14%; text-align:center; white-space: nowrap; font-size: 11px; border-bottom: 1px dashed #000; padding: 1px 0.4mm 3px;">Qty/UOM</th>
              <th style="width:20%; text-align:right; white-space: nowrap; font-size: 11px; border-bottom: 1px dashed #000; padding: 1px 0.4mm 3px;">Price</th>
              <th style="width:26%; text-align:right; white-space: nowrap; font-size: 11px; border-bottom: 1px dashed #000; padding: 1px 0.4mm 3px;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRowsHtml}</tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
        <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
          <span>Subtotal:</span>
          <span>${formatThermalCurrency(order.subtotal)}</span>
        </div>
        ${(order.discount ?? 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; color: #16a34a;">
            <span>Discount:</span>
            <span>-${formatThermalCurrency(order.discount)}</span>
          </div>
        ` : ''}
        ${(order.couponDiscount ?? 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; color: #16a34a;">
            <span>Coupon Discount:</span>
            <span>-${formatThermalCurrency(order.couponDiscount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
          <span>Shipping:</span>
          <span>${(order.shippingCharge ?? 0) === 0 ? 'FREE' : formatThermalCurrency(order.shippingCharge)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
          <span>GST%:</span>
          <span>${getGstPercentageText(order)}</span>
        </div>
        
        ${order.gstType === 'cgst_sgst' ? `
          ${(() => {
            const breakdown = getCgstSgstRateBreakdown(order);
            if (breakdown.length > 0) {
              return breakdown.map((entry) => `
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
                  <span>CGST ${formatGstRateLabel(entry.rate)}:</span>
                  <span>${formatThermalCurrency(entry.cgst)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
                  <span>SGST ${formatGstRateLabel(entry.rate)}:</span>
                  <span>${formatThermalCurrency(entry.sgst)}</span>
                </div>
              `).join('');
            }
            return `
              ${(order.cgstAmount || 0) > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
                  <span>CGST:</span>
                  <span>${formatThermalCurrency(order.cgstAmount)}</span>
                </div>
              ` : ''}
              ${(order.sgstAmount || 0) > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
                  <span>SGST:</span>
                  <span>${formatThermalCurrency(order.sgstAmount)}</span>
                </div>
              ` : ''}
            `;
          })()}
        ` : `
          ${(order.igstAmount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
              <span>IGST:</span>
              <span>${formatThermalCurrency(order.igstAmount)}</span>
            </div>
          ` : ''}
        `}
        
        ${!order.gstType && (order.tax || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px;">
            <span>Tax (GST):</span>
            <span>${formatThermalCurrency(order.tax)}</span>
          </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">
          <span>FINAL TOTAL:</span>
          <span>${formatThermalCurrency(order.total)}</span>
        </div>
      </div>

      <!-- Payment Method -->
      <div style="margin-top: 10px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Payment:</span>
          <span style="font-weight: bold; text-transform: uppercase;">${order.paymentMethod}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
          <span>Status:</span>
          <span style="font-weight: bold; text-transform: uppercase; color: ${
            order.paymentStatus === 'completed' ? '#16a34a' : 
            order.paymentStatus === 'pending' ? '#ca8a04' : '#dc2626'
          };">${order.paymentStatus}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 10px;">
        <p style="font-weight: bold; margin: 3px 0;">Thank You, Please Come Again!</p>
        
      </div>
    `;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Invoice View
          </DialogTitle>
        </DialogHeader>

        {/* Thermal Print Preview */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-600 text-center">Thermal Print Preview (80mm)</p>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <div ref={printRef}>
              {/* Force uniform font across ALL elements — Tamil + English same font */}
              <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@600&display=swap');
                .thermal-receipt, .thermal-receipt * {
                  font-family: 'Noto Sans Tamil', 'Nirmala UI', 'Latha', sans-serif !important;
                  font-size: 12px !important;
                  font-weight: 600 !important;
                  color: #000 !important;
                  line-height: 1.5 !important;
                }
                .thermal-receipt table { border-collapse: collapse !important; }
                .thermal-receipt img { font-size: 0 !important; font-weight: normal !important; }
              `}</style>
              <div className="thermal-receipt">
              {/* Invoice Header */}
              <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
                {companySettings?.logoUrl && (
                  <div className="relative w-40 h-20 flex items-center justify-center overflow-hidden mx-auto">
                    <Image
                      src={companySettings.logoUrl}
                      alt="Company Logo"
                      fill
                      sizes="160px"
                      className="object-contain"
                      priority={true}
                      quality={90}
                    />
                  </div>
                )}
                {companySettings?.companyName && (
                  <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>{companySettings.companyName}</div>
                )}
                {companySettings?.address && (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{companySettings.address}</div>
                )}
                {(companySettings?.city || companySettings?.state) && (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{companySettings.city}{companySettings.state ? `, ${companySettings.state}` : ''} {companySettings.zipCode || ''}</div>
                )}
                {companySettings?.phone && (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Ph: {companySettings.phone}</div>
                )}
                {companySettings?.gstNumber && (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>GSTIN: {companySettings.gstNumber}</div>
                )}
              </div>

              {/* Invoice Info */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Invoice No:</span>
                  <span>{order.invoiceNumber || order.orderNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Order No:</span>
                  <span>{order.orderNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Date:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Time:</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Customer:</span>
                  <span>{order.customerName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Phone:</span>
                  <span>{order.customerPhone}</span>
                </div>
                {order.deliveryAddress && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                      <span>Delivery:</span>
                      <span>{order.deliveryAddress.name || order.customerName}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "2px" }}>
                      <div>{order.deliveryAddress.addressLine1}</div>
                      {order.deliveryAddress.addressLine2 && (
                        <div>{order.deliveryAddress.addressLine2}</div>
                      )}
                      <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Items Table */}
              <div style={{ borderTop: "2px dashed #000", borderBottom: "2px dashed #000", padding: "6px 0", margin: "10px 0" }}>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "12px", fontWeight: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px dashed #000" }}>
                      <th style={{ textAlign: "left", fontWeight: 700, paddingBottom: "4px", width: "40%" }}>Item</th>
                      <th style={{ textAlign: "center", fontWeight: 700, paddingBottom: "4px", width: "14%" }}>Qty</th>
                      <th style={{ textAlign: "right", fontWeight: 700, paddingBottom: "4px", width: "20%" }}>Price</th>
                      <th style={{ textAlign: "right", fontWeight: 700, paddingBottom: "4px", width: "26%" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => {
                      return (
                        <Fragment key={`item-${index}`}>
                          <tr>
                            <td style={{ verticalAlign: "top", padding: "2px 4px 2px 0", wordBreak: "break-word", fontWeight: 700 }}>{item.displayName || item.variantName || item.productName}</td>
                            <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center", whiteSpace: "nowrap", fontWeight: 700 }}>{formatOrderItemQuantity(item.quantity, item.variantUom, item.variantUomValue)}</td>
                            <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>{formatCurrency(item.totalPrice || item.total)}</td>
                          </tr>
                          {item.selectedCuttingStyle && (
                            <tr>
                              <td colSpan={4} style={{ fontSize: "12px", fontWeight: 700, paddingBottom: "2px" }}>Cutting: {item.selectedCuttingStyle}</td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {(order.couponDiscount ?? 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                    <span>Coupon Discount:</span>
                    <span>-{formatCurrency(order.couponDiscount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Shipping:</span>
                  <span>{(order.shippingCharge ?? 0) === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>GST%:</span>
                  <span>{getGstPercentageText(order)}</span>
                </div>

                {/* GST Breakdown */}
                {order.gstType === 'cgst_sgst' ? (
                  <>
                    {(() => {
                      const breakdown = getCgstSgstRateBreakdown(order);
                      if (breakdown.length > 0) {
                        return breakdown.map((entry) => (
                          <Fragment key={`gst-split-${entry.rate}`}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                              <span>CGST {formatGstRateLabel(entry.rate)}:</span>
                              <span>{formatCurrency(entry.cgst)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                              <span>SGST {formatGstRateLabel(entry.rate)}:</span>
                              <span>{formatCurrency(entry.sgst)}</span>
                            </div>
                          </Fragment>
                        ));
                      }
                      return (
                        <>
                          {(order.cgstAmount || 0) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                              <span>CGST:</span>
                              <span>{formatCurrency(order.cgstAmount)}</span>
                            </div>
                          )}
                          {(order.sgstAmount || 0) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                              <span>SGST:</span>
                              <span>{formatCurrency(order.sgstAmount)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {(order.igstAmount || 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                        <span>IGST:</span>
                        <span>{formatCurrency(order.igstAmount)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Fallback for orders without GST breakdown */}
                {!order.gstType && (order.tax || 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                    <span>Tax (GST):</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, borderTop: "2px solid #000", paddingTop: "6px", marginTop: "6px" }}>
                  <span>FINAL TOTAL:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginTop: "10px", borderTop: "1px dashed #000", paddingTop: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Payment:</span>
                  <span style={{ textTransform: "uppercase" }}>{order.paymentMethod}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, margin: "3px 0" }}>
                  <span>Status:</span>
                  <span style={{
                    textTransform: "uppercase",
                    color: order.paymentStatus === 'completed' ? '#16a34a' :
                           order.paymentStatus === 'pending' ? '#ca8a04' : '#dc2626'
                  }}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "10px", borderTop: "2px dashed #000" }}>
                <p style={{ marginBottom: "4px" }}>Thank You, Please Come Again!</p>
                {companySettings?.companyName && (
                  <p>{companySettings.companyName}</p>
                )}
              </div>
              </div>{/* end thermal-receipt */}
            </div>{/* end printRef */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handlePrint}
            className="flex-1"
            variant="default"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1"
            variant="outline"
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full mt-2"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
