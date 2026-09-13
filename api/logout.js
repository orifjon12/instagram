const { send } = require('../lib/util');

module.exports = (req, res) => {
  send(res, 200, { ok: true }, { 'Set-Cookie': 'admintoken=; HttpOnly; Path=/; Max-Age=0' });
};
