const { redis } = require('../../lib/store');
const { isAdmin } = require('../../lib/util');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "Ruxsat yo'q" });
  try {
    const list = await redis(['LRANGE', 'users', '0', '-1']);
    const users = (list || [])
      .map(s => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean);
    res.status(200).json({ ok: true, users });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
