import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'wowuser';
const DB_PASS = process.env.DB_PASS || '';
const DB_CHAR = process.env.DB_CHAR || 'characters';
const DB_AUTH = process.env.DB_AUTH || 'acore_auth';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(ROOT_DIR, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const accessLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login, tente novamente mais tarde.',
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Muitas tentativas de registro, tente novamente mais tarde.',
});

app.use('/api', apiLimiter);

function logger(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
    env: NODE_ENV
  };

  const logFile = path.join(LOG_DIR, `${level}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

  if (NODE_ENV === 'development' || level === 'error') {
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
  }
}

process.on('uncaughtException', (error) => {
  logger('error', 'Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger('error', 'Unhandled Rejection', { reason, promise });
});

let pool;
let poolAuth;

async function initDb() {
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_CHAR,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    poolAuth = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_AUTH,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    await pool.query('SELECT 1');
    await poolAuth.query('SELECT 1');
    logger('info', 'Database connections established successfully');
  } catch (error) {
    logger('error', 'Failed to initialize database', { error: error.message });
    throw error;
  }
}

// ---- Simple Site Auth & Forum Storage (file-based) ----
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT_DIR, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FORUM_FILE = path.join(DATA_DIR, 'forum.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const CHAR_IMAGES_DIR = path.join(UPLOADS_DIR, 'characters');
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@aethelgard.pt')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  if (!fs.existsSync(FORUM_FILE)) fs.writeFileSync(FORUM_FILE, JSON.stringify({ threads: [] }, null, 2));
  if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, JSON.stringify({ events: [] }, null, 2));
}

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}
function readForum() {
  return JSON.parse(fs.readFileSync(FORUM_FILE, 'utf8'));
}
function writeForum(data) {
  fs.writeFileSync(FORUM_FILE, JSON.stringify(data, null, 2));
}

function readEvents() {
  return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
}
function writeEvents(data) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));
}

function isAdminEmail(email) {
  if (!email) return false;
  try {
    return ADMIN_EMAILS.includes(String(email).toLowerCase());
  } catch {
    return false;
  }
}

// Ensure forum policy thread exists
function ensurePolicyThread() {
  try {
    const forum = readForum();
    const exists = forum.threads?.some(
      (t) => t.id === 'policy' || (t.title && t.title.toLowerCase().includes('política de bom comportamento'))
    );
    if (!exists) {
      const now = new Date().toISOString();
      const policyThread = {
        id: 'policy',
        title: 'Política de Bom Comportamento',
        content: [
          'Mantenha a comunidade acolhedora e respeitosa. Ao participar do fórum e do chat, siga estas diretrizes:',
          '',
          '• Respeite todos os membros; nada de ofensas, assédio ou discriminação.',
          '• Evite spam, flood e conteúdo fora de tópico.',
          '• Não compartilhe conteúdo ilegal, sexualmente explícito ou de ódio.',
          '• Use linguagem apropriada e mantenha discussões construtivas.',
          '• Marque spoilers e evite revelar conteúdo sem aviso.',
          '• Denuncie comportamentos inadequados aos moderadores.',
          '',
          'Importante: O descumprimento desta política poderá resultar em sanções, incluindo banimento do servidor.'
        ].join('\n'),
        authorId: 'admin',
        authorName: 'Admin',
        createdAt: now,
        replies: [],
      };
      forum.threads = [policyThread, ...(forum.threads || [])];
      writeForum(forum);
      console.log('Forum policy thread ensured.');
    }
  } catch (e) {
    console.warn('Failed to ensure policy thread:', e?.message || e);
  }
}

function ensureUploads() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(CHAR_IMAGES_DIR)) fs.mkdirSync(CHAR_IMAGES_DIR, { recursive: true });
}

ensureDataFiles();
ensurePolicyThread();
ensureUploads();
app.use('/api/uploads', express.static(UPLOADS_DIR));

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- Auth Endpoints ----
app.post('/api/auth/signup', registerLimiter, (req, res) => {
  const { email, password, nickname, firstName, lastName, avatarUrl, name } = req.body || {};
  if (!email || !password || !nickname || !firstName || !lastName) return res.status(400).json({ error: 'Missing fields' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = readUsers();
  const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const id = 'u' + Math.random().toString(36).slice(2, 10);
  const passwordHash = bcrypt.hashSync(password, 10);
  const safeName = String(name || nickname || email);
  const user = {
    id,
    email: String(email),
    name: String(name || nickname),
    nickname: String(nickname),
    firstName: String(firstName),
    lastName: String(lastName),
    passwordHash,
    avatarUrl: String(avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(safeName)}&size=64`),
    isAdmin: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };
  db.users.push(user);
  writeUsers(db);
  const isAdmin = isAdminEmail(user.email) || !!user.isAdmin;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, nickname: user.nickname, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  logger('info', 'User registered', { userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, nickname: user.nickname, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, isAdmin } });
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = readUsers();
  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    logger('warn', 'Failed login attempt', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  user.lastLoginAt = new Date().toISOString();
  writeUsers(db);
  const isAdmin = isAdminEmail(user.email) || !!user.isAdmin;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, nickname: user.nickname, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  logger('info', 'User logged in', { userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, nickname: user.nickname, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, isAdmin } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readUsers();
  const profile = db.users.find(u => u.id === req.user.id);
  const avatarUrl = profile?.avatarUrl || req.user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile?.nickname || req.user.name || req.user.email || 'Player')}&size=64`;
  const isAdmin = isAdminEmail(profile?.email || req.user.email) || !!profile?.isAdmin || !!req.user.isAdmin;
  res.json({ id: req.user.id, email: req.user.email, name: profile?.name || req.user.name, nickname: profile?.nickname, firstName: profile?.firstName, lastName: profile?.lastName, avatarUrl, isAdmin });
});

// Login usando conta do jogo (AzerothCore)
app.post('/api/auth/login-game', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    // sha_pass_hash = SHA1(UPPER(username) + ':' + UPPER(password))
    const upUser = String(username).toUpperCase();
    const upPass = String(password).toUpperCase();
    const toHash = `${upUser}:${upPass}`;
    const sha = crypto.createHash('sha1').update(toHash).digest('hex');
    const [rows] = await poolAuth.query('SELECT id, username FROM account WHERE username = ? AND sha_pass_hash = ?', [username, sha]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const acc = rows[0];
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.username)}`;
    const token = jwt.sign({ id: String(acc.id), name: acc.username, avatarUrl: defaultAvatar }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: String(acc.id), name: acc.username, avatarUrl: defaultAvatar, isAdmin: false } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Atualiza avatar do perfil do site (associado ao id da conta do jogo)
