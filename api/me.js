const { isAdmin, send } = require('../lib/util');

module.exports = (req, res) => {
  try {
    if (isAdmin(req)) return send(res, 200, { ok: true, username: 'admin', isAdmin: true });
    send(res, 401, { ok: false });
  } catch (e) {
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
};
