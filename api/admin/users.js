const { redis } = require('../../lib/store');
const { isAdmin, send } = require('../../lib/util');

module.exports = async (req, res) => {
  try {
    if (!isAdmin(req)) return send(res, 403, { ok: false, error: "Ruxsat yo'q" });
    const list = await redis(['LRANGE', 'users', '0', '-1']);
    const users = (list || [])
      .map(s => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean);
    send(res, 200, { ok: true, users });
  } catch (e) {
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
};
