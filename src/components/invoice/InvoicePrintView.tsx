'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Printer,
  Download,
  Share2,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  MessageCircle,
  Eye,
  Edit,
  History,
  GitCompare,
  RotateCcw,
  AlertTriangle,
  Trash2,
  FileImage,
  Copy,
  ChevronDown,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate, numberToWords, getInvoiceTypeTitle, getInvoiceNumberLabel, getTaxConfigLabel } from '@/lib/utils';
import Link from 'next/link';
import WhatsAppShareModal from '@/components/invoice/WhatsAppShareModal';
import InvoiceAuditHistoryModal from '@/components/invoice/InvoiceAuditHistoryModal';
import InvoiceVersionCompareModal from '@/components/invoice/InvoiceVersionCompareModal';
import InvoiceImageModal from '@/components/invoice/InvoiceImageModal';
import {
  downloadInvoiceImage,
  copyInvoiceImageToClipboard,
} from '@/lib/invoiceImageExporter';

import {
  generateInvoicePdf,
  downloadInvoicePdf,
  viewInvoicePdf,
  generateInvoicePdfFromElement,
  downloadPdfBlob,
  viewPdfBlob,
} from '@/lib/invoicePdfGenerator';
import { getInvoiceDesign, InvoiceDesignConfig, DEFAULT_INVOICE_DESIGN } from '@/lib/invoice-design';

interface InvoicePrintViewProps {
  invoice: any;
  settings?: any;
  customDesign?: InvoiceDesignConfig;
  isDesignerPreview?: boolean;
}

