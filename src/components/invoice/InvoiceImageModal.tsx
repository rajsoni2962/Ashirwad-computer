'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileImage,
  RefreshCw,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  captureInvoiceElementToCanvas,
  downloadImageBlob,
  getSanitizedInvoiceImageFilename,
} from '@/lib/invoiceImageExporter';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';

interface InvoiceImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  settings?: any;
  sourceElementId?: string; // Optional ID if invoice is already in DOM
  onShareWhatsApp?: () => void;
}

export default function InvoiceImageModal({
  isOpen,
  onClose,
  invoice,
  settings,
  sourceElementId = 'printable-invoice-document',
  onShareWhatsApp,
}: InvoiceImageModalProps) {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [loading, setLoading] = useState(true);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const offscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !invoice) {
      setPreviewDataUrl(null);
      setLoading(true);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const generatePreview = async () => {
      try {
        // Wait 150ms for offscreen DOM and fonts/images to settle
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (!isMounted) return;

        // 1. First check if element is already rendered in current DOM
        let targetElement = document.getElementById(sourceElementId);

        // 2. Fallback to our dedicated offscreen container
        if (!targetElement && offscreenContainerRef.current) {
          targetElement = offscreenContainerRef.current.querySelector(
            '#printable-invoice-document'
          ) as HTMLElement || offscreenContainerRef.current;
        }

        if (!targetElement) {
          console.warn('Invoice element not found for image capture');
          setLoading(false);
          return;
        }

        const canvas = await captureInvoiceElementToCanvas(targetElement, { scale: 2 });
        if (!isMounted) return;

        const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
        setPreviewDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate invoice image preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    generatePreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, invoice, format, sourceElementId]);

  if (!isOpen || !invoice) return null;

  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const filename = getSanitizedInvoiceImageFilename(invoiceNumber, format);

  const handleDownload = async () => {
    if (!previewDataUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(previewDataUrl);
      const blob = await response.blob();
      downloadImageBlob(blob, filename);
    } catch (err) {
      console.error('Download image error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!previewDataUrl) return;
    try {
      const response = await fetch(previewDataUrl);
      const blob = await response.blob();
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        // Clipboard standard prefers image/png
        const pngBlob = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert('Clipboard image copy is not supported on this browser. Please use the Download button.');
      }
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      alert('Could not copy to clipboard directly. Please use Download Image.');
    }
  };

  const handleOpenInNewTab = () => {
    if (!previewDataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<html><head><title>${filename}</title><style>body{margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;height:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);}</style></head><body><img src="${previewDataUrl}" alt="${filename}"/></body></html>`
      );
      win.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">
                  Invoice Image Export
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Download or copy crisp, high-resolution invoice image (PNG / JPEG)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Controls Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFormat('png')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                format === 'png'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PNG (Lossless High-Res)
            </button>
            <button
              type="button"
              onClick={() => setFormat('jpeg')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                format === 'jpeg'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              JPEG / JPG (Compressed)
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !previewDataUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition disabled:opacity-50"
              title="Copy image to clipboard for instant pasting"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              disabled={loading || !previewDataUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition disabled:opacity-50"
              title="View full-size image in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Full Tab</span>
            </button>
          </div>
        </div>

        {/* Image Preview Box */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/5 flex items-center justify-center min-h-[320px]">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Rendering vector-sharp {format.toUpperCase()} invoice...
              </p>
            </div>
          ) : previewDataUrl ? (
            <div className="relative max-w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 bg-white">
              <img
                src={previewDataUrl}
                alt={filename}
                className="max-h-[55vh] w-auto object-contain mx-auto select-none"
              />
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Preview not available</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Format: <strong>{format === 'jpeg' ? 'JPEG (.jpg)' : 'PNG (.png)'}</strong> (Ultra Crisp 2x HD)</span>
          </div>

          <div className="flex items-center gap-2">
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={onShareWhatsApp}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !previewDataUrl || downloading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : `Download ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Offscreen Container for rendering when invoice DOM element is not on page */}
      <div
        ref={offscreenContainerRef}
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 1,
        }}
        aria-hidden="true"
      >
        <InvoicePrintView
          invoice={invoice}
          settings={settings}
          isDesignerPreview={true}
        />
      </div>
    </div>
  );
}
