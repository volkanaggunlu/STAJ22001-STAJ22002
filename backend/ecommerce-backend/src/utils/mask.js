function maskVkn(v) { if (!v) return v; return String(v).replace(/.(?=.{4})/g, '*'); }
function maskTckn(v) { if (!v) return v; return String(v).replace(/.(?=.{4})/g, '*'); }
function maskEmail(e){ if(!e) return e; const [u,d]=String(e).split('@'); return (u.slice(0,2)+'***')+'@'+d; }

module.exports = { maskVkn, maskTckn, maskEmail }; 