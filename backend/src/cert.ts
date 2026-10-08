import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import selfsigned from 'selfsigned';
import { DATA_DIR } from './db.js';

export function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
    }
  }
  return out;
}

/** Sertifikat self-signed (HTTPS wajib agar kamera bisa dipakai dari HP lewat jaringan). */
export async function getCert(): Promise<{ key: string; cert: string }> {
  const file = path.join(DATA_DIR, 'cert.json');
  const ips = lanAddresses();
  if (fs.existsSync(file)) {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (JSON.stringify(saved.ips) === JSON.stringify(ips)) return saved.pems;
  }
  const altNames: { type: 2 | 7; value?: string; ip?: string }[] = [
    { type: 2 as const, value: 'localhost' },
    { type: 7 as const, ip: '127.0.0.1' },
    ...ips.map((ip) => ({ type: 7 as const, ip })),
  ];
  const p = await selfsigned.generate([{ name: 'commonName', value: 'SeeOmKus QR' }], {
    algorithm: 'sha256',
    notAfterDate: new Date(Date.now() + 825 * 24 * 3600 * 1000),
    extensions: [{ name: 'subjectAltName', altNames }],
  });
  const pems = { key: p.private, cert: p.cert };
  fs.writeFileSync(file, JSON.stringify({ ips, pems }));
  return pems;
}
