const jwt = require('jsonwebtoken');

function signInvoiceLink({ orderId, type, ttlSeconds = 300 }) {
  const payload = { orderId, type };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ttlSeconds });
  return token;
}

function verifyInvoiceLink(token, expected) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (expected && expected.type && payload.type !== expected.type) {
    throw new Error('Invalid token type');
  }
  return payload;
}

module.exports = { signInvoiceLink, verifyInvoiceLink }; 