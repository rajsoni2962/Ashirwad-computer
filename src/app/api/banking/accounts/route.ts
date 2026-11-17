import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    let accounts = await db.bankAccount.findMany({
      where: { isActive: true },
      orderBy: [{ accountType: 'asc' }, { isDefault: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            payments: true,
            contraFrom: true,
            contraTo: true,
          },
        },
      },
    });

    // Auto-bootstrap default Cash and Primary Bank accounts if none exist
    if (accounts.length === 0) {
      const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });

      const cashAccount = await db.bankAccount.create({
        data: {
          accountName: 'Cash in Hand',
          accountType: 'CASH',
          isDefault: true,
          currentBalance: 0.0,
          openingBalance: 0.0,
        },
      });

      const bankAccount = await db.bankAccount.create({
        data: {
          accountName: settings?.bankName || 'Primary Bank Account',
          accountType: 'BANK',
          bankName: settings?.bankName || 'Kotak Mahindra Bank',
          accountNumber: settings?.accountNumber || '5947557983',
          ifscCode: settings?.ifscCode || 'KKBK0000879',
          upiId: settings?.upiId || 'rajsoni2962-2@okaxis',
          isDefault: false,
          currentBalance: 0.0,
          openingBalance: 0.0,
        },
      });

      accounts = [
        { ...cashAccount, _count: { payments: 0, contraFrom: 0, contraTo: 0 } },
        { ...bankAccount, _count: { payments: 0, contraFrom: 0, contraTo: 0 } },
      ] as any;
    }

    // Compute aggregate summaries
    const totalCash = accounts
      .filter((a) => a.accountType === 'CASH')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    const totalBank = accounts
      .filter((a) => a.accountType === 'BANK')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    const totalLiquidity = totalCash + totalBank;

    return NextResponse.json({
      success: true,
      data: accounts,
      summary: {
        totalCash,
        totalBank,
        totalLiquidity,
        totalAccounts: accounts.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const {
      accountName,
      accountType = 'BANK',
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      openingBalance = 0,
      isDefault = false,
    } = body;

    if (!accountName || !accountName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Account display name is required' },
        { status: 400 }
      );
    }

    const opBal = parseFloat(openingBalance) || 0;

    // If marked default, unset existing default of the same type
    if (isDefault) {
      await db.bankAccount.updateMany({
        where: { accountType },
        data: { isDefault: false },
      });
    }

    const account = await db.bankAccount.create({
      data: {
        accountName: accountName.trim(),
        accountType: accountType === 'CASH' ? 'CASH' : 'BANK',
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        ifscCode: ifscCode?.trim() || null,
        upiId: upiId?.trim() || null,
        openingBalance: opBal,
        currentBalance: opBal,
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: account,
    });
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bank account' },
      { status: 500 }
    );
  }
}
