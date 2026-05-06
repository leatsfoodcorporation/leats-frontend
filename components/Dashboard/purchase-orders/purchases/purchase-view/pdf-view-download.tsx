"use client";

import { RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import type { WebSettings } from "@/services/purchase-services/webSettingsService";

interface PDFGeneratorProps {
  invoiceRef: RefObject<HTMLDivElement | null>;
  poId: string;
  webSettings: WebSettings | null;
}

export const usePDFGenerator = ({ invoiceRef, poId, webSettings }: PDFGeneratorProps) => {

  // Normalize any color value (lab/oklch/etc.) to a browser-resolved RGB string
  const normalizeColor = (color: string) => {
    if (!color) return color;
    // Try via canvas (often serializes to rgb/hex)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        ctx.fillStyle = color;
        const resolved = ctx.fillStyle as string;
        // Some browsers may keep the original string if unsupported
        if (resolved && !/(oklch\(|lab\()/i.test(resolved)) {
          return resolved;
        }
      } catch {
        // fall through
      }
    }

    // Fallback to DOM computed style
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const resolved = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    if (resolved && !/(oklch\(|lab\()/i.test(resolved)) {
      return resolved;
    }

    // Last-resort fallback to a safe color if still unsupported
    return '#000000';
  };

  // Replace any color functions inside a shadow/string property
  const normalizeColorInString = (value: string) => {
    if (!value) return value;
    const hasLab = /(oklch\([^)]+\)|lab\([^)]+\))/gi.test(value);
    const replaced = value.replace(/(oklch\([^)]+\)|lab\([^)]+\))/gi, (match) => normalizeColor(match));
    // If replacement still leaves lab tokens (parser couldn't resolve), hard fallback
    if (/(oklch\(|lab\()/i.test(replaced)) {
      // For gradients/shadows, safest is to drop color functions
      return replaced.replace(/(oklch\([^)]+\)|lab\([^)]+\))/gi, '#000');
    }
    return replaced;
  };

  // Normalize every computed style value that still contains lab/oklch
  const normalizeAllColorProps = (el: HTMLElement, computedStyle: CSSStyleDeclaration) => {
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle.item(i);
      const value = computedStyle.getPropertyValue(prop);
      if (/(oklch\(|lab\()/i.test(value)) {
        let normalized = normalizeColorInString(value);
        // If background-image/gradient still contains lab, drop it to avoid parser errors
        if (/(background-image|background)/i.test(prop) && /(oklch\(|lab\()/i.test(normalized)) {
          normalized = 'none';
        }
        el.style.setProperty(prop, normalized, computedStyle.getPropertyPriority(prop));
      }
    }
  };

  // Apply normalization for element and its pseudo elements
  const normalizeElementColors = (el: HTMLElement) => {
    const normalizeWithPseudo = (pseudo?: string) => {
      const computedStyle = window.getComputedStyle(el, pseudo || undefined);
      // Backup targeted props for the main element only (pseudo handled via inline style override)
      if (!pseudo) {
        if (computedStyle.color) {
          el.style.color = normalizeColor(computedStyle.color);
        }
        if (computedStyle.backgroundColor) {
          el.style.backgroundColor = normalizeColor(computedStyle.backgroundColor);
        }
        el.style.borderColor = normalizeColor(computedStyle.borderColor);
        el.style.borderTopColor = normalizeColor(computedStyle.borderTopColor);
        el.style.borderRightColor = normalizeColor(computedStyle.borderRightColor);
        el.style.borderBottomColor = normalizeColor(computedStyle.borderBottomColor);
        el.style.borderLeftColor = normalizeColor(computedStyle.borderLeftColor);
        el.style.textDecorationColor = normalizeColor(computedStyle.textDecorationColor);
        el.style.outlineColor = normalizeColor(computedStyle.outlineColor);
        el.style.columnRuleColor = normalizeColor(computedStyle.columnRuleColor);
        (el as any).style.fill = normalizeColor(computedStyle.fill || "");
        (el as any).style.stroke = normalizeColor(computedStyle.stroke || "");
        const boxShadow = computedStyle.boxShadow;
        if (boxShadow) {
          el.style.boxShadow = normalizeColorInString(boxShadow);
        }
        const textShadow = computedStyle.textShadow;
        if (textShadow) {
          el.style.textShadow = normalizeColorInString(textShadow);
        }
      }

      // Normalize every property (works for pseudo too)
      normalizeAllColorProps(el, computedStyle);
    };

    normalizeWithPseudo(); // element
    normalizeWithPseudo("::before");
    normalizeWithPseudo("::after");
  };

  // Inline all computed styles (after normalization) onto the element
  const inlineComputedStyles = (el: HTMLElement) => {
    const computed = window.getComputedStyle(el);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed.item(i);
      const value = normalizeColorInString(computed.getPropertyValue(prop));
      const priority = computed.getPropertyPriority(prop);
      el.style.setProperty(prop, value, priority);
    }
  };
  
  const generatePDFBlob = async (): Promise<Blob> => {
    if (!invoiceRef.current) {
      throw new Error("Invoice reference not found");
    }

    const element = invoiceRef.current;
    
    // First, fix all color functions in the original element before cloning
    const originalElements = element.querySelectorAll('*');
    const styleBackups: Array<{ el: HTMLElement; color: string; bg: string; border: string }> = [];
    
    originalElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Backup original styles
      styleBackups.push({
        el: htmlEl,
        color: htmlEl.style.color,
        bg: htmlEl.style.backgroundColor,
        border: htmlEl.style.borderColor
      });
      
      // Apply computed colors (converts lab/oklch to rgb) including pseudos
      normalizeElementColors(htmlEl);
    });

    // Clone the element with fixed colors
    const clone = element.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-clone', 'pdf');
    
    // Restore original styles
    styleBackups.forEach(({ el, color, bg, border }) => {
      el.style.color = color;
      el.style.backgroundColor = bg;
      el.style.borderColor = border;
    });
    
    // Apply styles for PDF rendering using the original size to avoid layout shifts
    const { width: origWidth, height: origHeight } = element.getBoundingClientRect();
    clone.style.width = `${origWidth}px`;
    clone.style.minHeight = `${origHeight}px`;
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999';
    clone.style.backgroundColor = '#ffffff';
    clone.style.padding = '0';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    
    document.body.appendChild(clone);

    // Normalize colors again on the cloned tree (ensures pseudo styles are inlined)
    const clonedElements = clone.querySelectorAll('*');
    clonedElements.forEach((el) => {
      normalizeElementColors(el as HTMLElement);
      inlineComputedStyles(el as HTMLElement);
    });
    inlineComputedStyles(clone);

    // Ensure logo is CORS-friendly for html2canvas
    const logoImg = clone.querySelector('[data-logo-container] img') as HTMLImageElement;
    if (logoImg && webSettings?.logoUrl) {
      logoImg.crossOrigin = "anonymous";
      logoImg.referrerPolicy = "no-referrer";
      logoImg.src = webSettings.logoUrl;
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.body.querySelector('[data-invoice][data-clone="pdf"]') as HTMLElement;
          if (clonedElement) {
            // Remove shadows and apply print styles
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-shadow: none !important;
              }
              .invoice-bg-beige {
                background-color: #e8e4d9 !important;
              }
              .invoice-footer-beige {
                background-color: #c4b89a !important;
                color: #ffffff !important;
              }
              [data-invoice-header] h1 {
                letter-spacing: 0.18em !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        }
      });

      document.body.removeChild(clone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Scale to fit on single page
      if (imgHeight > pdfHeight) {
        const scale = pdfHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = pdfHeight;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      return pdf.output('blob');
    } catch (error) {
      document.body.removeChild(clone);
      throw error;
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Invoice reference not found");
      return;
    }

    try {
      toast.info("Generating PDF...");
      const pdfBlob = await generatePDFBlob();
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-${poId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
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
      
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      toast.success("PDF opened in new tab");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  return {
    handleDownloadPDF,
    handleViewPDF
  };
};
