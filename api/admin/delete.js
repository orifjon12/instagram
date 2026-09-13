const { redis } = require('../../lib/store');
const { isAdmin, readBody, send } = require('../../lib/util');

module.exports = async (req, res) => {
  try {
    if (!isAdmin(req)) return send(res, 403, { ok: false, error: "Ruxsat yo'q" });
    const { username, password, createdAt } = await readBody(req);
    const entry = JSON.stringify({ username, password, createdAt });
    await redis(['LREM', 'users', '1', entry]);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
};
