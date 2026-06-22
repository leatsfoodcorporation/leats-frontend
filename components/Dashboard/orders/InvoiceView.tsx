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
    if (!order || !printRef.current) return;

    setIsDownloading(true);
    try {
      // Use exact same modal content for PDF — same as Print Invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '0';
      tempDiv.style.left = '0';
      tempDiv.style.zIndex = '-9999';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.width = '80mm';
      tempDiv.style.padding = '10px';
      tempDiv.innerHTML = printRef.current.innerHTML;
      document.body.appendChild(tempDiv);

      // Apply same thermal-receipt styles
      const style = document.createElement('style');
      style.textContent = `
        .thermal-receipt, .thermal-receipt * {
          font-family: 'Noto Sans Tamil', 'Nirmala UI', 'Latha', sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #000 !important;
          line-height: 1.5 !important;
        }
        .thermal-receipt table { border-collapse: collapse !important; }
        .thermal-receipt img { font-size: 0 !important; font-weight: normal !important; }
      `;
      tempDiv.prepend(style);

      // Fix Next.js Image elements
      const images = tempDiv.querySelectorAll('img');
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
          img.crossOrigin = 'anonymous';
        }
      });

      // Wait for images + rendering
      await new Promise(resolve => setTimeout(resolve, 800));

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, Math.max(200, (canvas.height * 80) / canvas.width)],
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight > pdfHeight) {
        const scale = pdfHeight / imgHeight;
        pdf.addImage(imgData, 'JPEG', (pdfWidth - imgWidth * scale) / 2, 0, imgWidth * scale, pdfHeight);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`invoice-${order.orderNumber}.pdf`);

    } catch (error: unknown) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
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
