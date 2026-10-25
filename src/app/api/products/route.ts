import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { validateAndSanitizeProduct } from '@/lib/product-validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const productType = searchParams.get('productType') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const whereClause: any = {};
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { cpu: { contains: search, mode: 'insensitive' } },
        { ram: { contains: search, mode: 'insensitive' } },
        { storage: { contains: search, mode: 'insensitive' } },
        { hsn: { contains: search, mode: 'insensitive' } },
        {
          serialNumbers: {
            some: {
              serialNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (brand && brand !== 'All') {
      whereClause.brand = brand;
    }

    if (productType && productType !== 'All') {
      whereClause.productType = productType;
    }

    const products = await db.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        serialNumbers: {
          where: { status: 'In Stock' },
          select: { id: true, serialNumber: true, status: true },
        },
        _count: {
          select: {
            serialNumbers: true,
            invoiceItems: true,
            purchaseItems: true,
          },
        },
      },
    });

    // Services never trigger low-stock alerts
    const filtered = lowStockOnly
      ? products.filter((p) => p.productType !== 'SERVICE' && p.currentStock <= p.minStock)
      : products;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const {
      name,
      productType, // 'PHYSICAL' or 'SERVICE'
      brand,
      model,
      category,
      cpu,
      generation,
      ram,
      ramType,
      storage,
      storageType,
      gpu,
      displaySize,
      condition,
      hsn,
      gstPercent,
      purchasePrice,
      sellingPrice,
      minStock,
      initialStock,
      warranty,
      notes,
      serialNumbers, // optional array of serial strings
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Product/Service name is required' }, { status: 400 });
    }

    // Apply category-specific validation & sanitization (prevents computer specs on accessories)
    const { sanitized } = validateAndSanitizeProduct(body);

    const isService = sanitized.productType === 'SERVICE' || sanitized.category?.toLowerCase() === 'service';
    const finalProductType = isService ? 'SERVICE' : 'PHYSICAL';
    const initStock = isService ? 0 : parseInt(sanitized.initialStock) || 0;
    const pPrice = parseFloat(sanitized.purchasePrice) || 0;
    const sPrice = parseFloat(sanitized.sellingPrice) || 0;

    // Prevent duplicate active products with identical name and model/brand
    const duplicateQuery: any = {
      isDeleted: false,
      name: { equals: sanitized.name.trim(), mode: 'insensitive' },
    };
    if (sanitized.brand && typeof sanitized.brand === 'string' && sanitized.brand.trim()) {
      duplicateQuery.brand = { equals: sanitized.brand.trim(), mode: 'insensitive' };
    }
    if (sanitized.model && typeof sanitized.model === 'string' && sanitized.model.trim()) {
      duplicateQuery.model = { equals: sanitized.model.trim(), mode: 'insensitive' };
    }

    const existingDuplicate = await db.product.findFirst({
      where: duplicateQuery,
      include: {
        serialNumbers: {
          where: { status: 'In Stock' },
          select: { id: true, serialNumber: true, status: true },
        },
      },
    });

    if (existingDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `A product with name "${existingDuplicate.name}"${existingDuplicate.model ? ` (${existingDuplicate.model})` : ''} already exists in inventory (Current Stock: ${existingDuplicate.currentStock}).`,
          existingProduct: existingDuplicate,
        },
        { status: 409 }
      );
    }

    const newProduct = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: sanitized.name.trim(),
          productType: finalProductType,
          brand: isService ? null : (sanitized.brand || null),
          model: isService ? null : (sanitized.model || null),
          category: sanitized.category || (isService ? 'Service' : 'Laptop'),
          cpu: isService ? null : (sanitized.cpu || null),
          generation: isService ? null : (sanitized.generation || null),
          ram: isService ? null : (sanitized.ram || null),
          ramType: isService ? null : (sanitized.ramType || null),
          storage: isService ? null : (sanitized.storage || null),
          storageType: isService ? null : (sanitized.storageType || null),
          gpu: isService ? null : (sanitized.gpu || null),
          displaySize: isService ? null : (sanitized.displaySize || null),
          condition: isService ? 'Service' : (sanitized.condition || 'Brand New'),
          hsn: sanitized.hsn || (isService ? '9987' : '8471'),
          gstPercent: parseFloat(sanitized.gstPercent) !== undefined ? parseFloat(sanitized.gstPercent) : 18,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          minStock: isService ? 0 : (parseInt(sanitized.minStock) || 1),
          currentStock: initStock,
          warranty: sanitized.warranty || (isService ? '30 Days Service Warranty' : '1 Year'),
          notes: sanitized.notes || null,
        },
      });

      // Only track physical product initial stock movement and serial numbers
      if (!isService && initStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'PURCHASE',
            referenceType: 'INITIAL_STOCK',
            referenceNumber: 'MANUAL_INIT',
            quantityChange: initStock,
            balanceAfter: initStock,
            unitPrice: pPrice,
            notes: 'Opening stock on product creation',
          },
        });

        if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
          for (const sn of serialNumbers) {
            if (sn && typeof sn === 'string' && sn.trim()) {
              await tx.serialNumber.create({
                data: {
                  serialNumber: sn.trim(),
                  productId: product.id,
                  purchasePrice: pPrice,
                  sellingPrice: sPrice,
                  status: 'In Stock',
                },
              });
            }
          }
        }
      }

      return product;
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
