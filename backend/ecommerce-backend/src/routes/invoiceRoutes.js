const express = require('express');
const { auth, admin } = require('../middleware/auth');
const { ensureOrderOwnerOrAdmin } = require('../middleware/orderAccess');
const { validate } = require('../middleware/validate');
const { manualInvoiceSchema, adminListSchema } = require('../validations/invoiceValidation');
const controller = require('../controllers/invoiceController');

const router = express.Router();

// Protected endpoints
router.get('/invoices/:orderId', auth, ensureOrderOwnerOrAdmin, controller.getInvoice);
router.post('/invoices/:orderId/manual', auth, admin, validate(manualInvoiceSchema), controller.upsertManual);
router.post('/invoices/:orderId/send-email', auth, admin, controller.sendEmail);
router.get('/invoices', auth, admin, validate(adminListSchema), controller.adminList);

module.exports = router; 