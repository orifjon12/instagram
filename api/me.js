const { isAdmin } = require('../lib/util');

module.exports = (req, res) => {
  if (isAdmin(req)) return res.status(200).json({ ok: true, username: 'admin', isAdmin: true });
  res.status(401).json({ ok: false });
};
