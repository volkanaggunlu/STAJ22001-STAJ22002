const Order = require('../models/Order');

async function ensureOrderOwnerOrAdmin(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).select('userId');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.isAdmin === true);
    const isOwner = req.user && String(order.userId) === String(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Yetkisiz' });
    }

    req.order = order;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { ensureOrderOwnerOrAdmin }; 