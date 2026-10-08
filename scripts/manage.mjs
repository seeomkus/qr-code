#!/usr/bin/env node
// Pengelola aplikasi SeeOmKus QR (Windows & Linux/macOS), tanpa dependensi tambahan.
// Pemakaian: node scripts/manage.mjs <install|build|start|stop|restart|status|logs>

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const RUN_DIR = path.join(ROOT, '.run');
const PID_FILE = path.join(RUN_DIR, 'server.json');
const LOG_FILE = path.join(RUN_DIR, 'server.log');
const WIN = process.platform === 'win32';

const log = (m = '') => console.log(m);
const ok = (m) => log(`[OK]    ${m}`);
const info = (m) => log(`[INFO]  ${m}`);
const fail = (m) => {
  console.error(`[ERROR] ${m}`);
  process.exit(1);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) fail(`Node.js 20 atau lebih baru diperlukan (terdeteksi ${process.versions.node}).`);
}

function npm(args, cwd) {
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: WIN });
  if (r.status !== 0) fail(`"npm ${args.join(' ')}" gagal di folder ${path.basename(cwd)}.`);
}

// ---------- proses ----------
function readState() {
  try {
    return JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function running() {
  const s = readState();
  return s && alive(s.pid) ? s : null;
}

// ---------- perintah ----------
function install() {
  checkNode();
  info('Memasang dependensi backend...');
  npm(['install'], BACKEND);
  info('Memasang dependensi frontend...');
  npm(['install'], FRONTEND);
  ok('Instalasi selesai. Lanjutkan dengan: build, lalu start.');
}

function build() {
  checkNode();
  if (!fs.existsSync(path.join(FRONTEND, 'node_modules')) || !fs.existsSync(path.join(BACKEND, 'node_modules'))) {
    fail('Dependensi belum terpasang. Jalankan "install" terlebih dahulu.');
  }
  info('Build frontend...');
  npm(['run', 'build'], FRONTEND);
  info('Build backend...');
  npm(['run', 'build'], BACKEND);
  ok('Build selesai.');
}

async function start() {
  checkNode();
  const cur = running();
  if (cur) {
    info(`Sudah berjalan (PID ${cur.pid}). Gunakan "restart" untuk memulai ulang.`);
    return printUrls(cur);
  }
  if (!fs.existsSync(path.join(BACKEND, 'dist', 'server.js')) || !fs.existsSync(path.join(FRONTEND, 'dist', 'index.html'))) {
    info('Hasil build belum ada, menjalankan build otomatis...');
    build();
  }

  fs.mkdirSync(RUN_DIR, { recursive: true });
  const out = fs.openSync(LOG_FILE, 'w');
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: BACKEND,
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
    env: process.env,
  });
  child.unref();

  const state = {
    pid: child.pid,
    port: Number(process.env.PORT || 3443),
    proto: process.env.HTTP === '1' ? 'http' : 'https',
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(PID_FILE, JSON.stringify(state));

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    if (!alive(child.pid)) {
      fs.rmSync(PID_FILE, { force: true });
      log(tail(20));
      fail(`Server berhenti saat start. Log lengkap: ${LOG_FILE}`);
    }
    if ((await ping(state)) !== null) {
      ok(`Server berjalan (PID ${child.pid}).`);
      return printUrls(state);
    }
  }
  fail(`Server tidak merespons dalam 10 detik. Periksa log: ${LOG_FILE}`);
}

async function stop() {
  const s = readState();
  if (!s || !alive(s.pid)) {
    fs.rmSync(PID_FILE, { force: true });
    info('Server tidak sedang berjalan.');
    return;
  }
  if (WIN) {
    spawnSync('taskkill', ['/PID', String(s.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-s.pid, 'SIGTERM'); // seluruh grup proses
    } catch {
      process.kill(s.pid, 'SIGTERM');
    }
    for (let i = 0; i < 20 && alive(s.pid); i++) await sleep(250);
    if (alive(s.pid)) {
      try {
        process.kill(-s.pid, 'SIGKILL');
      } catch {
        process.kill(s.pid, 'SIGKILL');
      }
    }
  }
  for (let i = 0; i < 20 && alive(s.pid); i++) await sleep(250);
  if (alive(s.pid)) fail(`Gagal menghentikan proses PID ${s.pid}.`);
  fs.rmSync(PID_FILE, { force: true });
  ok('Server dihentikan.');
}

async function restart() {
  await stop();
  await start();
}

async function status() {
  const s = running();
  if (!s) {
    log('Status : BERHENTI');
    process.exitCode = 3; // konvensi status: 3 = tidak berjalan
    return;
  }
  const code = await ping(s);
  log(`Status : BERJALAN (PID ${s.pid})`);
  log(`Sejak  : ${new Date(s.startedAt).toLocaleString()}`);
  log(`Respons: ${code === null ? 'tidak ada respons dari server' : 'HTTP ' + code}`);
  printUrls(s);
  log(`Log    : ${LOG_FILE}`);
}

function logs() {
  if (!fs.existsSync(LOG_FILE)) return info('Belum ada log.');
  log(tail(50));
}

// ---------- bantu ----------
function tail(n) {
  try {
    return fs.readFileSync(LOG_FILE, 'utf8').split(/\r?\n/).slice(-n).join('\n');
  } catch {
    return '';
  }
}

function ping(s) {
  return new Promise((resolve) => {
    const lib = s.proto === 'https' ? https : http;
    const req = lib.get(
      { host: '127.0.0.1', port: s.port, path: '/api/qr', rejectUnauthorized: false, timeout: 2000 },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      },
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

function printUrls(s) {
  const lines = tail(40)
    .split(/\r?\n/)
    .filter((l) => /(Komputer|Handphone)\s*:/.test(l));
  log('');
  log(lines.length ? lines.join('\n') : `  ${s.proto}://localhost:${s.port}`);
  log('');
}

const cmds = { install, build, start, stop, restart, status, logs };
const cmd = process.argv[2];
if (!cmds[cmd]) {
  log('SeeOmKus QR - pengelola aplikasi\n');
  log('Pemakaian: qr <perintah>\n');
  log('  install   Pasang dependensi backend & frontend');
  log('  build     Build frontend dan backend');
  log('  start     Jalankan server di latar belakang (build otomatis bila perlu)');
  log('  stop      Hentikan server');
  log('  restart   Hentikan lalu jalankan ulang');
  log('  status    Tampilkan status server');
  log('  logs      Tampilkan 50 baris log terakhir');
  process.exit(cmd ? 1 : 0);
}
await cmds[cmd]();
