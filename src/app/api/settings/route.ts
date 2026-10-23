import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    let settings = await db.businessSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await db.businessSettings.create({
        data: {
          id: 'default',
          companyName: 'ASHIRWAD TECH',
          tagline: 'Repair | Upgrade | Build | Service',
          address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
          phone: '9662278994',
          email: 'rajsoni2962@gmail.com',
          gstin: '',
          state: 'Gujarat',
          stateCode: '24',
          bankName: 'State Bank of India',
          accountNumber: '39485720194',
          ifscCode: 'SBIN0001234',
          upiId: '9662278994@upi',
          invoicePrefix: 'AT/2026/',
          nextInvoiceNumber: 110,
          purchasePrefix: 'PO/2026/',
          nextPurchaseNumber: 201,
          logoUrl: '/brand/logo.png',
          signatureUrl: '/brand/signature.jpeg',
          terms: `* Tested and working perfectly at the time of sale.
* Please inspect the laptop before purchase.
* 6 Months of warranty covers technical issues only and excludes physical or liquid damage.
* Battery backup may vary depending on usage.
* No return or refund after sale unless covered under warranty.
* Thank you for choosing us—we’re always here to help if you need support.`,
          footer: "Thank you for choosing us—we're always here to help if you need support.",
          authorizedSignatory: 'Ashirwad Tech\nRaj Soni\nProprietor',
        },
      });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const updated = await db.businessSettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: body.companyName,
        tagline: body.tagline,
        address: body.address,
        phone: body.phone,
        email: body.email,
        gstin: body.gstin ? (body.gstin.trim() === 'null' ? '' : body.gstin.trim()) : '',
        state: body.state,
        stateCode: body.stateCode,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        upiId: body.upiId,
        invoicePrefix: body.invoicePrefix,
        nextInvoiceNumber: parseInt(body.nextInvoiceNumber) || 1,
        purchasePrefix: body.purchasePrefix,
        nextPurchaseNumber: parseInt(body.nextPurchaseNumber) || 1,
        terms: body.terms,
        footer: body.footer,
        authorizedSignatory: body.authorizedSignatory,
        logoUrl: body.logoUrl,
        signatureUrl: body.signatureUrl,
        invoiceDesign: body.invoiceDesign !== undefined ? (typeof body.invoiceDesign === 'object' ? JSON.stringify(body.invoiceDesign) : body.invoiceDesign) : undefined,
      },
      create: {
        id: 'default',
        companyName: body.companyName || 'ASHIRWAD TECH',
        ...body,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
