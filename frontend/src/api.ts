export interface QrRecord {
  id: number;
  title: string;
  type: string;
  content: string;
  created_at: string;
}
export interface ScanRecord {
  id: number;
  content: string;
  scanned_at: string;
  qr_id: number | null;
  qr_title: string | null;
  qr_type: string | null;
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Terjadi kesalahan pada server.');
  return data as T;
}

export const api = {
  listQr: () => req<QrRecord[]>('/api/qr'),
  createQr: (b: { title: string; type: string; content: string }) =>
    req<QrRecord>('/api/qr', { method: 'POST', body: JSON.stringify(b) }),
  deleteQr: (id: number) => req('/api/qr/' + id, { method: 'DELETE' }),
  listScans: () => req<ScanRecord[]>('/api/scans'),
  saveScan: (content: string) =>
    req<{ scan: ScanRecord; qr: QrRecord | null }>('/api/scans', { method: 'POST', body: JSON.stringify({ content }) }),
  deleteScan: (id: number) => req('/api/scans/' + id, { method: 'DELETE' }),
};

/** SQLite menyimpan waktu UTC tanpa zona. */
export function fmtDate(s: string): string {
  return new Date(s.replace(' ', 'T') + 'Z').toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