app.post('/api/profile/avatar', authMiddleware, (req, res) => {
  const { avatarUrl } = req.body || {};
  if (!avatarUrl) return res.status(400).json({ error: 'Missing avatarUrl' });
  const db = readUsers();
  const existing = db.users.find(u => u.id === req.user.id);
  if (existing) {
    existing.avatarUrl = avatarUrl;
  } else {
    db.users.push({ id: req.user.id, email: req.user.email, name: req.user.name, avatarUrl });
  }
  writeUsers(db);
  const user = db.users.find(u => u.id === req.user.id) || { id: req.user.id, email: req.user.email, name: req.user.name, avatarUrl };
  res.json({ ok: true, avatarUrl, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
});

// Atualiza e-mail da conta do site
app.post('/api/profile/email', authMiddleware, (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const db = readUsers();
  const existing = db.users.find(u => u.id === req.user.id);
  if (existing) {
    existing.email = String(email);
  } else {
    db.users.push({ id: req.user.id, email: String(email), name: req.user.name, avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.name || email)}` });
  }
  writeUsers(db);
  const user = db.users.find(u => u.id === req.user.id);
  const isAdmin = isAdminEmail(user.email) || !!user.isAdmin;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, isAdmin } });
});

// Atualiza nome no jogo (conta AzerothCore)
app.post('/api/profile/gamename', authMiddleware, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const accountId = Number(req.user.id);
  if (!Number.isFinite(accountId)) return res.status(400).json({ error: 'Invalid account id for game name change' });
  try {
    await poolAuth.query('UPDATE account SET username = ? WHERE id = ?', [String(name), accountId]);
    const db = readUsers();
    const existing = db.users.find(u => u.id === req.user.id);
    if (existing) {
      existing.name = String(name);
      existing.avatarUrl = existing.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(name))}`;
    } else {
      db.users.push({ id: req.user.id, email: req.user.email, name: String(name), avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(name))}` });
    }
    writeUsers(db);
    const user = db.users.find(u => u.id === req.user.id) || { id: String(accountId), email: req.user.email, name: String(name), avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(name))}` };
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload de imagem de personagem
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAR_IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = String(req.params.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}${ext || '.jpg'}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true); else cb(new Error('Invalid file type'));
  }
});

