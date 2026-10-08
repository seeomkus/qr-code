import { mdiText, mdiLink, mdiPhone, mdiEmail, mdiWifi, mdiMessageText } from '@mdi/js';

export interface TypeInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const TYPES: TypeInfo[] = [
  { key: 'text', label: 'Teks', icon: mdiText, color: '#6366f1' },
  { key: 'url', label: 'Link Web', icon: mdiLink, color: '#0ea5e9' },
  { key: 'phone', label: 'Telepon', icon: mdiPhone, color: '#10b981' },
  { key: 'sms', label: 'SMS', icon: mdiMessageText, color: '#f59e0b' },
  { key: 'email', label: 'Email', icon: mdiEmail, color: '#ef4444' },
  { key: 'wifi', label: 'WiFi', icon: mdiWifi, color: '#8b5cf6' },
];

export const typeInfo = (k: string) => TYPES.find((t) => t.key === k) ?? TYPES[0];

const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

export function buildPayload(type: string, f: Record<string, string>): string {
  switch (type) {
    case 'url': {
      const u = (f.url || '').trim();
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u;
    }
    case 'phone':
      return 'tel:' + (f.phone || '').trim();
    case 'sms':
      return `SMSTO:${(f.phone || '').trim()}:${f.message || ''}`;
    case 'email': {
      const q = new URLSearchParams();
      if (f.subject) q.set('subject', f.subject);
      if (f.body) q.set('body', f.body);
      const qs = q.toString().replace(/\+/g, '%20');
      return `mailto:${(f.email || '').trim()}${qs ? '?' + qs : ''}`;
    }
    case 'wifi': {
      const enc = f.security || 'WPA';
      const pass = enc === 'nopass' ? '' : `P:${esc(f.password || '')};`;
      return `WIFI:T:${enc};S:${esc(f.ssid || '')};${pass};`;
    }
    default:
      return (f.text || '').trim();
  }
}

export interface Parsed {
  type: string;
  rows: { label: string; value: string }[];
  link?: string;
}

/** Mengurai isi QR hasil scan menjadi informasi yang mudah dibaca. */
export function parsePayload(s: string): Parsed {
  if (/^https?:\/\//i.test(s)) {
    return { type: 'url', rows: [{ label: 'Alamat Web', value: s }], link: s };
  }
  if (/^tel:/i.test(s)) {
    return { type: 'phone', rows: [{ label: 'Nomor Telepon', value: s.slice(4) }], link: s };
  }
  if (/^smsto?:/i.test(s)) {
    const [, num = '', ...msg] = s.split(':');
    const message = msg.join(':');
    return {
      type: 'sms',
      rows: [
        { label: 'Nomor', value: num },
        { label: 'Pesan', value: message },
      ],
      link: `sms:${num}?body=${encodeURIComponent(message)}`,
    };
  }
  if (/^mailto:/i.test(s)) {
    const [addr, qs = ''] = s.slice(7).split('?');
    const q = new URLSearchParams(qs);
    const rows = [{ label: 'Email', value: addr }];
    if (q.get('subject')) rows.push({ label: 'Subjek', value: q.get('subject')! });
    if (q.get('body')) rows.push({ label: 'Isi Pesan', value: q.get('body')! });
    return { type: 'email', rows, link: s };
  }
  if (/^WIFI:/i.test(s)) {
    const get = (k: string) => {
      const m = s.match(new RegExp(`(?:^WIFI:|;)${k}:((?:\\\\.|[^;])*)`, 'i'));
      return m ? m[1].replace(/\\(.)/g, '$1') : '';
    };
    const rows = [
      { label: 'Nama WiFi', value: get('S') },
      { label: 'Keamanan', value: get('T') || 'nopass' },
    ];
    if (get('P')) rows.push({ label: 'Password', value: get('P') });
    return { type: 'wifi', rows };
  }
  return { type: 'text', rows: [{ label: 'Teks', value: s }] };
}
