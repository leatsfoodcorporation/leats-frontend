"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, CheckCircle } from "lucide-react";
import { CartItem, Customer } from "./pos-interface";
import { formatOrderItemQuantity } from "@/lib/uom-constants";

interface PurchaseSuccessModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNumber: string;
  orderDate: string;
  cartItems: CartItem[];
  customer: Customer | null;
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
  subtotal: number;
  total: number;
  roundingOff: number;
  paymentMethod: string;
  formatCurrency: (amount: number, options?: { showSymbol?: boolean; showCode?: boolean; precision?: number }) => string;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  open,
  onClose,
  invoiceNumber,
  orderDate,
  cartItems,
  customer,
  companySettings,
  subtotal,
  total,
  roundingOff,
  paymentMethod,
  formatCurrency,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = printRef.current.innerHTML;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNumber}</title>
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
  body { background: #fff; width: 76mm; margin: 0 auto; padding: 2mm 0; }
  table { border-collapse: collapse; width: 100%; }
  img { position: static !important; max-width: 160px !important; max-height: 80px !important; width: auto !important; height: auto !important; display: block !important; margin: 0 auto !important; object-fit: contain !important; }
  span[style*="position"] { display: contents !important; }
  .relative { position: relative; width: 160px; height: 80px; margin: 0 auto; overflow: hidden; }
</style>
</head>
<body>
${content}
</body>
</html>`);

    printWindow.document.close();

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
        img.style.objectFit = 'contain';
        img.style.margin = '0 auto';
        img.style.display = 'block';
      }
    });

    await new Promise<void>((resolve) => {
      const imgs = printWindow.document.querySelectorAll('img');
      let loaded = 0;
      const t = imgs.length;
      if (t === 0) { resolve(); return; }
      const done = () => { loaded++; if (loaded >= t) resolve(); };
      imgs.forEach((img) => { if (img.complete) done(); else { img.onload = done; img.onerror = done; } });
      setTimeout(resolve, 2000);
    });

    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 200);
  };

  const handleDownload = async () => {
    if (!printRef.current) return;

    try {
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

      await new Promise(resolve => setTimeout(resolve, 800));

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(tempDiv, {
        scale: 3, useCORS: true, allowTaint: false, logging: false,
        backgroundColor: '#ffffff', width: tempDiv.scrollWidth, height: tempDiv.scrollHeight,
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF({
        orientation: 'portrait', unit: 'mm',
        format: [80, Math.max(200, (canvas.height * 80) / canvas.width)],
        compress: true,
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgW = pdfW;
      const imgH = (canvas.height * pdfW) / canvas.width;

      if (imgH > pdfH) {
        const s = pdfH / imgH;
        pdf.addImage(imgData, 'JPEG', (pdfW - imgW * s) / 2, 0, imgW * s, pdfH);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      }

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Compute item data for display
  const computeItem = (item: CartItem) => {
    const itemTotal = item.price * item.quantity;
    let discountAmount = 0;
    if (item.discount && item.discount > 0) {
      discountAmount = item.discountType === "flat" ? item.discount : (itemTotal * item.discount) / 100;
    }
    const finalAmount = itemTotal - discountAmount;
    const gstPercentage = item.gstPercentage || 0;
    return { finalAmount, gstPercentage, discountAmount };
  };

  const ROW = { display: "flex" as const, justifyContent: "space-between" as const, fontSize: "12px", fontWeight: 700, margin: "3px 0" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            Purchase Completed Successfully
          </DialogTitle>
        </DialogHeader>

        {/* Thermal Print Preview */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-600 text-center">Thermal Print Preview (80mm)</p>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <div ref={printRef}>
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
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
                {companySettings?.logoUrl ? (
                  <div className="relative w-40 h-20 flex items-center justify-center overflow-hidden mx-auto">
                    <Image src={companySettings.logoUrl} alt="Logo" fill sizes="160px" className="object-contain" priority quality={90} />
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{companySettings?.companyName || 'LEATS'}</div>
                )}
                {companySettings?.companyName && <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>{companySettings.companyName}</div>}
                {companySettings?.address && <div style={{ fontSize: "12px", fontWeight: 700 }}>{companySettings.address}</div>}
                {(companySettings?.city || companySettings?.state) && (
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{[companySettings?.city, companySettings?.state, companySettings?.zipCode].filter(Boolean).join(', ')}</div>
                )}
                {companySettings?.phone && <div style={{ fontSize: "12px", fontWeight: 700 }}>Ph: {companySettings.phone}</div>}
                {companySettings?.gstNumber && <div style={{ fontSize: "12px", fontWeight: 700 }}>GSTIN: {companySettings.gstNumber}</div>}
              </div>

              {/* Invoice Info */}
              <div style={{ marginBottom: "10px" }}>
                <div style={ROW}><span>Invoice No:</span><span>{invoiceNumber}</span></div>
                <div style={ROW}><span>Date:</span><span>{orderDate}</span></div>
                <div style={ROW}><span>Time:</span><span>{new Date().toLocaleTimeString()}</span></div>
                <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
                <div style={ROW}><span>Customer:</span><span>{customer?.name || "Walk-in Customer"}</span></div>
                {customer?.phone && <div style={ROW}><span>Phone:</span><span>{customer.phone}</span></div>}
              </div>

              {/* Items Table — 4 columns (Item, Qty, Price, Total) — GST below */}
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
                    {cartItems.map((item, index) => {
                      const { finalAmount } = computeItem(item);
                      return (
                        <tr key={index}>
                          <td style={{ verticalAlign: "top", padding: "2px 4px 2px 0", wordBreak: "break-word", fontWeight: 700 }}>{item.name}</td>
                          <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center", whiteSpace: "nowrap", fontWeight: 700 }}>
                            {item.variantUom && item.variantUomValue ? formatOrderItemQuantity(item.quantity, item.variantUom, item.variantUomValue) : item.quantity}
                          </td>
                          <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>{formatCurrency(item.price)}</td>
                          <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>{formatCurrency(finalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals with GST breakdown below */}
              <div style={{ marginTop: "10px" }}>
                <div style={ROW}><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                {subtotal !== total && (
                  <div style={ROW}><span>Discount:</span><span>-{formatCurrency(subtotal - total)}</span></div>
                )}
                {roundingOff !== 0 && (
                  <div style={ROW}><span>Rounding Off:</span><span>{roundingOff >= 0 ? '+' : ''}{formatCurrency(Math.abs(roundingOff))}</span></div>
                )}
                {/* GST % */}
                {(() => {
                  const gstRates = [...new Set(cartItems.map(item => item.gstPercentage || 0).filter(r => r > 0))].sort((a, b) => a - b);
                  if (gstRates.length > 0) {
                    return <div style={ROW}><span>GST%:</span><span>{gstRates.map(r => `${r}%`).join(', ')}</span></div>;
                  }
                  return null;
                })()}
                {/* CGST/SGST breakdown */}
                {(() => {
                  const gstRates = [...new Set(cartItems.map(item => item.gstPercentage || 0).filter(r => r > 0))].sort((a, b) => a - b);
                  return gstRates.map(rate => {
                    const halfRate = rate / 2;
                    const itemsWithRate = cartItems.filter(item => (item.gstPercentage || 0) === rate);
                    const totalGst = itemsWithRate.reduce((sum, item) => {
                      const { finalAmount, gstPercentage } = computeItem(item);
                      return sum + (finalAmount - finalAmount / (1 + gstPercentage / 100));
                    }, 0);
                    const cgst = totalGst / 2;
                    const sgst = totalGst / 2;
                    return (
                      <React.Fragment key={rate}>
                        <div style={ROW}><span>CGST {halfRate}%:</span><span>{formatCurrency(cgst)}</span></div>
                        <div style={ROW}><span>SGST {halfRate}%:</span><span>{formatCurrency(sgst)}</span></div>
                      </React.Fragment>
                    );
                  });
                })()}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, borderTop: "2px solid #000", paddingTop: "6px", marginTop: "6px" }}>
                  <span>FINAL TOTAL:</span>
                  <span>{formatCurrency(total + roundingOff)}</span>
                </div>
              </div>

              {/* Payment */}
              <div style={{ marginTop: "10px", borderTop: "1px dashed #000", paddingTop: "6px" }}>
                <div style={ROW}><span>Payment:</span><span style={{ textTransform: "uppercase" }}>{paymentMethod}</span></div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "10px", borderTop: "2px dashed #000", fontSize: "12px", fontWeight: 700 }}>
                <p style={{ marginBottom: "4px" }}>Thank You, Please Come Again!</p>
                {companySettings?.companyName && <p>{companySettings.companyName}</p>}
              </div>
              </div>{/* end thermal-receipt */}
            </div>{/* end printRef */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button onClick={handlePrint} className="flex-1" variant="default">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
          <Button onClick={handleDownload} className="flex-1" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <Button onClick={onClose} variant="ghost" className="w-full mt-2">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
