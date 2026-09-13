const { redis } = require('../../lib/store');
const { isAdmin, readBody } = require('../../lib/util');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "Ruxsat yo'q" });
  try {
    const { username, password, createdAt } = await readBody(req);
    // Aynan o'sha yozuvni topib o'chiramiz (register.js yozgan tartibda)
    const entry = JSON.stringify({ username, password, createdAt });
    await redis(['LREM', 'users', '1', entry]);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
