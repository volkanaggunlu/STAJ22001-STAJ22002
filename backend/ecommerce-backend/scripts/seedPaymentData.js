const mongoose = require('mongoose');
const PaymentMethod = require('../src/models/PaymentMethod');
const BankAccount = require('../src/models/BankAccount');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function seed() {
  await mongoose.connect(MONGO_URI);

  await PaymentMethod.deleteMany({});
  await BankAccount.deleteMany({});

  await PaymentMethod.insertMany([
    {
      value: 'credit-card',
      label: 'Kredi Kartı',
      description: 'Visa, MasterCard, Amex ile güvenli ödeme',
      fields: [
        { name: 'cardName', label: 'Kart Üzerindeki İsim', type: 'text', required: true },
        { name: 'cardNumber', label: 'Kart Numarası', type: 'card', required: true },
        { name: 'expiryDate', label: 'Son Kullanma Tarihi', type: 'expiry', required: true },
        { name: 'cvv', label: 'CVV', type: 'cvv', required: true }
      ],
      installmentOptions: [
        { count: 1, label: 'Tek Çekim' },
        { count: 3, label: '3 Taksit' },
        { count: 6, label: '6 Taksit' }
      ],
      isActive: true,
      order: 1
    },
    {
      value: 'bank-transfer',
      label: 'Havale/EFT',
      description: 'Banka havalesi ile ödeme',
      bankInfo: {
        bankName: 'Türkiye İş Bankası',
        accountName: 'ElektroTech Ltd. Şti.',
        iban: 'TR12 0006 4000 0011 2345 6789 01'
      },
      isActive: true,
      order: 2
    }
  ]);

  await BankAccount.insertMany([
    {
      bankName: 'Türkiye İş Bankası',
      accountName: 'ElektroTech Ltd. Şti.',
      accountNumber: '1234567890',
      iban: 'TR12 0006 4000 0011 2345 6789 01',
      swift: 'ISBKTRIS',
      isActive: true,
      order: 1
    },
    {
      bankName: 'Garanti BBVA',
      accountName: 'ElektroTech Ltd. Şti.',
      accountNumber: '9876543210',
      iban: 'TR98 0062 0987 6543 2109 8765 43',
      swift: 'TGBATRIS',
      isActive: true,
      order: 2
    }
  ]);

  console.log('Seed işlemi tamamlandı.');
  await mongoose.disconnect();
}

seed(); 