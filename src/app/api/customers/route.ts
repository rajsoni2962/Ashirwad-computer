import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'active'; // 'active' (default), 'archived', 'all'

    const whereClause: any = {};
    if (status === 'archived') {
      whereClause.isDeleted = true;
    } else if (status === 'active') {
      whereClause.isDeleted = false;
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { gstin: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const customers = await db.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { invoices: true, payments: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { name, phone, email, address, gstin, state, stateCode, openingBalance, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Customer name and phone number are required.' },
        { status: 400 }
      );
    }

    const openBal = parseFloat(openingBalance) || 0;

    const newCustomer = await db.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        gstin: gstin || null,
        state: state || 'Gujarat',
        stateCode: stateCode || '24',
        openingBalance: openBal,
        currentBalance: openBal,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: newCustomer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
