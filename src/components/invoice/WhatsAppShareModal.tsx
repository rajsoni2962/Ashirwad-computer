'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Phone,
  Copy,
  Download,
  Share2,
  Check,
  AlertCircle,
  FileText,
  FileImage,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  normalizePhoneNumber,
  getSanitizedInvoiceFilename,
  generateInvoicePdf,
  downloadPdfBlob,
} from '@/lib/invoicePdfGenerator';
import {
  generateInvoiceImageBlob,
  downloadImageBlob,
  getSanitizedInvoiceImageFilename,
  copyInvoiceImageToClipboard,
  blobToFile,
} from '@/lib/invoiceImageExporter';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  settings?: any;
  invoiceElementId?: string; // ID of DOM element to capture for PDF/Image
  onShared?: () => void;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  invoice,
  settings,
  invoiceElementId = 'printable-invoice-document',
  onShared,
}: WhatsAppShareModalProps) {
  let custSnapshot: any = null;
  if (invoice?.customerSnapshot) {
    try {
      custSnapshot =
        typeof invoice.customerSnapshot === 'string'
          ? JSON.parse(invoice.customerSnapshot)
          : invoice.customerSnapshot;
    } catch {}
  }
  const customerName = custSnapshot?.name || invoice.customer?.name || 'Customer';
  const initialPhone = custSnapshot?.phone || invoice.customer?.phone || '';

  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(!initialPhone);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [shareFormat, setShareFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');

  const phoneDetails = normalizePhoneNumber(phoneInput);

  // Default pre-filled message
  const defaultMessage = `Hello ${customerName},

Thank you for choosing Ashirwad Tech.

Please find attached your invoice ${invoice?.invoiceNumber || ''} for ₹${(
    invoice?.grandTotal || 0
  ).toLocaleString('en-IN')}.

Thank you for your business.

ASHIRWAD TECH
Repair | Upgrade | Build | Service`;

  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [desktopModalNotice, setDesktopModalNotice] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const offscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Web Share API with files is supported
    if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
      try {
        const dummyFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanShareFiles(true);
        }
      } catch (e) {
        setCanShareFiles(false);
      }
    }
  }, []);

  if (!isOpen || !invoice) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePhone = async () => {
    if (!phoneDetails.isValid) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setUpdatingPhone(true);
    try {
      if (invoice.customer?.id) {
        await fetch(`/api/customers/${invoice.customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName,
            phone: phoneInput,
          }),
        });
      }
      setIsEditingPhone(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPhone(false);
    }
  };

  const recordShareLog = async () => {
    try {
      await fetch(`/api/invoices/${invoice.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: phoneDetails.normalized || phoneInput,
          customerName,
          customerPhone: phoneInput,
          updateCustomerPhone: isEditingPhone,
          format: shareFormat,
        }),
      });
      if (onShared) onShared();
    } catch (e) {
      console.error('Failed to log share action', e);
    }
  };

  // Helper to fetch full invoice if items are missing
  const getFullInvoiceData = async () => {
    if (invoice.items && invoice.items.length > 0 && invoice.subtotal !== undefined) {
      return invoice;
    }
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      console.error('Failed to load full invoice', e);
    }
    return invoice;
  };

  const getTargetElement = (): HTMLElement | null => {
    let target = document.getElementById(invoiceElementId);
    if (!target && offscreenContainerRef.current) {
      target =
        (offscreenContainerRef.current.querySelector(
          '#printable-invoice-document'
        ) as HTMLElement) || offscreenContainerRef.current;
    }
    return target;
  };

  const handleDirectDownloadPdf = async () => {
    setGenerating(true);
    try {
      const fullData = await getFullInvoiceData();
      const { blob, filename } = await generateInvoicePdf(fullData, settings);
      downloadPdfBlob(blob, filename);
    } catch (err: any) {
      console.error('Direct PDF generation error, using server fallback:', err);
      window.location.href = `/api/invoices/${invoice.id}/pdf`;
    } finally {
      setGenerating(false);
    }
  };

  const handleDirectDownloadImage = async (formatToDownload: 'png' | 'jpeg') => {
    setGenerating(true);
    try {
      const targetElement = getTargetElement();
      if (!targetElement) {
        alert('Could not locate invoice element for image rendering');
        return;
      }
      const filename = getSanitizedInvoiceImageFilename(
        invoice.invoiceNumber,
        formatToDownload
      );
      const { blob } = await generateInvoiceImageBlob(targetElement, {
        format: formatToDownload,
        filename,
      });
      downloadImageBlob(blob, filename);
    } catch (err: any) {
      console.error('Direct image generation error:', err);
      alert('Failed to generate image. Please try downloading PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyImageClipboard = async () => {
    try {
      const targetElement = getTargetElement();
      if (!targetElement) return;
      const success = await copyInvoiceImageToClipboard(targetElement);
      if (success) {
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2500);
      } else {
        alert('Could not copy image automatically. Please use Download Image instead.');
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  const handleShare = async () => {
    if (!phoneDetails.isValid) {
      setIsEditingPhone(true);
      return;
    }

    setGenerating(true);

    try {
      if (shareFormat === 'pdf') {
        const fullData = await getFullInvoiceData();
        const result = await generateInvoicePdf(fullData, settings);
        const pdfFile = result.file;
        const pdfBlob = result.blob;
        const filename = result.filename;

        // Native share if supported
        if (canShareFiles && pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber} - Ashirwad Tech`,
            text: message,
            files: [pdfFile],
          });
          await recordShareLog();
          onClose();
          return;
        }

        // Desktop fallback: Download PDF + open WhatsApp Web
        if (pdfBlob) {
          downloadPdfBlob(pdfBlob, filename);
        }
        const encodedMsg = encodeURIComponent(message);
        const waUrl = `https://web.whatsapp.com/send?phone=${phoneDetails.normalized}&text=${encodedMsg}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        await recordShareLog();
        setDesktopModalNotice(
          `We downloaded ${filename} to your device and opened WhatsApp Web with ${customerName}. Please attach the downloaded PDF into the chat before sending.`
        );
      } else {
        // Image format: 'png' or 'jpeg'
        const targetElement = getTargetElement();
        if (!targetElement) {
          throw new Error('Invoice DOM element not found for image rendering');
        }
        const ext = shareFormat === 'jpeg' ? 'jpg' : 'png';
        const mimeType = shareFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const filename = getSanitizedInvoiceImageFilename(invoice.invoiceNumber, shareFormat);
        const { blob } = await generateInvoiceImageBlob(targetElement, {
          format: shareFormat,
          filename,
        });
        const imageFile = blobToFile(blob, filename, mimeType);

        // Native share if supported
        if (canShareFiles && imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber} - Ashirwad Tech`,
            text: message,
            files: [imageFile],
          });
          await recordShareLog();
          onClose();
          return;
        }

        // Desktop fallback: Download image + copy to clipboard + open WhatsApp Web
        downloadImageBlob(blob, filename);
        try {
          await copyInvoiceImageToClipboard(targetElement);
        } catch {}

        const encodedMsg = encodeURIComponent(message);
        const waUrl = `https://web.whatsapp.com/send?phone=${phoneDetails.normalized}&text=${encodedMsg}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        await recordShareLog();
        setDesktopModalNotice(
          `We downloaded ${filename} and copied the image to your clipboard! You can press Ctrl+V directly inside the WhatsApp Web chat to paste it, or drag the downloaded image file.`
        );
      }
    } catch (err: any) {
      console.error('Sharing failed:', err);
      if (err.name !== 'AbortError') {
        const encodedMsg = encodeURIComponent(message);
        const waUrl = `https://wa.me/${phoneDetails.normalized}?text=${encodedMsg}`;
        window.open(waUrl, '_blank');
      }
    } finally {
      setGenerating(false);
    }
  };

  const invoiceNumber = invoice.invoiceNumber || 'INV';
  const pdfFilename = getSanitizedInvoiceFilename(invoiceNumber);
  const imageFilename = getSanitizedInvoiceImageFilename(
    invoiceNumber,
    shareFormat === 'jpeg' ? 'jpeg' : 'png'
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Offscreen invoice rendering container for background image capture */}
      <div
        ref={offscreenContainerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <InvoicePrintView invoice={invoice} settings={settings} isDesignerPreview={true} />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Share Invoice on WhatsApp</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Share PDF Document or High-Res Image (PNG/JPG) with customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Desktop Fallback Instruction Banner */}
          {desktopModalNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Invoice Prepared & WhatsApp Web Opened</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {desktopModalNotice}
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700"
                >
                  Done / Close
                </button>
              </div>
            </div>
          )}

          {/* Customer & Invoice Snapshot */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Customer
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{customerName}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Invoice Amount
                </div>
                <div className="text-sm font-black text-emerald-600 mt-0.5">
                  ₹{(invoice.grandTotal || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Mobile Number Section */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  WhatsApp Mobile Number:
                </span>
                {!isEditingPhone && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {!isEditingPhone && phoneDetails.isValid ? (
                <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                  {phoneDetails.display}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {!phoneDetails.isValid && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Customer mobile number is required to share on WhatsApp.</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      disabled={updatingPhone || !phoneDetails.isValid}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      {updatingPhone ? 'Saving...' : 'Set Number'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attachment Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Attachment Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShareFormat('pdf')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                  shareFormat === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-500 mb-1" />
                <span>PDF Document</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Vector / A4</span>
              </button>

              <button
                type="button"
                onClick={() => setShareFormat('png')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                  shareFormat === 'png'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-800 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileImage className="w-4 h-4 text-indigo-600 mb-1" />
                <span>PNG Image</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Lossless 300 DPI</span>
              </button>

              <button
                type="button"
                onClick={() => setShareFormat('jpeg')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                  shareFormat === 'jpeg'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-800 shadow-xs ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileImage className="w-4 h-4 text-purple-600 mb-1" />
                <span>JPG Image</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Photo / Fast Load</span>
              </button>
            </div>
          </div>

          {/* Attachment Details & Direct Download Bar */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {shareFormat === 'pdf' ? (
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span className="font-mono text-slate-700 truncate font-semibold">
                  {shareFormat === 'pdf' ? pdfFilename : imageFilename}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
              {shareFormat === 'pdf' ? (
                <button
                  type="button"
                  onClick={handleDirectDownloadPdf}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Download PDF
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleDirectDownloadImage(shareFormat === 'jpeg' ? 'jpeg' : 'png')}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    Download {shareFormat.toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyImageClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    {imageCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Image</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                WhatsApp Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white font-sans leading-relaxed text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={generating || (!phoneDetails.isValid && isEditingPhone)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Preparing {shareFormat.toUpperCase()}...
                </>
              ) : canShareFiles ? (
                <>
                  <Share2 className="w-4 h-4" />
                  Share {shareFormat.toUpperCase()} on WhatsApp
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp & Download {shareFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
