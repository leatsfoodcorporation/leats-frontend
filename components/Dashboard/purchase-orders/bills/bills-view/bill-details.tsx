"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  Download,
  ArrowLeft,
  MapPin,
  Truck,
  Store,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { Bill } from "@/services/billService";
import { useCurrency } from "@/hooks/useCurrency";
import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import Image from "next/image";
import { getWebSettings, type WebSettings } from "@/services/online-services/webSettingsService";
import { useReactToPrint } from "react-to-print";
import { formatUOMDisplay } from "@/lib/uom-constants";

// Helper function to safely format dates
const safeFormatDate = (
  dateStr: string | undefined | null,
  formatStr: string = "MMM dd, yyyy"
): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch {
    return "-";
  }
};

interface BillDetailsProps {
  bill: Bill;
}

export default function BillDetails({ bill }: BillDetailsProps) {
  const router = useRouter();
  const currencySymbol = useCurrency();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [webSettings, setWebSettings] = useState<WebSettings | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);

  // Determine if this is an inter-state transaction (IGST)
  const isInterState = bill.totalIGST > 0;

  useEffect(() => {
    const fetchWebSettings = async () => {
      try {
        setIsLoadingLogo(true);
        const response = await getWebSettings();
        if (response.success) {
          setWebSettings(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch web settings:", error);
      } finally {
        setIsLoadingLogo(false);
      }
    };

    fetchWebSettings();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `GRN-${bill.grnNumber}`,
  });

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Invoice reference not found");
      return;
    }

    try {
      toast.info("Generating PDF...");
      
      const pdfBlob = await generatePDFBlob();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GRN-${bill.grnNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try using Print instead.");
    }
  };

  const handleViewPDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Invoice reference not found");
      return;
    }

    try {
      toast.info("Generating PDF...");
      
      const pdfBlob = await generatePDFBlob();
      
      // Open PDF in new tab
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      toast.success("PDF opened in new tab");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try using Print instead.");
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    if (!invoiceRef.current) {
      throw new Error("Invoice reference not found");
    }
      
    // Clone the element to ensure consistent print layout capture
    const element = invoiceRef.current;
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Set fixed width for A4 consistency (794px is roughly A4 width at 96 DPI)
    clone.style.width = '794px';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-1';
    
    // Append to body to capture
    document.body.appendChild(clone);

    // Convert logo to base64 if it exists to ensure it renders in PDF
    const logoImg = clone.querySelector('img') as HTMLImageElement;
    if (logoImg && webSettings?.logoUrl) {
      try {
        const response = await fetch(webSettings.logoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        logoImg.src = base64;
      } catch (error) {
        console.error("Failed to convert logo to base64:", error);
      }
    }

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 300));

    // Convert any lab() or oklch() colors to RGB
    const sanitizeColor = (colorValue: string): string => {
      if (!colorValue) return colorValue;
      
      // Handle lab() colors
      if (colorValue.includes('lab(') || colorValue.includes('oklch(')) {
        // Common Tailwind slate colors
        if (colorValue.includes('15.2') || colorValue.includes('0.15')) return '#0f172a'; // slate-900
        if (colorValue.includes('25.3') || colorValue.includes('0.25')) return '#1e293b'; // slate-800
        if (colorValue.includes('37.1') || colorValue.includes('0.37')) return '#334155'; // slate-700
        if (colorValue.includes('47.6') || colorValue.includes('0.48')) return '#475569'; // slate-600
        if (colorValue.includes('60.5') || colorValue.includes('0.61')) return '#64748b'; // slate-500
        if (colorValue.includes('70.9') || colorValue.includes('0.71')) return '#94a3b8'; // slate-400
        if (colorValue.includes('97.1') || colorValue.includes('0.97')) return '#f8fafc'; // slate-50
        if (colorValue.includes('96.1') || colorValue.includes('0.96')) return '#f1f5f9'; // slate-100
        return '#000000'; // Default fallback
      }
      
      return colorValue;
    };

    // Sanitize all colors in the clone
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      const element = el as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      
      // Apply sanitization
      const color = sanitizeColor(computedStyle.color);
      const bgColor = sanitizeColor(computedStyle.backgroundColor);
      const borderColor = sanitizeColor(computedStyle.borderColor);
      
      if (color !== computedStyle.color) element.style.color = color;
      if (bgColor !== computedStyle.backgroundColor && bgColor !== 'transparent') {
        element.style.backgroundColor = bgColor;
      }
      if (borderColor !== computedStyle.borderColor) element.style.borderColor = borderColor;
    });

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
          // Remove SVG icons that don't render well
          const svgs = Array.from(clonedDoc.querySelectorAll('svg'));
          svgs.forEach(svg => svg.remove());

          const overrideStyles = clonedDoc.createElement('style');
          overrideStyles.textContent = `
            * {
              box-shadow: none !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            [class*="bg-white"], [class*="bg-card"] { background-color: #fff !important; }
            [class*="bg-slate-50"], [class*="bg-gray-50"] { background-color: #f8fafc !important; }
            [class*="bg-slate-100"], [class*="bg-gray-100"] { background-color: #f1f5f9 !important; }
            [class*="bg-slate-900"], [class*="bg-gray-900"], [class*="bg-black"] { background-color: #0f172a !important; color: #fff !important; }
            [class*="bg-primary"] { background-color: #000 !important; color: #fff !important; }
            [class*="text-slate-900"] { color: #0f172a !important; }
            [class*="text-slate-800"] { color: #1e293b !important; }
            [class*="text-slate-700"] { color: #334155 !important; }
            [class*="text-slate-600"] { color: #475569 !important; }
            [class*="text-slate-500"] { color: #64748b !important; }
            [class*="text-slate-400"] { color: #94a3b8 !important; }
            [class*="text-primary"] { color: #000 !important; }
            [class*="text-muted-foreground"] { color: #666 !important; }
            [class*="border-slate"] { border-color: #e2e8f0 !important; }
            img { opacity: 1 !important; display: block !important; }
          `;
          clonedDoc.head.appendChild(overrideStyles);
      }
    });

    // Cleanup
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    return pdf.output('blob');
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100/50 min-h-screen print:min-h-0 print:bg-white print:overflow-visible">
      
      {/* Add Print Page Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 5mm;
            size: auto;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6 space-y-6 print:p-0 print:space-y-0 print:max-w-none">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:bg-white"
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-800">GRN Details #{bill.grnNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (handlePrint) {
                handlePrint();
              } else {
                console.error("Print handler not ready");
                toast.error("Print service not ready");
              }
            }} className="bg-white shadow-sm">
              <Printer className="size-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewPDF} className="bg-white shadow-sm">
              <Eye className="size-4 mr-2" />
              View PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="bg-white shadow-sm">
              <Download className="size-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Paper */}
        <div 
          className="bg-white shadow-lg rounded-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none select-text" 
          data-invoice
          ref={invoiceRef}
        >
          {/* BRANDING STRIP */}
          <div className="colored-header h-3 bg-slate-900 w-full print:bg-slate-900" />
          
          <div className="p-8 print:p-6 print:pb-2">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 print:pb-4 print:mb-4">
               <div className="flex gap-4 items-center">
                  <div className="relative w-48 h-24 flex items-center justify-start overflow-hidden">
                    {isLoadingLogo ? (
                      <Store className="size-8 animate-pulse text-muted-foreground" />
                    ) : webSettings?.logoUrl ? (
                      <Image 
                        src={webSettings.logoUrl} 
                        alt="Company Logo" 
                        fill 
                        className="object-contain object-left" 
                        priority
                      />
                    ) : (
                      <div className="bg-slate-900 text-white flex items-center justify-center font-bold text-2xl tracking-tighter px-6 py-4 rounded-lg">
                        LOGO
                      </div>
                    )}
                  </div>
               </div>

               <div className="text-right space-y-2">
                 <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Goods Receipt Note</h1>
                 <div className="space-y-1">
                   <p className="text-sm text-slate-600">
                     <span className="font-semibold">GRN Number:</span>{" "}
                     <span className="font-bold text-slate-900">{bill.grnNumber}</span>
                   </p>
                   <p className="text-sm text-slate-600">
                     <span className="font-semibold">Date:</span>{" "}
                     <span className="font-bold text-slate-900">{safeFormatDate(bill.grnDate)}</span>
                   </p>
                 </div>
               </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="grid grid-cols-2 gap-12 mb-8">
              {/* Supplier Info */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Vendor (Supplier)</h3>
                <div className="text-sm space-y-1">
                   <p className="font-bold text-slate-900 text-base">{bill.supplierName}</p>
                   {bill.contactPersonName && <p className="text-slate-600">Attn: {bill.contactPersonName}</p>}
                   <div className="text-slate-500 leading-relaxed whitespace-pre-wrap">
                      {bill.supplierAddress}
                   </div>
                   <div className="mt-3 space-y-0.5">
                     <p className="text-xs font-medium text-slate-700">
                       <span className="font-bold text-slate-500 w-16 inline-block">GSTIN:</span> 
                       {bill.supplierGSTIN || "N/A"}
                     </p>
                     <p className="text-xs font-medium text-slate-700">
                       <span className="font-bold text-slate-500 w-16 inline-block">Phone:</span> 
                       {bill.supplierPhone}
                     </p>
                     <p className="text-xs font-medium text-slate-700">
                       <span className="font-bold text-slate-500 w-16 inline-block">Email:</span> 
                       {bill.supplierEmail}
                     </p>
                   </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Received At (Warehouse)</h3>
                <div className="text-sm space-y-1">
                   <p className="font-bold text-slate-900 text-base">{bill.warehouseName}</p>
                   <div className="text-slate-500 leading-relaxed flex gap-2">
                      <MapPin className="size-4 shrink-0 mt-0.5 text-slate-400" />
                      <span className="whitespace-pre-wrap">{bill.shippingAddress}</span>
                   </div>
                   <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                      {bill.poNumber && (
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Ref PO:</span>
                          <span className="font-bold text-slate-900">{bill.poNumber}</span>
                        </div>
                      )}
                      {bill.receivedDate && (
                         <div className="flex justify-between text-xs">
                           <span className="font-semibold text-slate-600">Received On:</span>
                           <span className="font-bold text-slate-900">{safeFormatDate(bill.receivedDate)}</span>
                         </div>
                      )}
                   </div>
                </div>
              </div>
            </div>

            {/* SHIPMENT DETAILS STRIP */}
            {(bill.transporterName || bill.vehicleNumber || bill.eWayBillNumber) && (
              <div className="mb-8 p-4 bg-slate-900 text-white rounded-lg flex flex-wrap gap-8 items-center text-xs">
                 <div className="flex items-center gap-2 font-black uppercase text-slate-400">
                    <Truck className="size-4" /> Shipment
                 </div>
                 {bill.transporterName && (
                   <div>
                     <span className="block text-[10px] text-slate-500 font-bold uppercase">Transporter</span>
                     <span className="font-semibold">{bill.transporterName}</span>
                   </div>
                 )}
                 {bill.vehicleNumber && (
                   <div>
                     <span className="block text-[10px] text-slate-500 font-bold uppercase">Vehicle No</span>
                     <span className="font-semibold">{bill.vehicleNumber}</span>
                   </div>
                 )}
                 {bill.eWayBillNumber && (
                   <div>
                     <span className="block text-[10px] text-slate-500 font-bold uppercase">E-Way Bill</span>
                     <span className="font-semibold">{bill.eWayBillNumber}</span>
                   </div>
                 )}
              </div>
            )}

            {/* ITEMS TABLE */}
            <div className="mb-8">
              <Table className="border border-slate-200">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold text-slate-900 border-r border-slate-200">#</TableHead>
                    <TableHead className="font-bold text-slate-900 border-r border-slate-200">Item Details</TableHead>
                    <TableHead className="w-16 text-center font-bold text-slate-900 border-r border-slate-200">HSN</TableHead>
                    <TableHead className="w-16 text-center font-bold text-slate-900 border-r border-slate-200">Recv</TableHead>
                    <TableHead className="w-24 text-right font-bold text-slate-900 border-r border-slate-200">Rate</TableHead>
                    
                    {isInterState ? (
                      <TableHead className="w-24 text-right font-bold text-slate-900 border-r border-slate-200">IGST</TableHead>
                    ) : (
                      <>
                        <TableHead className="w-20 text-right font-bold text-slate-900 border-r border-slate-200">CGST</TableHead>
                        <TableHead className="w-20 text-right font-bold text-slate-900 border-r border-slate-200">SGST</TableHead>
                      </>
                    )}
                    
                    <TableHead className="w-28 text-right font-bold text-slate-900">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items.map((item, index: number) => (
                    <TableRow key={item.id || index} className="border-b border-slate-100">
                      <TableCell className="text-center font-medium text-slate-500 border-r border-slate-200 bg-slate-50/30">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-r border-slate-200">
                        <p className="font-bold text-slate-800 text-sm">{item.productName || item.itemName}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-tight">{item.category}</p>
                        {item.batchNumber && <div className="text-[9px] text-primary font-bold mt-0.5">BATCH: {item.batchNumber}</div>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-slate-500 border-r border-slate-200">
                        {item.hsnCode || "-"}
                      </TableCell>
                      <TableCell className="text-center border-r border-slate-200">
                        <span className="font-bold text-slate-800">{item.quantityReceived || item.receivedQuantity}</span>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {formatUOMDisplay(0, item.uom).replace(/[0-9.]/g, '')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 border-r border-slate-200">
                        {currencySymbol}{(item.price || item.purchasePrice || 0).toFixed(2)}
                      </TableCell>

                      {isInterState ? (
                         <TableCell className="text-right border-r border-slate-200">
                           <div className="text-xs font-bold text-slate-700">{currencySymbol}{item.igstAmount.toFixed(2)}</div>
                           <div className="text-[10px] text-slate-400">({item.gstPercentage}%)</div>
                         </TableCell>
                      ) : (
                        <>
                          <TableCell className="text-right border-r border-slate-200">
                             <div className="text-xs font-bold text-slate-700">{currencySymbol}{item.cgstAmount.toFixed(2)}</div>
                             <div className="text-[10px] text-slate-400">({item.cgstPercentage}%)</div>
                          </TableCell>
                          <TableCell className="text-right border-r border-slate-200">
                             <div className="text-xs font-bold text-slate-700">{currencySymbol}{item.sgstAmount.toFixed(2)}</div>
                             <div className="text-[10px] text-slate-400">({item.sgstPercentage}%)</div>
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-right font-bold text-slate-900 bg-slate-50/30">
                        {currencySymbol}{(item.totalPrice || item.totalAmount || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* SUMMARY & NOTES */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6"></div>

              <div className="w-full md:w-80 space-y-3">
                 <div className="flex justify-between text-sm py-1">
                   <span className="font-medium text-slate-500">Subtotal</span>
                   <span className="font-bold text-slate-800">{currencySymbol}{bill.subTotal.toFixed(2)}</span>
                 </div>
                 
                 {bill.totalDiscount > 0 && (
                   <div className="flex justify-between text-sm py-1 text-red-600">
                     <span className="font-medium">Discount</span>
                     <span className="font-bold">- {currencySymbol}{bill.totalDiscount.toFixed(2)}</span>
                   </div>
                 )}

                 <div className="border-t border-slate-200 my-2 pt-2 space-y-1">
                   {isInterState ? (
                      <div className="flex justify-between text-sm py-1">
                        <span className="font-medium text-slate-500">IGST (Total)</span>
                        <span className="font-bold text-slate-800">{currencySymbol}{bill.totalIGST.toFixed(2)}</span>
                      </div>
                   ) : (
                      <>
                        <div className="flex justify-between text-sm py-1">
                           <span className="font-medium text-slate-500">CGST (Total)</span>
                           <span className="font-bold text-slate-800">{currencySymbol}{bill.totalCGST.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                           <span className="font-medium text-slate-500">SGST (Total)</span>
                           <span className="font-bold text-slate-800">{currencySymbol}{bill.totalSGST.toFixed(2)}</span>
                        </div>
                      </>
                   )}
                 </div>
                 
                 {bill.otherCharges > 0 && (
                   <div className="flex justify-between text-sm py-1">
                     <span className="font-medium text-slate-500">Other Charges</span>
                     <span className="font-bold text-slate-800">{currencySymbol}{bill.otherCharges.toFixed(2)}</span>
                   </div>
                 )}
                 {bill.roundOff !== 0 && (
                   <div className="flex justify-between text-sm py-1">
                     <span className="font-medium text-slate-500">Round Off</span>
                     <span className="font-bold text-slate-800">{bill.roundOff > 0 ? '+' : ''}{currencySymbol}{bill.roundOff.toFixed(2)}</span>
                   </div>
                 )}

                 <div className="border-t-2 border-slate-900 pt-3 mt-2">
                   <div className="flex justify-between items-center text-xl font-black text-primary">
                     <span>Grand Total</span>
                     <span>{currencySymbol}{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                   </div>
                   <p className="text-[10px] text-right text-slate-400 mt-1 uppercase font-medium">Inclusive of all taxes</p>
                 </div>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="mt-16 grid grid-cols-2 gap-20">
              <div className="border-t border-slate-300 pt-2 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Manager</p>
              </div>
              <div className="border-t border-slate-300 pt-2 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
              </div>
            </div>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
             <p className="text-[10px] text-slate-400 font-medium">
               This is a system generated Goods Receipt Note for LEATS Microservices.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
