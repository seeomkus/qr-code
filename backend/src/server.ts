import express from 'express';
import cors from 'cors';
import https from 'node:https';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db.js';
import { getCert, lanAddresses } from './cert.js';

const PORT = Number(process.env.PORT ?? 3443);
const USE_HTTP = process.env.HTTP === '1';
const TYPES = ['text', 'url', 'phone', 'email', 'wifi', 'sms'];

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ---- QR yang dibuat ----
app.get('/api/qr', (_req, res) => {
  res.json(db.prepare('SELECT * FROM qr_codes ORDER BY id DESC LIMIT 200').all());
});

app.post('/api/qr', (req, res) => {
  const title = str(req.body?.title, 100);
  const type = str(req.body?.type, 20);
  const content = str(req.body?.content, 2000);
  if (!title || !content || !TYPES.includes(type)) {
    res.status(400).json({ error: 'Judul, jenis, dan isi QR wajib diisi dengan benar.' });
    return;
  }
  const r = db.prepare('INSERT INTO qr_codes (title, type, content) VALUES (?, ?, ?)').run(title, type, content);
  res.status(201).json(db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(r.lastInsertRowid));
});

app.delete('/api/qr/:id', (req, res) => {
  db.prepare('DELETE FROM qr_codes WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ---- Hasil scan ----
app.get('/api/scans', (_req, res) => {
  res.json(
    db
      .prepare(
        `SELECT s.id, s.content, s.scanned_at, s.qr_id, q.title AS qr_title, q.type AS qr_type
         FROM scans s LEFT JOIN qr_codes q ON q.id = s.qr_id
         ORDER BY s.id DESC LIMIT 200`,
      )
      .all(),
  );
});

app.post('/api/scans', (req, res) => {
  const content = str(req.body?.content, 4000);
  if (!content) {
    res.status(400).json({ error: 'Isi hasil scan kosong.' });
    return;
  }
  const qr = db.prepare('SELECT * FROM qr_codes WHERE content = ? ORDER BY id DESC LIMIT 1').get(content) as
    | { id: number }
    | undefined;
  const r = db.prepare('INSERT INTO scans (content, qr_id) VALUES (?, ?)').run(content, qr?.id ?? null);
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json({ scan, qr: qr ?? null });
});

app.delete('/api/scans/:id', (req, res) => {
  db.prepare('DELETE FROM scans WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ---- Frontend hasil build ----
const dist = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

async function main() {
  const server = USE_HTTP ? http.createServer(app) : https.createServer(await getCert(), app);
  const proto = USE_HTTP ? 'http' : 'https';
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\nSeeOmKus QR berjalan:`);
    console.log(`  Komputer : ${proto}://localhost:${PORT}`);
    for (const ip of lanAddresses()) console.log(`  Handphone: ${proto}://${ip}:${PORT}`);
    console.log(`\nCatatan: browser akan memperingatkan sertifikat; pilih Lanjutkan/Advanced > Proceed.\n`);
  });
}
main();
