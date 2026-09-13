module.exports = (req, res) => {
  res.setHeader('Set-Cookie', 'admintoken=; HttpOnly; Path=/; Max-Age=0');
  res.status(200).json({ ok: true });
};
