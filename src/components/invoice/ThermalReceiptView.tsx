'use client';

import React from 'react';
import { formatCurrency, formatDate, numberToWords, getInvoiceTypeTitle } from '@/lib/utils';

export interface ThermalReceiptProps {
  invoice: any;
  business: {
    companyName: string;
    tagline?: string;
    address: string;
    phone: string;
    email?: string;
    gstin?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    terms?: string;
  };
  paperWidth?: '80mm' | '58mm';
  showQrCode?: boolean;
}

export default function ThermalReceiptView({
  invoice,
  business,
  paperWidth = '80mm',
  showQrCode = true,
}: ThermalReceiptProps) {
  const is58mm = paperWidth === '58mm';
  const grandTotal = invoice.grandTotal || 0;
  const paidAmount = invoice.paidAmount || 0;
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : grandTotal - paidAmount;
  const totalQty = invoice.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0;

  const upiLink = business.upiId
    ? `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.companyName)}&am=${encodeURIComponent(grandTotal)}&cu=INR&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}`
    : '';
  const qrCodeUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiLink)}`
    : '';

  return (
    <div
      className={`thermal-receipt font-mono text-black bg-white select-none ${
        is58mm ? 'w-[58mm] max-w-[58mm] text-[10px] leading-tight p-2' : 'w-[80mm] max-w-[80mm] text-[11px] leading-snug p-3'
      }`}
      style={{
        fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
      }}
    >
      {/* Header */}
      <div className="text-center">
        <h1 className={`${is58mm ? 'text-xs' : 'text-sm'} font-black uppercase tracking-tight`}>
          {business.companyName}
        </h1>
        {business.tagline && (
          <p className="text-[9px] uppercase tracking-wider text-slate-700 font-semibold mt-0.5">
            {business.tagline}
          </p>
        )}
        <p className="text-[9px] text-slate-700 mt-1 whitespace-pre-line leading-tight">
          {business.address}
        </p>
        <p className="text-[9px] text-slate-800 font-bold mt-0.5">
          Ph: {business.phone}
          {business.email ? ` | ${business.email}` : ''}
        </p>
        {business.gstin && business.gstin.trim() && business.gstin !== 'null' && (
          <p className="text-[9px] font-bold mt-0.5">
            GSTIN: {business.gstin}
          </p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-2" />

      {/* Invoice Title */}
      <div className="text-center font-black uppercase tracking-wider">
        *** {getInvoiceTypeTitle(invoice.invoiceType) || 'TAX INVOICE'} ***
      </div>

      {/* Metadata */}
      <div className="mt-1 text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Inv No:</span>
          <span className="font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(invoice.date)}</span>
        </div>
        {invoice.customer && (
          <>
            <div className="border-t border-dotted border-slate-400 my-1 pt-1" />
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold truncate max-w-[150px]">{invoice.customer.name || 'Walk-in'}</span>
            </div>
            {invoice.customer.phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{invoice.customer.phone}</span>
              </div>
            )}
            {invoice.customer.gstin && (
              <div className="flex justify-between">
                <span>Cust GSTIN:</span>
                <span>{invoice.customer.gstin}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-2" />

      {/* Items Table */}
      {is58mm ? (
        // 58mm Ultra-compact layout: 2-line per item
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold border-b border-dotted border-black pb-0.5">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          {invoice.items?.map((it: any, idx: number) => (
            <div key={idx} className="border-b border-dotted border-slate-300 pb-1">
              <div className="font-bold leading-tight">
                {idx + 1}. {it.description || it.product?.name}
              </div>
              {it.serialNumber && (
                <div className="text-[8px] text-slate-700">SN: {it.serialNumber}</div>
              )}
              <div className="flex justify-between text-slate-800 text-[9px] mt-0.5">
                <span>
                  {it.quantity} x {formatCurrency(it.rate)}
                  {it.gstRate ? ` (${it.gstRate}%)` : ''}
                </span>
                <span className="font-bold">{formatCurrency(it.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 80mm Standard layout: 4-column
        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dotted border-black font-bold">
                <th className="py-0.5">ITEM</th>
                <th className="py-0.5 text-center">QTY</th>
                <th className="py-0.5 text-right">RATE</th>
                <th className="py-0.5 text-right">AMT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-slate-300">
              {invoice.items?.map((it: any, idx: number) => (
                <tr key={idx} className="align-top">
                  <td className="py-1 pr-1">
                    <div className="font-bold leading-tight">
                      {it.description || it.product?.name}
                    </div>
                    {it.serialNumber && (
                      <div className="text-[9px] text-slate-700">SN: {it.serialNumber}</div>
                    )}
                    {it.hsnCode && (
                      <div className="text-[8px] text-slate-600">HSN: {it.hsnCode}</div>
                    )}
                  </td>
                  <td className="py-1 text-center font-bold">{it.quantity}</td>
                  <td className="py-1 text-right tabular-nums">{formatCurrency(it.rate)}</td>
                  <td className="py-1 text-right font-bold tabular-nums">{formatCurrency(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-2" />

      {/* Totals Section */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Total Qty:</span>
          <span className="font-bold">{totalQty}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-bold">{formatCurrency(invoice.subtotal || invoice.taxableAmount)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-slate-800">
            <span>Discount ({invoice.discountPercent || 0}%):</span>
            <span>-{formatCurrency(invoice.discountAmount)}</span>
          </div>
        )}
        {(invoice.cgst > 0 || invoice.sgst > 0) && (
          <>
            <div className="flex justify-between text-slate-700">
              <span>CGST:</span>
              <span>{formatCurrency(invoice.cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>SGST:</span>
              <span>{formatCurrency(invoice.sgst)}</span>
            </div>
          </>
        )}
        {invoice.igst > 0 && (
          <div className="flex justify-between text-slate-700">
            <span>IGST:</span>
            <span>{formatCurrency(invoice.igst)}</span>
          </div>
        )}

        <div className="border-t border-double border-black my-1 pt-1 flex justify-between font-black text-xs">
          <span>GRAND TOTAL:</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>

        <div className="flex justify-between text-[9px] pt-0.5">
          <span>Received ({invoice.paymentMode || 'Cash'}):</span>
          <span className="font-bold">{formatCurrency(paidAmount)}</span>
        </div>
        {balanceDue > 0 && (
          <div className="flex justify-between font-bold text-rose-700">
            <span>Balance Due:</span>
            <span>{formatCurrency(balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Amount in words */}
      <div className="mt-2 text-[9px] text-slate-700 italic border-t border-dotted border-slate-400 pt-1">
        Amount in words: {numberToWords(grandTotal)}
      </div>

      {/* Bank & UPI QR Payment */}
      {showQrCode && upiLink && (
        <div className="mt-2 pt-2 border-t border-dashed border-black text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1">
            Scan & Pay via UPI
          </p>
          <div className="flex justify-center my-1">
            <img
              src={qrCodeUrl}
              alt="UPI QR Code"
              className="w-24 h-24 border border-black p-1 bg-white"
            />
          </div>
          <p className="text-[8px] font-mono text-slate-800">
            UPI: {business.upiId}
          </p>
        </div>
      )}

      {/* Bank Details (if 80mm) */}
      {!is58mm && business.accountNumber && (
        <div className="mt-2 text-[8px] text-slate-700 border-t border-dotted border-slate-400 pt-1 leading-tight">
          <div>Bank: {business.bankName} | A/C: {business.accountNumber}</div>
          <div>IFSC: {business.ifscCode}</div>
        </div>
      )}

      {/* Footer Notes & Sign */}
      <div className="mt-3 border-t border-dashed border-black pt-2 text-center text-[9px] space-y-1">
        <p className="font-semibold">Thank you for your business!</p>
        <p className="text-[8px] text-slate-600">Goods once sold cannot be returned without original bill.</p>
        <div className="pt-2">
          <p className="text-[8px] uppercase font-bold">For {business.companyName}</p>
          <p className="text-[8px] text-slate-500 italic mt-3">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
