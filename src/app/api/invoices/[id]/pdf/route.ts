import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInvoicePdf } from '@/lib/invoicePdfGenerator';
import fs from 'fs';
import path from 'path';

let serverCachedFonts: {
  regular?: string;
  bold?: string;
  italic?: string;
  boldItalic?: string;
} | null = null;

function loadServerFonts() {
  if (serverCachedFonts && serverCachedFonts.regular && serverCachedFonts.bold) {
    return serverCachedFonts;
  }
  const fonts: { regular?: string; bold?: string; italic?: string; boldItalic?: string } = {};
  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    if (fs.existsSync(path.join(fontsDir, 'arial.ttf'))) {
      fonts.regular = fs.readFileSync(path.join(fontsDir, 'arial.ttf')).toString('base64');
    }
    if (fs.existsSync(path.join(fontsDir, 'arialbd.ttf'))) {
      fonts.bold = fs.readFileSync(path.join(fontsDir, 'arialbd.ttf')).toString('base64');
    }
    if (fs.existsSync(path.join(fontsDir, 'ariali.ttf'))) {
      fonts.italic = fs.readFileSync(path.join(fontsDir, 'ariali.ttf')).toString('base64');
    }
    if (fs.existsSync(path.join(fontsDir, 'arialbi.ttf'))) {
      fonts.boldItalic = fs.readFileSync(path.join(fontsDir, 'arialbi.ttf')).toString('base64');
    }
    if (fonts.regular) {
      serverCachedFonts = fonts;
    }
  } catch {}
  return fonts;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payments: true,
        serialNumbers: true,
        businessProfile: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });

    let logoBase64: string | undefined;
    let signatureBase64: string | undefined;

    try {
      const pngPath = path.join(process.cwd(), 'public', 'brand', 'logo.png');
      const jpegPath = path.join(process.cwd(), 'public', 'brand', 'logo.jpeg');
      const logoPath = fs.existsSync(pngPath) ? pngPath : jpegPath;
      if (fs.existsSync(logoPath)) {
        logoBase64 = fs.readFileSync(logoPath).toString('base64');
      }
    } catch {}

    try {
      const sigPath = path.join(process.cwd(), 'public', 'brand', 'signature.jpeg');
      if (fs.existsSync(sigPath)) {
        signatureBase64 = fs.readFileSync(sigPath).toString('base64');
      }
    } catch {}

    const fonts = loadServerFonts();
    const urlObj = new URL(request.url);
    const baseUrl = urlObj.origin;

    const { arrayBuffer, filename } = await generateInvoicePdf(invoice, settings, {
      logoBase64,
      signatureBase64,
      fonts,
      baseUrl,
    });

    // Record on-demand generation timestamp (never modifies historical invoice numbers/totals)
    await db.invoice
      .update({
        where: { id },
        data: { pdfGeneratedAt: new Date() },
      })
      .catch(() => {});

    const disposition = urlObj.searchParams.get('inline') === 'true' ? 'inline' : 'attachment';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Invoice PDF API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
