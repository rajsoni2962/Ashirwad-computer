import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const profile = await db.businessProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Business profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await db.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.businessProfile.updateMany({
          where: { id: { not: id } },
          data: { isDefault: false },
        });

        // Also sync default business settings so system-wide defaults remain aligned
        await tx.businessSettings.updateMany({
          data: {
            companyName: body.companyName,
            tagline: body.tagline || '',
            address: body.address || '',
            phone: body.phone || '',
            email: body.email || '',
            gstin: (body.gstin && body.gstin !== 'null') ? body.gstin.trim() : '',
            bankName: body.bankName || '',
            accountNumber: body.accountNumber || '',
            ifscCode: body.ifscCode || '',
            upiId: body.upiId || '',
            invoicePrefix: body.invoicePrefix || 'AT/2026/',
            logoUrl: body.logoUrl || '/brand/logo.png',
            signatureUrl: body.signatureUrl || '/brand/signature.jpeg',
            terms: body.terms || '',
            footer: body.footer || '',
            authorizedSignatory: body.authorizedSignatory || '',
          },
        });
      }

      return tx.businessProfile.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name.trim() : undefined,
          isDefault: body.isDefault !== undefined ? Boolean(body.isDefault) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
          companyName: body.companyName !== undefined ? body.companyName.trim() : undefined,
          tagline: body.tagline !== undefined ? body.tagline : undefined,
          address: body.address !== undefined ? body.address : undefined,
          phone: body.phone !== undefined ? body.phone.trim() : undefined,
          email: body.email !== undefined ? body.email : undefined,
          gstin: body.gstin !== undefined ? ((body.gstin && body.gstin !== 'null') ? body.gstin.trim() : '') : undefined,
          state: body.state !== undefined ? body.state : undefined,
          stateCode: body.stateCode !== undefined ? body.stateCode : undefined,
          bankName: body.bankName !== undefined ? body.bankName : undefined,
          accountNumber: body.accountNumber !== undefined ? body.accountNumber : undefined,
          ifscCode: body.ifscCode !== undefined ? body.ifscCode : undefined,
          upiId: body.upiId !== undefined ? body.upiId : undefined,
          invoicePrefix: body.invoicePrefix !== undefined ? body.invoicePrefix.trim() : undefined,
          nextInvoiceNumber: body.nextInvoiceNumber !== undefined ? parseInt(body.nextInvoiceNumber) : undefined,
          purchasePrefix: body.purchasePrefix !== undefined ? body.purchasePrefix.trim() : undefined,
          nextPurchaseNumber: body.nextPurchaseNumber !== undefined ? parseInt(body.nextPurchaseNumber) : undefined,
          logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
          signatureUrl: body.signatureUrl !== undefined ? body.signatureUrl : undefined,
          terms: body.terms !== undefined ? body.terms : undefined,
          footer: body.footer !== undefined ? body.footer : undefined,
          authorizedSignatory: body.authorizedSignatory !== undefined ? body.authorizedSignatory : undefined,
          invoiceDesign: body.invoiceDesign !== undefined ? (typeof body.invoiceDesign === 'object' ? JSON.stringify(body.invoiceDesign) : body.invoiceDesign) : undefined,
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await params;

    // Check count of profiles
    const totalProfiles = await db.businessProfile.count();
    if (totalProfiles <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the only business profile. At least one profile must exist.' },
        { status: 400 }
      );
    }

    const profile = await db.businessProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    if (profile.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default profile. Set another profile as default before deleting.' },
        { status: 400 }
      );
    }

    await db.businessProfile.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Business profile deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
