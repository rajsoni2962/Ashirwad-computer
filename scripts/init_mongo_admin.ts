import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth-token';

async function initAdmin() {
  console.log('--- Initializing Admin User & Settings on MongoDB Atlas ---');

  // 1. Business Settings
  const settings = await db.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'ASHIRWAD TECHNOLOGIES',
      tagline: 'Beyond Tech Limits',
      address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
      phone: '9662278994',
      email: 'rajsoni2962@gmail.com',
      state: 'Gujarat',
      stateCode: '24',
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '5947557983',
      ifscCode: 'KKBK0000879',
      upiId: 'rajsoni2962-2@okaxis',
      invoicePrefix: 'AT/2026/',
      nextInvoiceNumber: 1,
      purchasePrefix: 'PO/2026/',
      nextPurchaseNumber: 1,
    },
  });
  console.log('✓ BusinessSettings initialized:', settings.companyName);

  // 2. Admin User
  const defaultPassword = hashPassword('Raj@2026');
  const user = await db.user.upsert({
    where: { username: 'admin' },
    update: { password: defaultPassword },
    create: {
      username: 'admin',
      name: 'Raj Soni',
      email: 'rajsoni2962@gmail.com',
      phone: '9662278994',
      password: defaultPassword,
      role: 'admin',
    },
  });
  console.log('✓ Admin user initialized:', user.username, `(${user.email})`);
}

initAdmin()
  .catch((err) => {
    console.error('Init failed:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
