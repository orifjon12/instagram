const { readBody, send, ADMIN_USER, ADMIN_PASS, adminToken } = require('../lib/util');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false });
    const { username, password } = await readBody(req);
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return send(res, 200, { ok: true }, {
        'Set-Cookie': `admintoken=${adminToken()}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=86400`,
      });
    }
    send(res, 401, { ok: false, error: 'Admin login yoki parol xato' });
  } catch (e) {
    send(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
};
