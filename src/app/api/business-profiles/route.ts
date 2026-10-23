import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    let profiles = await db.businessProfile.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // If no profiles exist, ensure default profile is auto-seeded from business settings
    if (profiles.length === 0) {
      const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });
      const created = await db.businessProfile.create({
        data: {
          id: 'default',
          name: 'Head Office - Ahmedabad',
          isDefault: true,
          isActive: true,
          companyName: settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
          tagline: settings?.tagline || 'Beyond tech limits',
          address: settings?.address || 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
          phone: settings?.phone || '9662278994',
          email: settings?.email || 'rajsoni2962@gmail.com',
          gstin: settings?.gstin || '',
          state: settings?.state || 'Gujarat',
          stateCode: settings?.stateCode || '24',
          bankName: settings?.bankName || 'Kotak Mahindra Bank',
          accountNumber: settings?.accountNumber || '5947557983',
          ifscCode: settings?.ifscCode || 'KKBK0000879',
          upiId: settings?.upiId || 'rajsoni2962-2@okaxis',
          invoicePrefix: settings?.invoicePrefix || 'AT/2026/',
          nextInvoiceNumber: settings?.nextInvoiceNumber || 1,
          purchasePrefix: settings?.purchasePrefix || 'PO/2026/',
          nextPurchaseNumber: settings?.nextPurchaseNumber || 1,
          logoUrl: settings?.logoUrl || '/brand/logo.png',
          signatureUrl: settings?.signatureUrl || '/brand/signature.jpeg',
          terms: settings?.terms,
          footer: settings?.footer,
          authorizedSignatory: settings?.authorizedSignatory || 'Ashirwad Technologies\nRaj Soni\nProprietor',
        },
      });
      profiles = [created];
    }

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: any) {
    console.error('Error fetching business profiles:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can create business profiles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      companyName,
      tagline,
      address,
      phone,
      email,
      gstin,
      state,
      stateCode,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      invoicePrefix,
      nextInvoiceNumber,
      purchasePrefix,
      nextPurchaseNumber,
      logoUrl,
      signatureUrl,
      terms,
      footer,
      authorizedSignatory,
      isDefault,
    } = body;

    if (!name?.trim() || !companyName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Profile name, company name, and phone number are required.' },
        { status: 400 }
      );
    }

    const created = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.businessProfile.updateMany({
          data: { isDefault: false },
        });
      }

      return tx.businessProfile.create({
        data: {
          name: name.trim(),
          isDefault: Boolean(isDefault),
          isActive: true,
          companyName: companyName.trim(),
          tagline: tagline?.trim() || null,
          address: address?.trim() || '',
          phone: phone.trim(),
          email: email?.trim() || null,
          gstin: (gstin?.trim() === 'null' || !gstin) ? '' : gstin.trim(),
          state: state?.trim() || 'Gujarat',
          stateCode: stateCode?.trim() || '24',
          bankName: bankName?.trim() || null,
          accountNumber: accountNumber?.trim() || null,
          ifscCode: ifscCode?.trim() || null,
          upiId: upiId?.trim() || null,
          invoicePrefix: invoicePrefix?.trim() || 'AT/2026/',
          nextInvoiceNumber: parseInt(nextInvoiceNumber) || 1,
          purchasePrefix: purchasePrefix?.trim() || 'PO/2026/',
          nextPurchaseNumber: parseInt(nextPurchaseNumber) || 1,
          logoUrl: logoUrl || '/brand/logo.png',
          signatureUrl: signatureUrl || '/brand/signature.jpeg',
          terms: terms || null,
          footer: footer || null,
          authorizedSignatory: authorizedSignatory || `${companyName}\nProprietor`,
        },
      });
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error creating business profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
