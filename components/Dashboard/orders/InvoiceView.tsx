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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const thermalLogoUrl = getThermalLogoUrl();

    const DASH = '------------------------------------------------';
    const DOUBLE_DASH = '================================================';

    const deliveryAddressText = order.deliveryAddress ? `
      <div class="row"><span>Delivery To</span><span>${order.deliveryAddress.name || order.customerName}</span></div>
      <div class="addr">${order.deliveryAddress.addressLine1 || ''}${order.deliveryAddress.addressLine2 ? ', ' + order.deliveryAddress.addressLine2 : ''}</div>
      <div class="addr">${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} - ${order.deliveryAddress.pincode || ''}</div>
    ` : '';

    const itemRowsHtml = order.items.map(item => {
      const name = item.displayName || item.variantName || item.productName;
      const qty = item.quantity;
      const rate = formatThermalCurrency(item.unitPrice);
      const total = formatThermalCurrency(item.totalPrice || item.total);
      const cutting = item.selectedCuttingStyle ? `<div class="item-sub">  Cutting: ${item.selectedCuttingStyle}</div>` : '';
      return `<div class="item-row">
        <div class="item-name">${name}${cutting}</div>
        <div class="item-detail"><span>${qty} x ${rate}</span><span>${total}</span></div>
      </div>`;
    }).join('');

    // GST rows
    let gstRowsHtml = '';
    if (order.gstType === 'cgst_sgst') {
      const breakdown = getCgstSgstRateBreakdown(order);
      if (breakdown.length > 0) {
        breakdown.forEach(entry => {
          gstRowsHtml += `<div class="row"><span>CGST @ ${formatGstRateLabel(entry.rate)}</span><span>${formatThermalCurrency(entry.cgst)}</span></div>`;
          gstRowsHtml += `<div class="row"><span>SGST @ ${formatGstRateLabel(entry.rate)}</span><span>${formatThermalCurrency(entry.sgst)}</span></div>`;
        });
      } else {
        if ((order.cgstAmount || 0) > 0) gstRowsHtml += `<div class="row"><span>CGST</span><span>${formatThermalCurrency(order.cgstAmount)}</span></div>`;
        if ((order.sgstAmount || 0) > 0) gstRowsHtml += `<div class="row"><span>SGST</span><span>${formatThermalCurrency(order.sgstAmount)}</span></div>`;
      }
    } else if ((order.igstAmount || 0) > 0) {
      gstRowsHtml += `<div class="row"><span>IGST</span><span>${formatThermalCurrency(order.igstAmount)}</span></div>`;
    }
    if (!order.gstType && (order.tax || 0) > 0) {
      gstRowsHtml += `<div class="row"><span>Tax (GST)</span><span>${formatThermalCurrency(order.tax)}</span></div>`;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${order.invoiceNumber || order.orderNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  @media print {
    @page { size: 80mm auto; margin: 2mm 3mm; }
    html, body { overflow-x: hidden; }
    body { margin: 0; padding: 0; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Roboto Mono', 'Lucida Console', 'Consolas', monospace;
    font-size: 11px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    width: 72mm;
    margin: 0 auto;
    padding: 2mm 0;
    -webkit-font-smoothing: none;
    text-rendering: optimizeSpeed;
    letter-spacing: -0.3px;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .dash { overflow: hidden; white-space: nowrap; font-size: 11px; line-height: 1; margin: 3px 0; color: #000; }
  .double-dash { overflow: hidden; white-space: nowrap; font-size: 11px; line-height: 1; margin: 3px 0; color: #000; }
  .header { text-align: center; margin-bottom: 2px; }
  .header .company { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; margin: 3px 0; }
  .header .info { font-size: 9px; line-height: 1.3; }
  .header .gstin { font-size: 9px; margin-top: 2px; }
  .section { margin: 1px 0; }
  .row { display: flex; justify-content: space-between; font-size: 10px; line-height: 1.5; }
  .addr { font-size: 9px; line-height: 1.3; padding-left: 2px; }
  .item-row { margin: 2px 0; }
  .item-name { font-size: 10px; font-weight: bold; }
  .item-sub { font-size: 9px; font-weight: normal; }
  .item-detail { display: flex; justify-content: space-between; font-size: 10px; }
  .totals .row { font-size: 10px; }
  .grand-total { font-size: 12px; font-weight: bold; margin-top: 3px; padding-top: 3px; display: flex; justify-content: space-between; }
  .footer { text-align: center; font-size: 9px; margin-top: 2px; }
  .footer .thanks { font-size: 10px; font-weight: bold; margin: 3px 0; }
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${companySettings?.logoUrl ? `
      <div style="width: 100px; height: 40px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center;">
        <img id="thermal-logo" src="${thermalLogoUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous" referrerpolicy="no-referrer"/>
      </div>
    ` : ''}
    <div class="company">${companySettings?.companyName || 'LEATS'}</div>
    ${companySettings?.address ? `<div class="info">${companySettings.address}</div>` : ''}
    ${companySettings?.city ? `<div class="info">${companySettings.city}, ${companySettings?.state || ''} ${companySettings?.zipCode || ''}</div>` : ''}
    ${companySettings?.phone ? `<div class="info">Ph: ${companySettings.phone}</div>` : ''}
    ${companySettings?.gstNumber ? `<div class="gstin">GSTIN: ${companySettings.gstNumber}</div>` : ''}
  </div>
  <div class="dash">${DASH}</div>

  <!-- Bill Info -->
  <div class="section">
    <div class="row"><span>Bill No</span><span class="bold">${order.invoiceNumber || order.orderNumber}</span></div>
    <div class="row"><span>Order No</span><span>${order.orderNumber}</span></div>
    <div class="row"><span>Date</span><span>${formatDate(order.createdAt)}</span></div>
    <div class="row"><span>Time</span><span>${new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
  </div>
  <div class="dash">${DASH}</div>

  <!-- Customer Info -->
  <div class="section">
    <div class="row"><span>Customer</span><span>${order.customerName}</span></div>
    <div class="row"><span>Phone</span><span>${order.customerPhone || 'N/A'}</span></div>
    ${deliveryAddressText}
  </div>
  <div class="double-dash">${DOUBLE_DASH}</div>

  <!-- Items -->
  <div class="section">
    ${itemRowsHtml}
  </div>
  <div class="double-dash">${DOUBLE_DASH}</div>

  <!-- Totals -->
  <div class="totals">
    <div class="row"><span>Sub Total</span><span>${formatThermalCurrency(order.subtotal)}</span></div>
    ${(order.discount ?? 0) > 0 ? `<div class="row"><span>Discount</span><span>-${formatThermalCurrency(order.discount)}</span></div>` : ''}
    ${(order.couponDiscount ?? 0) > 0 ? `<div class="row"><span>Coupon (${order.couponCode || ''})</span><span>-${formatThermalCurrency(order.couponDiscount)}</span></div>` : ''}
    ${(order.shippingCharge ?? 0) > 0 ? `<div class="row"><span>Shipping</span><span>${formatThermalCurrency(order.shippingCharge)}</span></div>` : `<div class="row"><span>Shipping</span><span>FREE</span></div>`}
    ${gstRowsHtml}
    <div class="dash">${DASH}</div>
    <div class="grand-total"><span>GRAND TOTAL</span><span>${currencySymbol}${formatThermalCurrency(order.total)}</span></div>
    <div class="dash">${DASH}</div>
  </div>

  <!-- Payment -->
  <div class="section">
    <div class="row"><span>Payment</span><span class="bold">${order.paymentMethod.toUpperCase()}</span></div>
    <div class="row"><span>Status</span><span class="bold">${order.paymentStatus.toUpperCase()}</span></div>
  </div>
  <div class="dash">${DASH}</div>

  <!-- Footer -->
  <div class="footer">
    <div class="thanks">Thank You, Visit Again!</div>
    <div>${companySettings?.companyName || 'LEATS'}</div>
  </div>
</body>
</html>`);

    printWindow.document.close();

    const waitForLogo = async () => {
      if (!thermalLogoUrl) return;
      const logo = printWindow.document.getElementById("thermal-logo") as HTMLImageElement | null;
      if (!logo || logo.complete) return;
      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          resolve();
        };
        logo.onload = done;
        logo.onerror = done;
        setTimeout(done, 1500);
      });
    };

    await waitForLogo();

    // Wait for Google Font (Roboto Mono) to load before printing
    await new Promise<void>((resolve) => {
      if (printWindow.document.fonts && printWindow.document.fonts.ready) {
        printWindow.document.fonts.ready.then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
      setTimeout(resolve, 2000); // Max 2s wait for font
    });

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
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

        {/* Thermal Print Preview — matches print output exactly */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-600 text-center">Thermal Print Preview (80mm)</p>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto" style={{ fontFamily: "'Roboto Mono', 'Lucida Console', 'Consolas', monospace", fontSize: "11px", lineHeight: "1.3", letterSpacing: "-0.3px" }}>
            <div ref={printRef}>
              {/* Header */}
              <div className="text-center mb-1">
                {companySettings?.logoUrl && (
                  <div className="relative w-24 h-10 flex items-center justify-center overflow-hidden mx-auto mb-1">
                    <Image src={companySettings.logoUrl} alt="Logo" fill sizes="96px" className="object-contain" priority quality={90} />
                  </div>
                )}
                <div className="text-[13px] font-bold tracking-wide">{companySettings?.companyName || 'LEATS'}</div>
                {companySettings?.address && <div className="text-[9px]">{companySettings.address}</div>}
                {companySettings?.city && <div className="text-[9px]">{companySettings.city}, {companySettings?.state} {companySettings?.zipCode}</div>}
                {companySettings?.phone && <div className="text-[9px]">Ph: {companySettings.phone}</div>}
                {companySettings?.gstNumber && <div className="text-[9px]">GSTIN: {companySettings.gstNumber}</div>}
              </div>
              <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">------------------------------------------------</div>

              {/* Bill Info */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]"><span>Bill No</span><span className="font-bold">{order.invoiceNumber || order.orderNumber}</span></div>
                <div className="flex justify-between text-[10px]"><span>Order No</span><span>{order.orderNumber}</span></div>
                <div className="flex justify-between text-[10px]"><span>Date</span><span>{formatDate(order.createdAt)}</span></div>
                <div className="flex justify-between text-[10px]"><span>Time</span><span>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
              </div>
              <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">------------------------------------------------</div>

              {/* Customer Info */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]"><span>Customer</span><span>{order.customerName}</span></div>
                <div className="flex justify-between text-[10px]"><span>Phone</span><span>{order.customerPhone || 'N/A'}</span></div>
                {order.deliveryAddress && (
                  <>
                    <div className="flex justify-between text-[10px]"><span>Delivery To</span><span>{order.deliveryAddress.name || order.customerName}</span></div>
                    <div className="text-[9px] leading-tight">
                      <div>{order.deliveryAddress.addressLine1}{order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}</div>
                      <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">================================================</div>

              {/* Items */}
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={`item-${index}`}>
                    <div className="text-[10px] font-bold break-words">
                      {item.displayName || item.variantName || item.productName}
                      {item.selectedCuttingStyle && <div className="font-normal text-[9px]">&nbsp;&nbsp;Cutting: {item.selectedCuttingStyle}</div>}
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>{item.quantity} x {formatThermalCurrency(item.unitPrice)}</span>
                      <span>{formatThermalCurrency(item.totalPrice || item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">================================================</div>

              {/* Totals */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]"><span>Sub Total</span><span>{formatThermalCurrency(order.subtotal)}</span></div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-[10px]"><span>Discount</span><span>-{formatThermalCurrency(order.discount)}</span></div>
                )}
                {(order.couponDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-[10px]"><span>Coupon ({order.couponCode || ''})</span><span>-{formatThermalCurrency(order.couponDiscount)}</span></div>
                )}
                <div className="flex justify-between text-[10px]"><span>Shipping</span><span>{(order.shippingCharge ?? 0) === 0 ? 'FREE' : formatThermalCurrency(order.shippingCharge)}</span></div>
                {/* GST Breakdown */}
                {order.gstType === 'cgst_sgst' ? (
                  <>
                    {(() => {
                      const breakdown = getCgstSgstRateBreakdown(order);
                      if (breakdown.length > 0) {
                        return breakdown.map((entry) => (
                          <Fragment key={`gst-${entry.rate}`}>
                            <div className="flex justify-between text-[10px]"><span>CGST @ {formatGstRateLabel(entry.rate)}</span><span>{formatThermalCurrency(entry.cgst)}</span></div>
                            <div className="flex justify-between text-[10px]"><span>SGST @ {formatGstRateLabel(entry.rate)}</span><span>{formatThermalCurrency(entry.sgst)}</span></div>
                          </Fragment>
                        ));
                      }
                      return (
                        <>
                          {(order.cgstAmount || 0) > 0 && <div className="flex justify-between text-[10px]"><span>CGST</span><span>{formatThermalCurrency(order.cgstAmount)}</span></div>}
                          {(order.sgstAmount || 0) > 0 && <div className="flex justify-between text-[10px]"><span>SGST</span><span>{formatThermalCurrency(order.sgstAmount)}</span></div>}
                        </>
                      );
                    })()}
                  </>
                ) : (order.igstAmount || 0) > 0 ? (
                  <div className="flex justify-between text-[10px]"><span>IGST</span><span>{formatThermalCurrency(order.igstAmount)}</span></div>
                ) : null}
                {!order.gstType && (order.tax || 0) > 0 && (
                  <div className="flex justify-between text-[10px]"><span>Tax (GST)</span><span>{formatThermalCurrency(order.tax)}</span></div>
                )}
                <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">------------------------------------------------</div>
                <div className="flex justify-between text-[12px] font-bold">
                  <span>GRAND TOTAL</span>
                  <span>{currencySymbol}{formatThermalCurrency(order.total)}</span>
                </div>
                <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">------------------------------------------------</div>
              </div>

              {/* Payment */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]"><span>Payment</span><span className="font-bold uppercase">{order.paymentMethod}</span></div>
                <div className="flex justify-between text-[10px]"><span>Status</span><span className="font-bold uppercase">{order.paymentStatus}</span></div>
              </div>
              <div className="text-[11px] leading-none my-1 text-gray-800 overflow-hidden whitespace-nowrap">------------------------------------------------</div>

              {/* Footer */}
              <div className="text-center">
                <div className="text-[10px] font-bold">Thank You, Visit Again!</div>
                <div className="text-[9px]">{companySettings?.companyName || 'LEATS'}</div>
              </div>
            </div>
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