export default function InvoicePrintView({
  invoice,
  settings,
  customDesign,
  isDesignerPreview = false,
}: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Customer requested return / correction');
  const [deleting, setDeleting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  // 1. Reconstruct business from saved historical snapshot (prioritized over mutable live settings)
  let bizSnapshot: any = {};
  if (currentInvoice?.businessSnapshot) {
    try {
      bizSnapshot = typeof currentInvoice.businessSnapshot === 'string'
        ? JSON.parse(currentInvoice.businessSnapshot)
        : currentInvoice.businessSnapshot;
    } catch {}
  }

  const business = {
    companyName: bizSnapshot.companyName || settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
    tagline: (bizSnapshot.tagline || settings?.tagline || 'BEYOND TECH LIMITS').replace(/\.{2,}$/, '').replace(/\s*\.\.\.\s*$/, '').trim(),
    address: bizSnapshot.address || settings?.address || 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
    phone: bizSnapshot.phone || settings?.phone || '9662278994',
    email: bizSnapshot.email || settings?.email || 'rajsoni2962@gmail.com',
    gstin: (bizSnapshot.gstin && bizSnapshot.gstin !== 'null')
      ? bizSnapshot.gstin
      : (settings?.gstin && settings?.gstin !== 'null' ? settings.gstin : ''),
    state: bizSnapshot.state || settings?.state || 'Gujarat',
    stateCode: bizSnapshot.stateCode || settings?.stateCode || '24',
    bankName: bizSnapshot.bankName || settings?.bankName || 'Kotak Mahindra Bank',
    accountNumber: bizSnapshot.accountNumber || settings?.accountNumber || '5947557983',
    ifscCode: bizSnapshot.ifscCode || settings?.ifscCode || 'KKBK0000879',
    upiId: bizSnapshot.upiId || settings?.upiId || 'rajsoni2962-2@okaxis',
    logoUrl: '/brand/logo.png',
    signatureUrl: '/brand/signature.jpeg',
    terms: currentInvoice?.terms || bizSnapshot.terms || settings?.terms || `* Tested and working perfectly at the time of sale.
* Please inspect the laptop before purchase.
* 6 Months of warranty covers technical issues only and excludes physical or liquid damage.
* Battery backup may vary depending on usage.
* No return or refund after sale unless covered under warranty.
* Thank you for choosing us—we're always here to help if you need support.`,
    footer: bizSnapshot.footer || settings?.footer || "Thank you for choosing us—we're always here to help if you need support.",
    authorizedSignatory: bizSnapshot.authorizedSignatory || settings?.authorizedSignatory || 'For: ASHIRWAD TECHNOLOGIES\nAuthorized Signatory',
  };

  // 2. Reconstruct customer from saved historical snapshot
  let custSnapshot: any = null;
  if (currentInvoice?.customerSnapshot) {
    try {
      custSnapshot = typeof currentInvoice.customerSnapshot === 'string'
        ? JSON.parse(currentInvoice.customerSnapshot)
        : currentInvoice.customerSnapshot;
    } catch {}
  }
  const customer = custSnapshot || currentInvoice?.customer || {};

  // 3. Resolve 100% customizable invoice design
  const design: InvoiceDesignConfig = customDesign || getInvoiceDesign(
    bizSnapshot?.invoiceDesign || currentInvoice?.businessProfile?.invoiceDesign || settings?.invoiceDesign
  );

  const handlePrint = async () => {
    try {
      const { blob } = await generateInvoicePdf(currentInvoice, business, { design });
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };
    } catch {
      window.print();
    }
  };

  const handleViewPdf = async () => {
    setViewing(true);
    try {
      const { blob, filename } = await generateInvoicePdf(currentInvoice, business, { design });
      viewPdfBlob(blob, filename);
    } catch (err: any) {
      console.error('Client PDF view error, using server fallback:', err);
      window.open(`/api/invoices/${currentInvoice.id}/pdf?inline=true`, '_blank');
    } finally {
      setViewing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await generateInvoicePdf(currentInvoice, business, { design });
      downloadPdfBlob(blob, filename);
    } catch (err: any) {
      console.error('Client PDF generation error, using server fallback:', err);
      window.location.href = `/api/invoices/${currentInvoice.id}/pdf`;
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    if (!printRef.current) return;
    setImageDownloading(true);
    setIsImageMenuOpen(false);
    try {
      await downloadInvoiceImage(printRef.current, currentInvoice.invoiceNumber, format);
    } catch (err) {
      console.error('Download image error:', err);
      alert('Failed to generate image. Please try again or use PDF download.');
    } finally {
      setImageDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!printRef.current) return;
    setIsImageMenuOpen(false);
    const success = await copyInvoiceImageToClipboard(printRef.current);
    if (success) {
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2500);
    } else {
      alert('Could not copy image to clipboard. Please use Download PNG / JPEG.');
    }
  };

  const handleShare = () => {
    const text = `Tax Invoice ${invoice.invoiceNumber} from Ashirwad Tech for ${invoice.customer?.name}. Amount: ${formatCurrency(invoice.grandTotal)}`;
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Invoice URL copied to clipboard! You can share it on WhatsApp or Email.');
    }
  };


  const grandTotal = invoice.grandTotal || 0;
  const paidAmount = invoice.paidAmount || 0;
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : grandTotal - paidAmount;

  const totalQuantity = invoice.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0;

  // Generate UPI payment QR link
  const upiLink = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.companyName)}&am=${encodeURIComponent(grandTotal)}&cu=INR&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;

  const handleRestore = async () => {
    if (!confirm('Restore this invoice back to active invoices?')) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/invoices/recently-deleted/${currentInvoice.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoredBy: 'admin' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Invoice restored successfully!');
        window.location.reload();
      } else {
        alert(json.error || 'Failed to restore invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error restoring invoice');
    } finally {
      setRestoring(false);
    }
  };

  const handleSoftDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${currentInvoice.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deletionReason, deletedBy: 'admin' }),
      });
      const json = await res.json();
      if (json.success) {
        setShowDeleteModal(false);
        setCurrentInvoice({
          ...currentInvoice,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: 'admin',
          deletionReason,
        });
      } else {
        alert(json.error || 'Failed to move invoice to Recently Deleted');
      }
    } catch (err: any) {
      alert(err.message || 'Error moving invoice to Recently Deleted');
    } finally {
      setDeleting(false);
    }
  };

  // Dynamic style calculations
  const fontStyle = {
    fontFamily:
      design.fontFamily === 'Outfit' ? '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif' :
      design.fontFamily === 'Inter' ? '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' :
      design.fontFamily === 'Roboto' ? '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif' :
      design.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' :
      design.fontFamily === 'Georgia' ? 'Georgia, serif' :
      'inherit',
  };

  const radiusClass =
    design.borderRadius === 'none' ? 'rounded-none' :
    design.borderRadius === 'small' ? 'rounded-lg' :
    design.borderRadius === 'rounded' ? 'rounded-3xl' :
    'rounded-2xl';

  const paddingClass =
    design.pageMargin === 'compact' ? 'p-5 sm:p-6' :
    design.pageMargin === 'spacious' ? 'p-10 sm:p-14' :
    'p-8 sm:p-10';

  const fontScaleClass =
    design.fontSizeScale === 'compact' ? 'text-[13px] leading-snug' :
    design.fontSizeScale === 'large' ? 'text-[15px] leading-relaxed' :
    'text-[14px] leading-snug';

  const tableHeaderStyle =
    design.tableHeaderStyle === 'filled'
      ? { backgroundColor: design.primaryColor, color: '#ffffff' }
      : design.tableHeaderStyle === 'tinted'
      ? { backgroundColor: `${design.primaryColor}18`, color: '#0f172a' }
      : design.tableHeaderStyle === 'bordered'
      ? { backgroundColor: '#ffffff', color: '#0f172a', borderTop: `2px solid ${design.primaryColor}`, borderBottom: `2px solid ${design.primaryColor}` }
      : { backgroundColor: '#0f172a', color: '#ffffff' };

  return (
    <div className="space-y-6">
      {/* Soft-Deleted Recovery Notice Banner */}
      {!isDesignerPreview && currentInvoice.isDeleted && (
        <div className="print:hidden bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-xs sm:text-sm">This invoice is in Recently Deleted (7-day recovery period)</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Deleted on {currentInvoice.deletedAt ? new Date(currentInvoice.deletedAt).toLocaleString('en-IN') : 'N/A'} by {currentInvoice.deletedBy || 'admin'}.
                {currentInvoice.deletionReason && ` Reason: "${currentInvoice.deletionReason}".`}
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{restoring ? 'Restoring...' : 'Restore Invoice'}</span>
          </button>
        </div>
      )}

      {/* Action Header (Hidden in Print or Designer Preview) */}
      {!isDesignerPreview && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/sales/invoices"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    invoice.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : invoice.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : invoice.paymentStatus === 'Partial'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {invoice.status === 'Cancelled' ? 'Cancelled' : invoice.paymentStatus}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  v{invoice.revisionNumber || 1}
                </span>
                {currentInvoice.invoiceType && currentInvoice.invoiceType !== 'TAX_INVOICE' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    {getInvoiceTypeTitle(currentInvoice.invoiceType)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <span className="font-medium text-slate-700">{customer.name || invoice.customer?.name}</span> • Date: {formatDate(invoice.date)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sales/invoices/${currentInvoice.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
              title="Edit permitted invoice details"
            >
              <Edit className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit</span>
            </Link>

            {!currentInvoice.isDeleted && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition"
                title="Move to Recently Deleted (7-day recovery)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition"
              title="View complete invoice change history and audit trail"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-xs transition"
              title="Compare any two invoice versions"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Versions</span>
            </button>

            {invoice.whatsappSharedAt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Shared
              </span>
            )}
            <button
              onClick={handleViewPdf}
              disabled={viewing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition disabled:opacity-50"
              title="View Tax Invoice PDF on demand in new tab"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>{viewing ? 'Opening...' : 'View PDF'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xs shadow-amber-500/20 transition disabled:opacity-50"
              title="Download Tax Invoice PDF directly"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{downloading ? 'Downloading...' : 'PDF'}</span>
            </button>

            {/* Image (PNG / JPEG) Dropdown & Modal Button */}
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => handleDownloadImage('png')}
                  disabled={imageDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-l-xl transition disabled:opacity-50"
                  title="Download Invoice as PNG image"
                >
                  <FileImage className="w-3.5 h-3.5 text-purple-600" />
                  <span>{imageDownloading ? 'Saving...' : 'PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
                  disabled={imageDownloading}
                  className="px-2 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border-t border-b border-r border-purple-200 rounded-r-xl transition disabled:opacity-50"
                  title="More image export options (JPEG, Copy Image, Preview)"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {isImageMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Invoice Image Options
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage('png')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-purple-600" />
                      <span>Download PNG</span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Lossless</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage('jpeg')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-indigo-600" />
                      <span>Download JPEG / JPG</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between border-t border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Image</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Ctrl+V</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsImageMenuOpen(false);
                      setIsImageModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100"
                  >
                    Preview & Advanced Options...
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* A4 Printable Document Container */}
      <div className="flex justify-center">
        <div
          id="printable-invoice-document"
          ref={printRef}
          style={fontStyle}
          className={`print-container bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg border border-slate-200 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:w-full text-slate-900 ${radiusClass} ${paddingClass} ${fontScaleClass}`}
        >
          {/* Top Title Banner */}
          <div className="w-full py-2.5 bg-[#EEF0FD] text-[#4257B8] font-black text-xs sm:text-sm tracking-wider uppercase text-center rounded-sm">
            {getInvoiceTypeTitle(currentInvoice.invoiceType)}
          </div>

          {/* Header Row: Logo & Business Details */}
          <div
            className={`py-4 border-b border-slate-200 items-center ${
              design.logoPosition === 'center'
                ? 'flex flex-col text-center gap-3'
                : 'grid grid-cols-12 gap-4'
            }`}
          >
            {/* Logo */}
            {design.logoPosition !== 'hidden' && (
              <div
                className={
                  design.logoPosition === 'center'
                    ? 'flex justify-center'
                    : design.logoPosition === 'right'
                    ? 'col-span-3 order-2 flex items-center justify-end'
                    : 'col-span-3 order-1 flex items-center justify-start'
                }
              >
                <div
                  className="relative rounded-2xl overflow-hidden border border-[#CAD5E2] shadow-xs shrink-0 bg-white p-1"
                  style={{
                    width: `${design.logoSize}px`,
                    height: `${design.logoSize}px`,
                  }}
                >
                  <img
                    src={business.logoUrl || '/brand/logo.png'}
                    crossOrigin="anonymous"
                    alt={business.companyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Business Contact */}
            <div
              className={
                design.logoPosition === 'center'
                  ? 'w-full text-center'
                  : design.logoPosition === 'hidden'
                  ? 'col-span-12 text-left'
                  : design.logoPosition === 'right'
                  ? 'col-span-9 order-1 text-left'
                  : 'col-span-9 order-2 text-right'
              }
            >
              <h1 className="text-3xl sm:text-[32px] font-black tracking-tight text-slate-900 leading-none">
                <span>{business.companyName}</span>
              </h1>
              {design.showTagline && business.tagline && (
                <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#4257B8] mt-1">
                  {business.tagline}
                </p>
              )}
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 max-w-lg ml-auto font-normal">
                {business.address}
              </p>
              {design.showContactInfo && (
                <div className="text-xs sm:text-[13px] text-slate-600 mt-1 space-x-2">
                  <span>Phone no.: <strong className="font-bold text-slate-900">{business.phone}</strong></span>
                  <span>•</span>
                  <span>Email: <strong className="font-bold text-slate-900">{business.email}</strong></span>
                </div>
              )}
              {business.gstin && business.gstin.trim() && business.gstin !== 'null' && business.gstin !== '24AANPA0000A1Z5' && (
                <p className="text-xs sm:text-[13px] text-slate-600 mt-0.5">
                  GSTIN: <strong className="font-bold text-slate-900">{business.gstin}</strong>
                </p>
              )}

            </div>
          </div>

          {/* Party and Invoice Details Row */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-[#CAD5E2]">
            {design.swapCustomerMetaPosition ? (
              <>
                {/* Swapped: Invoice Details on Left */}
                <div className="border-r border-[#CAD5E2] pr-4 space-y-1 text-left">
                  <div className="text-xs sm:text-[13px] font-black uppercase tracking-wider mb-2 text-[#4257B8]">
                    {design.invoiceMetaTitle || 'INVOICE DETAILS'}
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>
                      {getInvoiceNumberLabel(currentInvoice.invoiceType)}:
                    </span>{' '}
                    <strong className="text-base sm:text-lg text-slate-900 font-black">{invoice.invoiceNumber}</strong>
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>Date:</span>{' '}
                    <strong className="font-bold text-slate-900">{formatDate(invoice.date)}</strong>
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>Payment Mode:</span>{' '}
                    <strong className="font-bold text-slate-900">{invoice.paymentMode || 'Cash'}</strong>
                  </div>
                  {invoice.dueDate && (
                    <div className="text-xs sm:text-[13px] text-slate-600">
                      <span>Due Date:</span>{' '}
                      <span className="font-bold text-slate-800">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>

                {/* Bill To on Right */}
                <div className="pl-4 text-right">
                  <div className="text-xs sm:text-[13px] font-black uppercase tracking-wider mb-2 text-[#4257B8]">
                    {design.customerCardTitle || 'BILLED TO'}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {customer.name || invoice.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                    Contact No.: <strong className="font-bold text-slate-900">{customer.phone || invoice.customer?.phone || '-'}</strong>
                  </div>
                  {(customer.email || invoice.customer?.email) && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-0.5">
                      Email: {customer.email || invoice.customer.email}
                    </div>
                  )}
                  {(customer.address || invoice.customer?.address) && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-1 leading-snug">
                      Address: {customer.address || invoice.customer.address}
                    </div>
                  )}
                  <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                    State: {customer.state || invoice.customer?.state || 'Gujarat'} (Code: {customer.stateCode || invoice.customer?.stateCode || '24'})
                  </div>
                  {(customer.gstin || invoice.customer?.gstin) && (customer.gstin || invoice.customer?.gstin).trim() && (customer.gstin || invoice.customer?.gstin) !== 'null' && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                      GSTIN: <strong className="font-bold text-slate-900">{customer.gstin || invoice.customer?.gstin}</strong>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <>
                {/* Normal: Bill To on Left */}
                <div className="border-r border-[#CAD5E2] pr-4">
                  <div className="text-xs sm:text-[13px] font-black uppercase tracking-wider mb-2 text-[#4257B8]">
                    {design.customerCardTitle || 'BILLED TO'}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {customer.name || invoice.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                    Contact No.: <strong className="font-bold text-slate-900">{customer.phone || invoice.customer?.phone || '-'}</strong>
                  </div>
                  {(customer.email || invoice.customer?.email) && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-0.5">
                      Email: {customer.email || invoice.customer.email}
                    </div>
                  )}
                  {(customer.address || invoice.customer?.address) && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-1 leading-snug">
                      Address: {customer.address || invoice.customer.address}
                    </div>
                  )}
                  <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                    State: {customer.state || invoice.customer?.state || 'Gujarat'} (Code: {customer.stateCode || invoice.customer?.stateCode || '24'})
                  </div>
                  {(customer.gstin || invoice.customer?.gstin) && (customer.gstin || invoice.customer?.gstin).trim() && (customer.gstin || invoice.customer?.gstin) !== 'null' && (
                    <div className="text-xs sm:text-[13px] text-slate-600 mt-1">
                      GSTIN: <strong className="font-bold text-slate-900">{customer.gstin || invoice.customer?.gstin}</strong>
                    </div>
                  )}

                </div>

                {/* Invoice Details on Right */}
                <div className="pl-4 space-y-1 text-right">
                  <div className="text-xs sm:text-[13px] font-black uppercase tracking-wider mb-2 text-[#4257B8]">
                    {design.invoiceMetaTitle || 'INVOICE DETAILS'}
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>
                      {getInvoiceNumberLabel(currentInvoice.invoiceType)}:
                    </span>{' '}
                    <strong className="text-base sm:text-lg text-slate-900 font-black">{invoice.invoiceNumber}</strong>
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>Date:</span>{' '}
                    <strong className="font-bold text-slate-900">{formatDate(invoice.date)}</strong>
                  </div>
                  <div className="text-xs sm:text-[13px] text-slate-600">
                    <span>Payment Mode:</span>{' '}
                    <strong className="font-bold text-slate-900">{invoice.paymentMode || 'Cash'}</strong>
                  </div>
                  {invoice.dueDate && (
                    <div className="text-xs sm:text-[13px] text-slate-600">
                      <span>Due Date:</span>{' '}
                      <span className="font-bold text-slate-800">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Line Items Table */}
          <div className="py-3">
            <table className="w-full text-left border-collapse border border-[#CAD5E2]">
              <thead>
                <tr className="text-xs sm:text-[13px] uppercase font-black bg-[#EEF0FD] text-[#1A202C]">
                  {design.showSerialColumn && (
                    <th className="py-3 px-2.5 w-10 text-center border-r border-[#CAD5E2]">#</th>
                  )}
                  <th className="py-3 px-3 border-r border-[#CAD5E2]">ITEM NAME & SPECIFICATIONS</th>
                  {design.showHsnColumn && (
                    <th className="py-3 px-2 text-center w-20 border-r border-[#CAD5E2]">HSN</th>
                  )}
                  <th className="py-3 px-2 text-center w-16 border-r border-[#CAD5E2]">QTY</th>
                  {design.showUnitColumn && (
                    <th className="py-3 px-2 text-center w-14 border-r border-[#CAD5E2]">UNIT</th>
                  )}
                  {design.showDiscountColumn && (
                    <th className="py-3 px-2 text-center w-16 border-r border-[#CAD5E2]">DISC</th>
                  )}
                  <th className="py-3 px-3 text-right w-28 border-r border-[#CAD5E2]">PRICE / UNIT</th>
                  <th className="py-3 px-3 text-right w-32">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CAD5E2] text-xs sm:text-sm">
                {invoice.items?.map((item: any, idx: number) => (
                  <tr
                    key={item.id || idx}
                    className="bg-white hover:bg-slate-50/50"
                  >
                    {design.showSerialColumn && (
                      <td className="py-3 px-2.5 text-center font-semibold text-slate-600 border-r border-[#CAD5E2]">
                        {idx + 1}
                      </td>
                    )}
                    <td className="py-3 px-3 border-r border-[#CAD5E2]">
                      <div className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                        {item.description || item.product?.name}
                      </div>
                      {design.showWarrantyColumn && (item.serialNumber || item.warranty) && (
                        <div className="text-xs font-mono text-purple-700 font-semibold mt-1 flex items-center gap-1.5">
                          {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                          {item.serialNumber && item.warranty && <span>•</span>}
                          {item.warranty && <span>Warranty: {item.warranty}</span>}
                        </div>
                      )}
                    </td>
                    {design.showHsnColumn && (
                      <td className="py-3 px-2 text-center text-slate-700 font-medium border-r border-[#CAD5E2]">
                        {item.hsn || '8471'}
                      </td>
                    )}
                    <td className="py-3 px-2 text-center font-bold text-slate-900 border-r border-[#CAD5E2]">
                      {item.quantity}
                    </td>
                    {design.showUnitColumn && (
                      <td className="py-3 px-2 text-center text-slate-700 font-medium border-r border-[#CAD5E2]">
                        {item.unit || 'Pcs'}
                      </td>
                    )}
                    {design.showDiscountColumn && (
                      <td className="py-3 px-2 text-center text-emerald-700 font-semibold border-r border-[#CAD5E2]">
                        {item.discountAmount ? formatCurrency(item.discountAmount) : '-'}
                      </td>
                    )}
                    <td className="py-3 px-3 text-right text-slate-800 font-medium border-r border-[#CAD5E2]">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F1F5F9] font-bold text-xs sm:text-sm border-t-2 border-[#CAD5E2]">
                  <td
                    colSpan={(design.showSerialColumn ? 1 : 0) + 1 + (design.showHsnColumn ? 1 : 0)}
                    className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-[#CAD5E2]"
                  >
                    Total
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 border-r border-[#CAD5E2]">
                    {totalQuantity}
                  </td>
                  {design.showUnitColumn && (
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 border-r border-[#CAD5E2]">
                      Pcs
                    </td>
                  )}
                  {design.showDiscountColumn && (
                    <td className="border-r border-[#CAD5E2]"></td>
                  )}
                  <td className="border-r border-[#CAD5E2]"></td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900 text-sm sm:text-base">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in words and Financial summary */}
          <div className="grid grid-cols-12 gap-4 py-2 border-t border-b border-[#CAD5E2]">
            {/* Amount In Words & Optional Bank Info */}
            <div className="col-span-7 pr-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                INVOICE AMOUNT IN WORDS:
              </div>
              <div className="font-bold text-slate-900 text-sm sm:text-base italic bg-[#F8FAFC] p-3 rounded-lg border border-[#CAD5E2]">
                {numberToWords(grandTotal)}
              </div>

              {/* Quality Guarantee Box */}
              <div className="mt-3 p-3 bg-[#F5FAFF] rounded-lg border border-[#BFDBFE] text-xs sm:text-[13px] text-slate-700">
                <span className="font-bold text-[#2563EB] block mb-0.5">Description & Condition:</span>
                {invoice.notes || "Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service."}
              </div>

              {/* Bank & UPI Details (Side Position) */}
              {design.bankDetailsPosition === 'left' && (
                <div className="mt-3 flex items-start gap-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#CAD5E2] text-xs sm:text-[13px]">
                  <div className="flex-1 space-y-0.5">
                    <span
                      className="font-bold block mb-1 text-[#4257B8]"
                    >
                      Bank & Payment Details:
                    </span>
                    <div>Bank Name: <span className="font-medium text-slate-800">{business.bankName}</span></div>
                    <div>Account No.: <span className="font-mono font-medium text-slate-800">{business.accountNumber}</span></div>
                    <div>IFSC Code: <span className="font-mono font-medium text-slate-800">{business.ifscCode}</span></div>
                    <div>UPI ID: <span className="font-mono font-bold text-[#4257B8]">{business.upiId}</span></div>
                  </div>
                  {design.showUpiQrCode && (
                    <div className="text-center shrink-0">
                      <img
                        src={qrCodeUrl}
                        crossOrigin="anonymous"
                        alt="UPI QR Code"
                        style={{ width: `${design.qrCodeSize}px`, height: `${design.qrCodeSize}px` }}
                        className="rounded border border-[#CAD5E2] p-0.5 bg-white object-contain"
                      />
                      <span className="text-[11px] text-slate-500 block mt-0.5">Scan & Pay</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="col-span-5 space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Sub Total:</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span className="font-medium">Discount {invoice.discountPercent ? `(${invoice.discountPercent}%)` : ''}:</span>
                  <span className="font-bold">- {formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {(() => {
                const isNoTax = currentInvoice.invoiceType === 'BILL_OF_SUPPLY' || 
                                currentInvoice.invoiceType === 'NON_GST' || 
                                currentInvoice.invoiceType === 'PROFORMA' ||
                                currentInvoice.invoiceType === 'QUOTATION' ||
                                currentInvoice.invoiceType === 'CASH_MEMO' ||
                                currentInvoice.taxConfiguration === 'NONE' ||
                                (!invoice.cgst && !invoice.sgst && !invoice.igst);
                const isExempt = currentInvoice.taxConfiguration === 'EXEMPT';
                const isIgst = currentInvoice.taxConfiguration === 'IGST';

                if (isNoTax) return null;

                if (isExempt) {
                  return (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                      <span>GST (Exempt / Nil-Rated):</span>
                      <span className="font-medium">₹0.00 (0%)</span>
                    </div>
                  );
                }

                if (isIgst) {
                  return (
                    <>
                      {invoice.taxableAmount > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">Taxable Value:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(invoice.taxableAmount)}</span>
                        </div>
                      )}
                      {invoice.igst > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                          <span className="font-medium">IGST (18%):</span>
                          <span className="font-bold text-slate-900">{formatCurrency(invoice.igst)}</span>
                        </div>
                      )}
                    </>
                  );
                }

                return (
                  <>
                    {invoice.taxableAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">Taxable Value:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(invoice.taxableAmount)}</span>
                      </div>
                    )}
                    {invoice.cgst > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                        <span className="font-medium">CGST (9%):</span>
                        <span className="font-bold text-slate-900">{formatCurrency(invoice.cgst)}</span>
                      </div>
                    )}
                    {invoice.sgst > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                        <span className="font-medium">SGST (9%):</span>
                        <span className="font-bold text-slate-900">{formatCurrency(invoice.sgst)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm sm:text-base font-bold text-slate-900 items-baseline">
                <span className="text-base sm:text-lg font-black text-slate-900">Grand Total:</span>
                <span className="text-xl sm:text-2xl font-black text-[#4257B8]">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Received / Paid:</span>
                <span className="font-bold text-[#059669] text-sm sm:text-base">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm sm:text-base font-bold items-baseline">
                <span className={balanceDue > 0 ? 'text-rose-600' : 'text-slate-600'}>
                  Balance Due:
                </span>
                <span className={balanceDue > 0 ? 'text-rose-600 text-base sm:text-lg font-black' : 'text-slate-800'}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Full Width Bank Details Option */}
          {design.bankDetailsPosition === 'full' && (
            <div className="my-3 flex items-start gap-4 p-3 bg-[#F8FAFC] rounded-xl border border-[#CAD5E2] text-xs sm:text-[13px]">
              <div className="flex-1 space-y-0.5">
                <span className="font-bold block mb-1 text-[#4257B8]">
                  Bank & Payment Details:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>Bank Name: <span className="font-medium text-slate-800">{business.bankName}</span></div>
                  <div>Account No.: <span className="font-mono font-medium text-slate-800">{business.accountNumber}</span></div>
                  <div>IFSC Code: <span className="font-mono font-medium text-slate-800">{business.ifscCode}</span></div>
                  <div>UPI ID: <span className="font-mono font-bold text-[#4257B8]">{business.upiId}</span></div>
                </div>
              </div>
              {design.showUpiQrCode && (
                <div className="text-center shrink-0">
                  <img
                    src={qrCodeUrl}
                    crossOrigin="anonymous"
                    alt="UPI QR Code"
                    style={{ width: `${design.qrCodeSize}px`, height: `${design.qrCodeSize}px` }}
                    className="rounded border border-[#CAD5E2] p-0.5 bg-white object-contain"
                  />
                  <span className="text-[11px] text-slate-500 block mt-0.5">Scan & Pay</span>
                </div>
              )}
            </div>
          )}

          {/* Terms and Signature Footer */}
          <div className="grid grid-cols-12 gap-4 pt-4 items-end border-t border-[#CAD5E2] mt-4">
            {/* Terms and Conditions */}
            {design.termsPosition !== 'hidden' ? (
              <div className="col-span-8 text-xs sm:text-[12.5px] text-slate-600 leading-normal pr-4">
                <div className="font-black uppercase tracking-wider mb-1.5 text-[#4257B8]">
                  TERMS AND CONDITIONS:
                </div>
                <div className="whitespace-pre-line text-slate-700 space-y-1">
                  {business.terms}
                </div>
              </div>
            ) : (
              <div className="col-span-8"></div>
            )}

            {/* Authorized Signatory */}
            <div
              className={`col-span-4 ${
                design.signatoryPosition === 'left'
                  ? 'text-left'
                  : design.signatoryPosition === 'center'
                  ? 'text-center'
                  : 'text-right'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">
                For: {business.companyName}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 mb-1">
                Ashirwad Technologies
              </div>
              {design.showSignatureImage && (
                <div
                  className={`relative ${
                    design.signatoryPosition === 'left'
                      ? 'mr-auto ml-0'
                      : design.signatoryPosition === 'center'
                      ? 'mx-auto'
                      : 'ml-auto mr-0'
                  }`}
                  style={{ height: `${design.signatureHeight}px`, width: '140px' }}
                >
                  <img
                    src={business.signatureUrl || '/brand/signature.jpeg'}
                    crossOrigin="anonymous"
                    alt="Authorized Signatory"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div
                className={`text-xs sm:text-sm font-bold text-slate-900 border-t border-[#CAD5E2] pt-1 mt-1 ${
                  design.signatoryPosition === 'left'
                    ? 'text-left'
                    : design.signatoryPosition === 'center'
                    ? 'text-center'
                    : 'text-right'
                }`}
              >
                {design.signatoryTitle || 'Authorized Signatory'}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-2 border-t border-[#CAD5E2] text-center text-xs text-slate-500">
            {design.footerText || business.footer}
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {isWhatsAppOpen && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          invoice={currentInvoice}
          settings={business}
          invoiceElementId="printable-invoice-document"
          onShared={() => {
            setCurrentInvoice({ ...currentInvoice, whatsappSharedAt: new Date().toISOString() });
          }}
        />
      )}

      {/* Invoice Change History / Audit Trail Modal */}
      <InvoiceAuditHistoryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        invoice={currentInvoice}
      />

      {/* Invoice Version Comparison Modal */}
      <InvoiceVersionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        invoice={currentInvoice}
      />

      {/* Soft Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Move to Recently Deleted?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice: <span className="font-mono font-bold text-slate-800">{currentInvoice.invoiceNumber}</span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Move this invoice to Recently Deleted? It can be recovered for 7 days.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deletion Reason (Optional)
                </label>
                <input
                  type="text"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="e.g. Returned by customer, entered in error..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-rose-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {deleting ? 'Moving...' : 'Move to Recently Deleted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Image Export Modal */}
      <InvoiceImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        invoice={currentInvoice}
        settings={business}
        onShareWhatsApp={() => {
          setIsImageModalOpen(false);
          setIsWhatsAppOpen(true);
        }}
      />

      {/* Image Copied Toast Notification */}
      {imageCopied && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Invoice image copied to clipboard! Ready to paste into WhatsApp Web or Email.</span>
        </div>
      )}
    </div>
  );
}

