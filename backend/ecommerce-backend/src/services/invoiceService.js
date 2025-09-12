const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const logger = require('../logger/logger');
const { emailService } = require('./emailService');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  constructor() {}

  async createInitial(orderId, context = {}) {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new Error('Order not found');

    const existing = await Invoice.findOne({ orderId }).sort({ createdAt: -1 });
    if (existing) return existing;

    // Prefill buyer from order.billingAddress
    const ba = order.billingAddress || {};
    const buyer = {
      firstName: ba.firstName,
      lastName: ba.lastName,
      companyName: ba.companyName,
      tckn: ba.tckn,
      taxNumber: ba.taxNumber,
      taxOffice: ba.taxOffice,
      email: ba.email,
      phone: ba.phone,
      address: ba.address,
      city: ba.city,
      district: ba.district,
      postalCode: ba.postalCode
    };

    // Items snapshot
    const items = (order.items || []).map(it => ({
      productId: it.productId,
      name: it.name,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.price,
      discount: 0,
      taxRate: undefined,
      taxAmount: undefined,
      totalExclTax: Number((it.price * it.quantity).toFixed(2)),
      totalInclTax: Number((it.price * it.quantity).toFixed(2))
    }));

    // Totals snapshot
    const totals = {
      subtotal: order.subtotal || 0,
      discountsTotal: order.discountAmount || 0,
      shippingCost: order.shippingCost || 0,
      taxTotal: order.taxAmount || 0,
      grandTotal: order.totalAmount || 0
    };

    // Shipping snapshot
    const sa = order.shippingAddress || {};
    const shipping = {
      address: sa.address,
      city: sa.city,
      district: sa.district,
      postalCode: sa.postalCode,
      carrier: order.tracking?.carrier,
      trackingNumber: order.tracking?.trackingNumber,
      deliveredAt: order.status === 'delivered' ? new Date() : undefined
    };

    // Meta/header snapshot
    const meta = {
      invoiceNumber: undefined,
      invoiceDate: undefined,
      currency: order.currency || 'TRY',
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      paymentMethod: order.payment?.method,
      paymentDate: order.payment?.paymentDate,
      notes: order.notes
    };

    const invoice = await Invoice.create({
      orderId,
      userId: order.userId,
      isManual: true,
      status: 'pending',
      createdBy: context.userId,
      seller: {},
      buyer,
      items,
      totals,
      shipping,
      meta
    });
    logger.info(`Manual invoice draft created. order=${orderId}`);
    return invoice;
  }

  async getByOrder(orderId) {
    const invoice = await Invoice.findOne({ orderId }).sort({ createdAt: -1 });
    if (!invoice) throw new Error('Invoice not found for order');
    return invoice;
  }

  async upsertManual(orderId, payload = {}, context = {}) {
    const existing = await Invoice.findOne({ orderId }).sort({ createdAt: -1 });
    const doc = existing || new Invoice({ orderId, isManual: true, createdBy: context.userId });

    // Backward compatibility: map top-level fields to meta
    if (payload.invoiceNumber !== undefined) {
      doc.meta = doc.meta || {};
      doc.meta.invoiceNumber = payload.invoiceNumber;
    }
    if (payload.invoiceDate !== undefined) {
      doc.meta = doc.meta || {};
      doc.meta.invoiceDate = payload.invoiceDate ? new Date(payload.invoiceDate) : undefined;
    }

    // Nested updates
    if (payload.meta) {
      doc.meta = { ...(doc.meta || {}), ...payload.meta };
      if (payload.meta.invoiceDate) {
        doc.meta.invoiceDate = new Date(payload.meta.invoiceDate);
      }
    }
    if (payload.seller) {
      doc.seller = { ...(doc.seller || {}), ...payload.seller };
    }
    if (payload.buyer) {
      doc.buyer = { ...(doc.buyer || {}), ...payload.buyer };
    }
    if (payload.totals) {
      doc.totals = { ...(doc.totals || {}), ...payload.totals };
    }
    if (payload.shipping) {
      doc.shipping = { ...(doc.shipping || {}), ...payload.shipping };
    }
    if (Array.isArray(payload.items)) {
      doc.items = payload.items;
    }

    if (payload.pdfPath !== undefined) {
      doc.pdfPath = payload.pdfPath;
    }
    if (payload.manualNotes !== undefined) doc.manualNotes = payload.manualNotes;

    const status = payload.status;
    if (status && ['pending', 'approved', 'rejected', 'sent', 'processing', 'error'].includes(status)) doc.status = status;

    doc.isManual = true;

    await doc.save();
    logger.info(`Manual invoice upserted. order=${orderId}`);
    return doc;
  }

  async sendEmail(orderId, options = {}) {
    const invoice = await Invoice.findOne({ orderId }).sort({ createdAt: -1 }).lean();
    if (!invoice) throw new Error('Invoice not found for order');

    const order = await Order.findById(orderId).populate('userId');
    if (!order || !order.userId) throw new Error('Order or user not found');

    const to = order.userId.email;
    const subject = `Faturanız - #${order.orderNumber || order._id}`;
    const text = `Merhaba,\n\n#${order.orderNumber || order._id} numaralı siparişiniz için fatura bilgileri aşağıdadır.\nFatura No: ${(invoice.meta && invoice.meta.invoiceNumber) || '-'}\nFatura Tarihi: ${(invoice.meta && invoice.meta.invoiceDate) ? new Date(invoice.meta.invoiceDate).toLocaleDateString('tr-TR') : '-'}\n\nTeşekkürler.`;

    const attachments = [];
    const pdfPath = options.pdfPath || invoice.pdfPath;
    if (pdfPath) {
      try {
        const buffer = fs.readFileSync(pdfPath);
        attachments.push({ filename: `invoice-${order._id}.pdf`, content: buffer });
      } catch (e) {
        logger.warn(`Invoice pdfPath cannot be read: ${pdfPath} - ${e.message}`);
      }
    }

    await emailService.sendEmail({ to, subject, text, attachments });

    await Invoice.updateOne({ _id: invoice._id }, { status: 'sent', sentAt: new Date(), sentToUserAt: new Date() });
    return await Invoice.findById(invoice._id);
  }

  async adminList({ status, from, to, page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;
    if (from || to) query.createdAt = { };
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);

    const cursor = Invoice.find(query).sort({ createdAt: -1 });
    const total = await Invoice.countDocuments(query);
    const items = await cursor.skip((page - 1) * limit).limit(limit).lean();
    return { items, page, limit, total };
  }
}

module.exports = new InvoiceService(); 