const invoiceService = require('../services/invoiceService');
const logger = require('../logger/logger');

exports.getInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const data = await invoiceService.getByOrder(orderId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (String(error.message).includes('Invoice not found for order')) {
      return res.status(200).json({ success: true, data: null });
    }
    next(error);
  }
};

exports.upsertManual = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const data = await invoiceService.upsertManual(orderId, req.body, { userId: req.user?._id });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.sendEmail = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const data = await invoiceService.sendEmail(orderId, req.body || {});
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const { status, from, to, page, limit } = req.query;
    const data = await invoiceService.adminList({ status, from, to, page: Number(page) || 1, limit: Number(limit) || 20 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}; 