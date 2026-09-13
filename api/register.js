const { redis } = require('../lib/store');
const { readBody } = require('../lib/util');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { username, password } = await readBody(req);
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'Login va parolni kiriting' });
    const entry = JSON.stringify({
      username: String(username),
      password: String(password),
      createdAt: new Date().toISOString(),
    });
    await redis(['RPUSH', 'users', entry]);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
