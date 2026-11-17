import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const transfers = await db.contraTransfer.findMany({
      orderBy: { date: 'desc' },
      include: {
        fromAccount: {
          select: {
            id: true,
            accountName: true,
            accountType: true,
            bankName: true,
            accountNumber: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            accountName: true,
            accountType: true,
            bankName: true,
            accountNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error: any) {
    console.error('Error fetching contra transfers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contra transfers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { fromAccountId, toAccountId, amount, date, referenceNumber, notes } = body;

    const numAmount = parseFloat(amount);
    if (!fromAccountId || !toAccountId) {
      return NextResponse.json(
        { success: false, error: 'Source and destination accounts are required' },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { success: false, error: 'Source and destination accounts must be different' },
        { status: 400 }
      );
    }

    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Transfer amount must be greater than zero' },
        { status: 400 }
      );
    }

    const [fromAccount, toAccount] = await Promise.all([
      db.bankAccount.findUnique({ where: { id: fromAccountId } }),
      db.bankAccount.findUnique({ where: { id: toAccountId } }),
    ]);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { success: false, error: 'One or both accounts were not found' },
        { status: 404 }
      );
    }

    const transferDate = date ? new Date(date) : new Date();

    const result = await db.$transaction(async (tx) => {
      // 1. Generate unique sequential contra transfer number
      const currentYear = new Date().getFullYear();
      const prefix = `CONTRA/${currentYear}/`;
      const count = await tx.contraTransfer.count();
      let transferNumber = `${prefix}${String(count + 1).padStart(3, '0')}`;
      while (await tx.contraTransfer.findUnique({ where: { transferNumber } })) {
        transferNumber = `${prefix}${String(Math.floor(Math.random() * 9000) + 1000)}`;
      }

      // 2. Create Contra Record
      const contra = await tx.contraTransfer.create({
        data: {
          transferNumber,
          date: transferDate,
          fromAccountId,
          toAccountId,
          amount: numAmount,
          referenceNumber: referenceNumber?.trim() || null,
          notes: notes?.trim() || null,
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // 3. Update fromAccount balance (decrement)
      await tx.bankAccount.update({
        where: { id: fromAccountId },
        data: {
          currentBalance: { decrement: numAmount },
        },
      });

      // 4. Update toAccount balance (increment)
      await tx.bankAccount.update({
        where: { id: toAccountId },
        data: {
          currentBalance: { increment: numAmount },
        },
      });

      return contra;
    });

    return NextResponse.json({
      success: true,
      message: 'Contra transfer recorded successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating contra transfer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record contra transfer' },
      { status: 500 }
    );
  }
}
