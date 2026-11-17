'use client';

import React, { useRef, useState } from 'react';
import { X, Printer, Receipt, Sparkles } from 'lucide-react';
import ThermalReceiptView from './ThermalReceiptView';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  business: any;
}

export default function ThermalPrintModal({
  isOpen,
  onClose,
  invoice,
  business,
}: ThermalPrintModalProps) {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [showQrCode, setShowQrCode] = useState(true);
  const [printing, setPrinting] = useState(false);
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!receiptContainerRef.current) return;
    setPrinting(true);

    try {
      const receiptHtml = receiptContainerRef.current.innerHTML;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        window.print();
        setPrinting(false);
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Thermal Receipt - ${invoice.invoiceNumber}</title>
            <style>
              @page {
                size: ${paperWidth} auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 4px;
                background: #fff;
                color: #000;
                font-family: 'Courier New', Courier, monospace;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .thermal-receipt {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            ${receiptHtml}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          setPrinting(false);
        }, 1000);
      }, 300);
    } catch (err) {
      console.error('Thermal print error:', err);
      setPrinting(false);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Thermal POS Receipt
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                  {paperWidth}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Ready for 80mm & 58mm thermal roll printers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 font-bold rounded-lg transition text-xs ${
                paperWidth === '80mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm (3-inch)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 font-bold rounded-lg transition text-xs ${
                paperWidth === '58mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm (2-inch)
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Include UPI QR Code</span>
          </label>
        </div>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center items-start">
          <div
            ref={receiptContainerRef}
            className="bg-white shadow-xl border border-slate-300 rounded-sm overflow-hidden"
          >
            <ThermalReceiptView
              invoice={invoice}
              business={business}
              paperWidth={paperWidth}
              showQrCode={showQrCode}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Supports Epson, TVS, Citizen, NGX, Bluetooth POS & USB thermal printers.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>{printing ? 'Sending to Printer...' : `Print ${paperWidth} Receipt`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