app.post('/api/characters/:name/image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const name = String(req.params.name || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!req.file) return res.status(400).json({ error: 'Missing image file' });
    const ext = path.extname(req.file.filename).toLowerCase();
    const imageUrl = `/api/uploads/characters/${name}${ext}`;
    res.status(201).json({ ok: true, imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Forum Endpoints ----
app.get('/api/forum/threads', (_req, res) => {
  const forum = readForum();
  const threads = forum.threads.map(t => ({ id: t.id, title: t.title, authorName: t.authorName, createdAt: t.createdAt, replies: t.replies.length }));
  res.json(threads);
});

app.post('/api/forum/threads', authMiddleware, (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
  const id = 't' + Math.random().toString(36).slice(2, 10);
  const thread = { id, title, content, authorId: req.user.id, authorName: req.user.name, createdAt: new Date().toISOString(), replies: [] };
  const forum = readForum();
  forum.threads.unshift(thread);
  writeForum(forum);
  res.status(201).json(thread);
});

app.get('/api/forum/threads/:id', (req, res) => {
  const forum = readForum();
  const thread = forum.threads.find(t => t.id === req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  res.json(thread);
});

app.post('/api/forum/threads/:id/replies', authMiddleware, (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const forum = readForum();
  const thread = forum.threads.find(t => t.id === req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  const reply = { id: 'r' + Math.random().toString(36).slice(2, 10), content, authorId: req.user.id, authorName: req.user.name, createdAt: new Date().toISOString() };
  thread.replies.push(reply);
  writeForum(forum);
  res.status(201).json(reply);
});

app.get('/api/ranking/top', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  try {
    const [rows] = await pool.query(
      'SELECT c.name, c.class, c.level, c.totaltime, g.name AS guildName FROM characters AS c LEFT JOIN guild_member AS gm ON gm.guid = c.guid LEFT JOIN guild AS g ON g.guildid = gm.guildid ORDER BY c.level DESC, c.totaltime DESC LIMIT ?',
      [limit]
    );
    const enriched = rows.map((r) => {
      const safeName = String(r.name || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const candidates = ['.jpg', '.jpeg', '.png', '.webp'];
      let imageUrl = null;
      for (const ext of candidates) {
        const p = path.join(CHAR_IMAGES_DIR, `${safeName}${ext}`);
        if (fs.existsSync(p)) {
          imageUrl = `/api/uploads/characters/${safeName}${ext}`;
          break;
        }
      }
      return imageUrl ? { ...r, imageUrl } : r;
    });
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/players/online', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT name, class, level FROM characters WHERE online = 1 ORDER BY level DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/users', authMiddleware, (req, res) => {
  const db = readUsers();
  const email = req.user?.email;
  const allowed = isAdminEmail(email) || !!req.user?.isAdmin;
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  res.json(db.users);
});

app.put('/api/admin/users/:id/admin', authMiddleware, (req, res) => {
  const db = readUsers();
  const email = req.user?.email;
  const allowed = isAdminEmail(email) || !!req.user?.isAdmin;
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  const targetId = String(req.params.id);
  const body = req.body || {};
  const flag = !!body.isAdmin;
  const idx = (db.users || []).findIndex(u => u.id === targetId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  db.users[idx].isAdmin = flag;
  writeUsers(db);
  const user = db.users[idx];
  res.json({ id: user.id, email: user.email, name: user.name, nickname: user.nickname, isAdmin: user.isAdmin });
});

app.get('/api/users/recent', (_req, res) => {
  const db = readUsers();
  const list = (db.users || [])
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 20)
    .map(u => ({ id: u.id, name: u.name, nickname: u.nickname, avatarUrl: u.avatarUrl }));
  res.json(list);
});

// ---- Events Endpoints ----
app.get('/api/events', (_req, res) => {
  const data = readEvents();
  res.json(Array.isArray(data.events) ? data.events : []);
});

app.post('/api/events', authMiddleware, (req, res) => {
  const { title, date, location, description } = req.body || {};
  const email = req.user?.email;
  if (!isAdminEmail(email) && !req.user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  if (!title || !date) return res.status(400).json({ error: 'Missing fields' });
  const db = readEvents();
  const ev = {
    id: 'ev' + Math.random().toString(36).slice(2, 10),
    title: String(title),
    date: String(date),
    location: String(location || ''),
    description: String(description || ''),
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  db.events = [ev, ...(db.events || [])];
  writeEvents(db);
  res.status(201).json(ev);
});

app.put('/api/events/:id', authMiddleware, (req, res) => {
  const email = req.user?.email;
  if (!isAdminEmail(email) && !req.user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const { title, date, location, description } = req.body || {};
  const db = readEvents();
  const idx = (db.events || []).findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });
  const updated = { ...db.events[idx], title: title ?? db.events[idx].title, date: date ?? db.events[idx].date, location: location ?? db.events[idx].location, description: description ?? db.events[idx].description, updatedAt: new Date().toISOString(), updatedBy: req.user.id };
  db.events[idx] = updated;
  writeEvents(db);
  res.json(updated);
});

app.delete('/api/events/:id', authMiddleware, (req, res) => {
  const email = req.user?.email;
  if (!isAdminEmail(email) && !req.user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const db = readEvents();
  const before = (db.events || []).length;
  db.events = (db.events || []).filter(e => e.id !== req.params.id);
  if (db.events.length === before) return res.status(404).json({ error: 'Event not found' });
  writeEvents(db);
  res.json({ ok: true });
});

// Opcional: SOAP admin endpoints podem ser adicionados aqui com autenticação JWT.

app.use((err, req, res, next) => {
  logger('error', 'Express error handler', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  logger('warn', '404 Not Found', { url: req.url, method: req.method, ip: req.ip });
  res.status(404).json({ error: 'Not found' });
});

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger('info', `WoW API listening on port ${PORT}`);
      console.log(`WoW API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger('error', 'Failed to init DB', { error: err.message, stack: err.stack });
    console.error('Failed to init DB', err);
    process.exit(1);
  });
