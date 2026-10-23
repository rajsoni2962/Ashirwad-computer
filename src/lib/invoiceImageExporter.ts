'use client';

import html2canvas from 'html2canvas';

export interface InvoiceImageOptions {
  format?: 'png' | 'jpeg' | 'jpg';
  quality?: number; // 0.1 to 1.0 (defaults to 0.95 for JPEG)
  scale?: number; // Device pixel ratio scaling (defaults to 2 for crisp 300 DPI text)
  filename?: string;
}

/**
 * Generates a clean, sanitized filename for invoice image export.
 */
export function getSanitizedInvoiceImageFilename(
  invoiceNumber: string,
  format: 'png' | 'jpeg' | 'jpg' = 'png'
): string {
  const sanitized = (invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '-');
  const ext = format.toLowerCase() === 'jpeg' ? 'jpg' : format.toLowerCase();
  return `Ashirwad_Technologies_${sanitized}.${ext}`;
}

/**
 * Captures an invoice HTML DOM element and renders it into a high-resolution HTML Canvas.
 */
export async function captureInvoiceElementToCanvas(
  element: HTMLElement,
  options: { scale?: number } = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale !== undefined ? options.scale : 2;

  // Temporarily ensure element has solid white background and crisp text rendering
  return await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 1200,
    onclone: (clonedDoc, clonedElement) => {
      clonedElement.style.margin = '0 auto';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.border = 'none';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.backgroundColor = '#ffffff';
    },
  });
}

/**
 * Generates an image Blob and DataURL from an invoice DOM element.
 */
export async function generateInvoiceImageBlob(
  element: HTMLElement,
  options: InvoiceImageOptions = {}
): Promise<{ blob: Blob; dataUrl: string; filename: string; mimeType: string }> {
  const canvas = await captureInvoiceElementToCanvas(element, { scale: options.scale || 2 });
  const rawFormat = (options.format || 'png').toLowerCase();
  const isJpeg = rawFormat === 'jpeg' || rawFormat === 'jpg';
  const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
  const quality = options.quality !== undefined ? options.quality : 0.95;
  const ext = isJpeg ? 'jpg' : 'png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob from invoice canvas'));
          return;
        }
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const filename =
          options.filename || `Ashirwad_Technologies_Invoice.${ext}`;
        resolve({ blob, dataUrl, filename, mimeType });
      },
      mimeType,
      quality
    );
  });
}

/**
 * Triggers a direct browser download for an image Blob.
 */
export function downloadImageBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * High-level helper: Captures invoice element and triggers instant browser download.
 */
export async function downloadInvoiceImage(
  element: HTMLElement,
  invoiceNumber: string,
  format: 'png' | 'jpeg' | 'jpg' = 'png'
): Promise<string> {
  const filename = getSanitizedInvoiceImageFilename(invoiceNumber, format);
  const { blob } = await generateInvoiceImageBlob(element, { format, filename });
  downloadImageBlob(blob, filename);
  return filename;
}

/**
 * Opens the high-resolution invoice image in a new browser tab for viewing or mobile saving.
 */
export async function viewInvoiceImageInNewTab(
  element: HTMLElement,
  format: 'png' | 'jpeg' | 'jpg' = 'png'
): Promise<void> {
  const { blob } = await generateInvoiceImageBlob(element, { format });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

/**
 * Copies the invoice image to the system clipboard (allowing instant Ctrl+V into WhatsApp, Email, etc.).
 */
export async function copyInvoiceImageToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const canvas = await captureInvoiceElementToCanvas(element, { scale: 2 });
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (e) {
          console.warn('Clipboard write error:', e);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (e) {
    console.error('Failed to copy invoice image to clipboard:', e);
    return false;
  }
}

/**
 * Converts a Blob to a File object for use with the Web Share API.
 */
export function blobToFile(blob: Blob, filename: string, mimeType?: string): File {
  return new File([blob], filename, { type: mimeType || blob.type || 'image/png' });
}
