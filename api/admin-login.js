const { readBody, ADMIN_USER, ADMIN_PASS, adminToken } = require('../lib/util');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { username, password } = await readBody(req);
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.setHeader('Set-Cookie',
      `admintoken=${adminToken()}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=86400`);
    return res.status(200).json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'Admin login yoki parol xato' });
};
