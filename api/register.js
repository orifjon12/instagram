const { redis } = require('../lib/store');
const { readBody, send } = require('../lib/util');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
    const { username, password } = await readBody(req);
    if (!username || !password)
      return send(res, 400, { ok: false, error: 'Login va parolni kiriting' });
    const entry = JSON.stringify({
      username: String(username),
      password: String(password),
      createdAt: new Date().toISOString(),
    });
    await redis(['RPUSH', 'users', entry]);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
};
