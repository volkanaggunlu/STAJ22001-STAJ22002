// PayTR IP Whitelist Middleware
const PAYTR_IPS = [
  '94.103.34.18',
  '185.60.225.10',
  '185.60.225.11',
  '185.60.225.12'
];

module.exports = function paytrIpWhitelist(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  if (PAYTR_IPS.includes(ip)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Bu endpoint sadece PayTR sunucularından erişilebilir.'
    }
  });
}; 