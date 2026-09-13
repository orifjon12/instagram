// ============================================================
//  Oddiy sayt: Akkaunt yaratish + Kirish + Admin panel
//  Faqat Node.js kerak (hech qanday kutubxona shart emas)
//  Ishga tushirish:  node server.js
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- SOZLAMALAR ----------
const PORT = 3000;

// >>> ADMIN LOGIN VA PAROL — BUNI FAQAT SIZ BILASIZ <<<
// Xohlaganingizcha o'zgartiring:
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
// --------------------------------

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- Ma'lumotlarni saqlash ----------
function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
}
function loadUsers() {
  ensureData();
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
}
function saveUsers(users) {
  ensureData();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ---------- Sessiyalar (xotirada) ----------
const sessions = new Map(); // sid -> { username, isAdmin }

function makeSid() { return crypto.randomBytes(16).toString('hex'); }

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function getSession(req) {
  const sid = parseCookies(req).sid;
  return sid ? sessions.get(sid) : null;
}

// ---------- Yordamchi javoblar ----------
function sendJSON(res, code, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};
function serveStatic(res, file) {
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full)) {
    res.writeHead(404); res.end('Topilmadi'); return;
  }
  const ext = path.extname(full);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}

// ============================================================
//  SERVER
// ============================================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  // ---------- API ----------
  if (p.startsWith('/api/')) {

    // Ro'yxatdan o'tish (akkaunt yaratish)
    if (p === '/api/register' && req.method === 'POST') {
      const { username, password } = await readBody(req);
      if (!username || !password)
        return sendJSON(res, 400, { ok: false, error: 'Login va parolni kiriting' });
      const users = loadUsers();
      users.push({
        username: String(username),
        password: String(password),
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
      return sendJSON(res, 200, { ok: true });
    }

    // Kirish
    if (p === '/api/login' && req.method === 'POST') {
      const { username, password } = await readBody(req);
      const users = loadUsers();
      const user = users.find(u =>
        u.username.toLowerCase() === String(username).toLowerCase() &&
        u.password === String(password));
      if (!user)
        return sendJSON(res, 401, { ok: false, error: 'Login yoki parol xato' });
      const sid = makeSid();
      sessions.set(sid, { username: user.username, isAdmin: false });
      return sendJSON(res, 200, { ok: true }, {
        'Set-Cookie': `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`
      });
    }

    // Admin kirishi
    if (p === '/api/admin-login' && req.method === 'POST') {
      const { username, password } = await readBody(req);
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const sid = makeSid();
        sessions.set(sid, { username: ADMIN_USER, isAdmin: true });
        return sendJSON(res, 200, { ok: true }, {
          'Set-Cookie': `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`
        });
      }
      return sendJSON(res, 401, { ok: false, error: 'Admin login yoki parol xato' });
    }

    // Chiqish
    if (p === '/api/logout' && req.method === 'POST') {
      const sid = parseCookies(req).sid;
      if (sid) sessions.delete(sid);
      return sendJSON(res, 200, { ok: true }, {
        'Set-Cookie': 'sid=; HttpOnly; Path=/; Max-Age=0'
      });
    }

    // Men kimman?
    if (p === '/api/me' && req.method === 'GET') {
      const s = getSession(req);
      if (!s) return sendJSON(res, 401, { ok: false });
      return sendJSON(res, 200, { ok: true, username: s.username, isAdmin: s.isAdmin });
    }

    // Admin: barcha foydalanuvchilar (login + parol)
    if (p === '/api/admin/users' && req.method === 'GET') {
      const s = getSession(req);
      if (!s || !s.isAdmin)
        return sendJSON(res, 403, { ok: false, error: 'Ruxsat yo\'q' });
      return sendJSON(res, 200, { ok: true, users: loadUsers() });
    }

    // Admin: foydalanuvchini o'chirish
    if (p === '/api/admin/delete' && req.method === 'POST') {
      const s = getSession(req);
      if (!s || !s.isAdmin)
        return sendJSON(res, 403, { ok: false, error: 'Ruxsat yo\'q' });
      const { username } = await readBody(req);
      let users = loadUsers();
      users = users.filter(u => u.username !== username);
      saveUsers(users);
      return sendJSON(res, 200, { ok: true });
    }

    return sendJSON(res, 404, { ok: false, error: 'Not found' });
  }

  // ---------- Sahifalar ----------
  if (p === '/' || p === '/index.html') return serveStatic(res, 'register.html');
  if (p === '/register') return serveStatic(res, 'register.html');
  if (p === '/admin') return serveStatic(res, 'admin.html');

  // Boshqa statik fayllar (css)
  serveStatic(res, p.replace(/^\//, ''));
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log('  Sayt ishga tushdi!');
  console.log('  Foydalanuvchi sahifasi:  http://localhost:' + PORT);
  console.log('  Admin panel:             http://localhost:' + PORT + '/admin');
  console.log('--------------------------------------------------');
  console.log('  Admin login: ' + ADMIN_USER);
  console.log('  Admin parol: ' + ADMIN_PASS);
  console.log('==================================================');
});
