import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'wowuser';
const DB_PASS = process.env.DB_PASS || '';
const DB_CHAR = process.env.DB_CHAR || 'characters';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_CHAR,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/ranking/top', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  try {
    const [rows] = await pool.query(
      'SELECT name, class, level, totaltime FROM characters ORDER BY level DESC, totaltime DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
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

// Opcional: SOAP admin endpoints podem ser adicionados aqui com autenticação JWT.

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`WoW API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init DB', err);
    process.exit(1);
  });

