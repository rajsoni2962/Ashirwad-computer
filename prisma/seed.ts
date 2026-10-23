import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { assertSafeForSeed } from '../src/lib/db-guard';

const prisma = new PrismaClient();

async function main() {
  // Fail-closed guard: Blocks demo seeding on production database
  assertSafeForSeed({ scriptName: 'prisma/seed.ts' });

  console.log('--- SEEDING ASHIRWAD TECH DATABASE ---');

  // 1. Business Profile
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {
      companyName: 'ASHIRWAD TECH',
      tagline: 'Repair | Upgrade | Build | Service',
      logoUrl: '/brand/logo.png',
      authorizedSignatory: 'Ashirwad Tech\nRaj Soni\nProprietor',
    },
    create: {
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

  // 2. Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Dell Technologies Certified Partner Hub',
      phone: '9825012345',
      email: 'partner.orders@dellhub.in',
      address: 'Plot 42, Electronics Zone, Gandhinagar, Gujarat 382028',
      gstin: '24AABCD1234F1Z6',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: 0,
      currentBalance: 32000,
      notes: 'Primary supplier for Grade-A refurbished Dell Latitudes',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Matrix Tech Imports & Wholesale',
      phone: '9892098765',
      email: 'sales@matrixtech.com',
      address: 'Lamington Road, Grant Road East, Mumbai 400007',
      gstin: '27AAECM4589K1Z2',
      state: 'Maharashtra',
      stateCode: '27',
      openingBalance: 0,
      currentBalance: 18500,
      notes: 'Supplier for HP EliteBooks, ThinkPads, and NVMe SSDs',
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Supertron Silicon Components',
      phone: '9712345678',
      email: 'support@supertron.in',
      address: 'Navrangpura Commercial Complex, Ahmedabad 380009',
      gstin: '24AABCS9876L1Z9',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: 0,
      currentBalance: 0,
      notes: 'SSDs, RAM, Chargers, Laptop Screens, Keyboards',
    },
  });

  // 3. Customers
  const customerRonak = await prisma.customer.create({
    data: {
      name: 'Ronak Jain',
      phone: '8005540033',
      email: 'ronak.jain@example.com',
      address: 'Satellite Road, Ahmedabad 380015',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: 0,
      currentBalance: 0,
      notes: 'Repeat buyer - Purchased Dell Latitude 5490 + SSD',
    },
  });

  const customerBhavin = await prisma.customer.create({
    data: {
      name: 'Bhavin R. Ranpura',
      phone: '9428011223',
      email: 'bhavin.ranpura@example.com',
      address: 'Gota, Ahmedabad 382481',
      gstin: '24AAAPL1234M1Z1',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: 0,
      currentBalance: 12500,
      notes: 'IT Consultant & Corporate Client',
    },
  });

  const customerSpectrum = await prisma.customer.create({
    data: {
      name: 'Spectrum Networks Pvt Ltd',
      phone: '9909988776',
      email: 'accounts@spectrumnetworks.in',
      address: 'SG Highway, Prahlad Nagar, Ahmedabad 380051',
      gstin: '24AAGCS9012N1Z8',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: 0,
      currentBalance: 28000,
      notes: 'Bought Lenovo ThinkPad T14s for development',
    },
  });

  // 4. Products & Inventory from parsed_laptops.json
  const parsedFile = path.join(process.cwd(), 'brand_assets/parsed_laptops.json');
  let laptopList = [];
  if (fs.existsSync(parsedFile)) {
    laptopList = JSON.parse(fs.readFileSync(parsedFile, 'utf-8'));
  }

  // Pre-defined core products
  const productsToCreate: any[] = [
    {
      name: 'Dell Latitude 5490 | i5 7th Gen | 8GB DDR4 | 119GB NVMe SSD',
      brand: 'Dell',
      model: 'Latitude 5490',
      category: 'Laptop',
      cpu: 'Intel Core i5-7300U',
      generation: '7th Gen',
      ram: '8GB',
      ramType: 'DDR4',
      storage: '119GB NVMe',
      storageType: 'NVMe SSD',
      displaySize: '14 Inch',
      condition: 'Refurbished Grade A',
      hsn: '8471',
      gstPercent: 18,
      purchasePrice: 19000,
      sellingPrice: 24000,
      minStock: 2,
      currentStock: 3,
      warranty: '6 Months',
      notes: 'Tested working perfectly. Backlight keyboard, FHD screen.',
    },
    {
      name: '512 GB 2.5" SATA SSD (Crucial / Kingston)',
      brand: 'Crucial',
      model: 'BX500 512GB',
      category: 'SSD',
      storage: '512GB',
      storageType: 'SATA SSD',
      condition: 'Brand New',
      hsn: '8471',
      gstPercent: 18,
      purchasePrice: 4200,
      sellingPrice: 5700,
      minStock: 5,
      currentStock: 12,
      warranty: '3 Years Manufacturer',
      notes: 'High speed 2.5 inch SATA SSD for laptop upgrades.',
    },
    {
      name: '256 GB NVMe M.2 High Speed SSD',
      brand: 'Kingston',
      model: 'NV2 PCIe 4.0',
      category: 'SSD',
      storage: '256GB',
      storageType: 'NVMe SSD',
      condition: 'Brand New',
      hsn: '8471',
      gstPercent: 18,
      purchasePrice: 2100,
      sellingPrice: 2900,
      minStock: 4,
      currentStock: 15,
      warranty: '3 Years Manufacturer',
      notes: 'M.2 NVMe SSD for fast boot & response time.',
    },
    {
      name: '8GB DDR4 3200MHz Laptop RAM',
      brand: 'Crucial',
      model: 'DDR4 SODIMM',
      category: 'RAM',
      ram: '8GB',
      ramType: 'DDR4 3200MHz',
      condition: 'Brand New',
      hsn: '8471',
      gstPercent: 18,
      purchasePrice: 1400,
      sellingPrice: 2200,
      minStock: 5,
      currentStock: 18,
      warranty: '3 Years Manufacturer',
      notes: 'Compatible with all 6th-12th Gen laptops.',
    },
  ];

  // Helper to extract details from laptop name
  for (const item of laptopList) {
    const rawName = item.name.trim();
    if (!rawName || rawName.length < 5) continue;

    let priceVal = 20000;
    const isSold = item.price.toUpperCase().includes('SOLD');
    if (!isSold) {
      const parsed = parseFloat(item.price.replace(/[^\d.]/g, ''));
      if (parsed > 1000) priceVal = parsed;
    }

    const brand = rawName.toUpperCase().includes('DELL')
      ? 'Dell'
      : rawName.toUpperCase().includes('HP')
      ? 'HP'
      : rawName.toUpperCase().includes('LENOVO')
      ? 'Lenovo'
      : rawName.toUpperCase().includes('APPLE')
      ? 'Apple'
      : 'Dell';

    // Avoid duplicate names
    if (!productsToCreate.some((p) => p.name.toLowerCase() === rawName.toLowerCase())) {
      productsToCreate.push({
        name: rawName,
        brand: brand,
        model: rawName.split(' ').slice(0, 3).join(' '),
        category: 'Laptop',
        condition: 'Refurbished Grade A',
        hsn: '8471',
        gstPercent: 18,
        purchasePrice: Math.round(priceVal * 0.78),
        sellingPrice: priceVal,
        minStock: 1,
        currentStock: isSold ? 0 : Math.floor(Math.random() * 3) + 1,
        warranty: '6 Months',
        notes: isSold ? 'Previously sold stock' : 'Tested and in stock',
      });
    }
  }

  const createdProducts = [];
  for (const prod of productsToCreate) {
    const created = await prisma.product.create({
      data: prod,
    });
    createdProducts.push(created);

    // Initial stock movement
    if (created.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: 'PURCHASE',
          referenceType: 'INITIAL_STOCK',
          referenceNumber: 'INIT-2026',
          quantityChange: created.currentStock,
          balanceAfter: created.currentStock,
          unitPrice: created.purchasePrice,
          notes: 'Opening stock count',
        },
      });

      // Add serial numbers for serialized laptop products
      if (created.category === 'Laptop') {
        for (let i = 1; i <= created.currentStock; i++) {
          const cleanModel = created.model ? created.model.replace(/\s+/g, '') : 'LAP';
          const sn = `${cleanModel.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
          await prisma.serialNumber.create({
            data: {
              serialNumber: sn,
              productId: created.id,
              supplierId: supplier1.id,
              purchasePrice: created.purchasePrice,
              purchaseDate: new Date('2026-07-01'),
              sellingPrice: created.sellingPrice,
              status: 'In Stock',
              notes: 'Clean condition, certified hardware.',
            },
          });
        }
      }
    }
  }

  // 5. Historic Reference Invoice for Ronak Jain (Invoice No.: AT/2026/109)
  const dell5490 = createdProducts[0];
  const sataSsd = createdProducts[1];

  // Specific serial number for Ronak's laptop
  const soldSerial = await prisma.serialNumber.create({
    data: {
      serialNumber: 'LAT5490-88492A',
      productId: dell5490.id,
      supplierId: supplier1.id,
      purchasePrice: 19000,
      purchaseDate: new Date('2026-07-01'),
      sellingPrice: 24000,
      customerId: customerRonak.id,
      saleDate: new Date('2026-07-08'),
      warrantyStart: new Date('2026-07-08'),
      warrantyEnd: new Date('2027-01-08'),
      status: 'Sold',
      notes: 'Sold to Ronak Jain with 6 months warranty.',
    },
  });

  const invoice109 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'AT/2026/109',
      date: new Date('2026-07-08'),
      dueDate: new Date('2026-07-08'),
      customerId: customerRonak.id,
      subtotal: 29700.0,
      discountPercent: 2.357,
      discountAmount: 700.0,
      taxableAmount: 24576.27,
      cgst: 2211.86,
      sgst: 2211.86,
      igst: 0.0,
      grandTotal: 29000.0,
      paidAmount: 29000.0,
      balanceDue: 0.0,
      paymentMode: 'Cash',
      paymentStatus: 'Paid',
      notes: 'Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service.',
      terms: `* Tested and working perfectly at the time of sale.
* Please inspect the laptop before purchase.
* 6 Months of warranty covers technical issues only and excludes physical or liquid damage.
* Battery backup may vary depending on usage.
* No return or refund after sale unless covered under warranty.
* Thank you for choosing us—we’re always here to help if you need support.`,
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: dell5490.id,
            serialNumber: soldSerial.serialNumber,
            description: 'Dell latitude 5490 | i5 7th gen | 8GB DDR4 RAM | 119GB NVMe SSD',
            hsn: '8471',
            quantity: 1,
            unit: 'Pcs',
            rate: 24000.0,
            discount: 500.0,
            gstPercent: 18.0,
            taxableAmount: 19915.25,
            gstAmount: 3584.75,
            total: 23500.0,
          },
          {
            productId: sataSsd.id,
            description: '512 GB 2.5" SATA SSD',
            hsn: '8471',
            quantity: 1,
            unit: 'Pcs',
            rate: 5700.0,
            discount: 200.0,
            gstPercent: 18.0,
            taxableAmount: 4661.02,
            gstAmount: 838.98,
            total: 5500.0,
          },
        ],
      },
    },
  });

  // Link invoice to serial number
  await prisma.serialNumber.update({
    where: { id: soldSerial.id },
    data: { salesInvoiceId: invoice109.id },
  });

  // Record payment for invoice 109
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-001',
      date: new Date('2026-07-08'),
      type: 'CUSTOMER_PAYMENT',
      customerId: customerRonak.id,
      invoiceId: invoice109.id,
      amount: 29000.0,
      paymentMode: 'Cash',
      referenceNumber: 'CASH-REC-109',
      notes: 'Full payment received at counter upon delivery',
    },
  });

  // Movement for invoice 109
  await prisma.stockMovement.create({
    data: {
      productId: dell5490.id,
      type: 'SALE',
      referenceType: 'INVOICE',
      referenceId: invoice109.id,
      referenceNumber: invoice109.invoiceNumber,
      quantityChange: -1,
      balanceAfter: dell5490.currentStock,
      unitPrice: 24000.0,
      notes: `Sale to Ronak Jain (SN: ${soldSerial.serialNumber})`,
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: sataSsd.id,
      type: 'SALE',
      referenceType: 'INVOICE',
      referenceId: invoice109.id,
      referenceNumber: invoice109.invoiceNumber,
      quantityChange: -1,
      balanceAfter: sataSsd.currentStock,
      unitPrice: 5700.0,
      notes: 'Sale to Ronak Jain (Invoice AT/2026/109)',
    },
  });

  // 6. Recent Supplier Purchase Bill
  const purchase1 = await prisma.purchase.create({
    data: {
      purchaseNumber: 'PO/2026/201',
      supplierInvoiceNumber: 'INV-DELL-8821',
      date: new Date('2026-09-20'),
      dueDate: new Date('2026-10-05'),
      supplierId: supplier1.id,
      subtotal: 65000.0,
      discountPercent: 0.0,
      discountAmount: 0.0,
      taxableAmount: 55084.75,
      cgst: 4957.63,
      sgst: 4957.63,
      igst: 0.0,
      grandTotal: 65000.0,
      paidAmount: 33000.0,
      balanceDue: 32000.0,
      paymentStatus: 'Partial',
      notes: 'Stock replenishment for Dell Latitude 5410 & 5420',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: createdProducts[2].id,
            description: '256 GB NVMe M.2 SSDs bulk pack',
            hsn: '8471',
            quantity: 10,
            unit: 'Pcs',
            rate: 2100.0,
            discount: 0.0,
            gstPercent: 18.0,
            taxableAmount: 17796.61,
            gstAmount: 3203.39,
            total: 21000.0,
          },
          {
            productId: createdProducts[3].id,
            description: '8GB DDR4 SODIMM RAM modules',
            hsn: '8471',
            quantity: 20,
            unit: 'Pcs',
            rate: 1400.0,
            discount: 0.0,
            gstPercent: 18.0,
            taxableAmount: 23728.81,
            gstAmount: 4271.19,
            total: 28000.0,
          },
        ],
      },
    },
  });

  // Supplier payment for partial bill
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-SUP-2026-050',
      date: new Date('2026-09-20'),
      type: 'SUPPLIER_PAYMENT',
      supplierId: supplier1.id,
      purchaseId: purchase1.id,
      amount: 33000.0,
      paymentMode: 'UPI',
      referenceNumber: 'UPI/IMPS/6291048821',
      notes: 'Advance payment via UPI for PO/2026/201',
    },
  });

  // 7. Business Expenses
  await prisma.expense.createMany({
    data: [
      {
        category: 'Rent',
        description: 'Shop rent for Ashraya 10 commercial unit',
        amount: 15000,
        date: new Date('2026-09-01'),
        paymentMethod: 'Bank Transfer',
        notes: 'Monthly premises rent',
      },
      {
        category: 'Electricity',
        description: 'UGVCL commercial electricity bill',
        amount: 3840,
        date: new Date('2026-09-10'),
        paymentMethod: 'UPI',
        notes: 'Air conditioner and testing benches power',
      },
      {
        category: 'Internet',
        description: 'Airtel Xstream Fiber 200Mbps',
        amount: 999,
        date: new Date('2026-09-05'),
        paymentMethod: 'UPI',
        notes: 'High speed optical fiber for diagnostic tools & software downloads',
      },
      {
        category: 'Repair',
        description: 'Soldering station tip replacements & thermal paste Arctic MX-4',
        amount: 2450,
        date: new Date('2026-09-15'),
        paymentMethod: 'Cash',
        notes: 'Workshop repair supplies',
      },
      {
        category: 'Transport',
        description: 'Courier delivery charges for laptop motherboard shipments',
        amount: 1250,
        date: new Date('2026-09-18'),
        paymentMethod: 'Cash',
        notes: 'DTDC courier express',
      },
    ],
  });

  // 8. Admin User
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Raj Soni',
      email: 'rajsoni2962@gmail.com',
      password: 'password123',
      role: 'admin',
    },
  });

  console.log('✅ Seed completed successfully with 40+ products, real invoices, stock movements, and serial numbers!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
