import * as XLSX from 'xlsx';
import { nameFromEmail } from './nameFromEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) { reject(new Error('File contains no sheets')); return; }
        const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
        if (!rows.length) { reject(new Error('Sheet is empty')); return; }
        const headers = Object.keys(rows[0]);
        const nameKey = headers.find(h => h.toLowerCase().includes('name'));
        const emailKey = headers.find(h => h.toLowerCase().includes('email'));
        if (!emailKey) { reject(new Error('No Email column found')); return; }
        const seen = new Set();
        const valid = [], skipped = [], duplicates = [];
        rows.forEach((row, idx) => {
          const rawEmail = String(row[emailKey] || '').trim().toLowerCase();
          const rawName = nameKey ? String(row[nameKey] || '').trim() : '';
          if (!rawEmail) { skipped.push(`Row ${idx + 2}: empty email`); return; }
          if (!EMAIL_RE.test(rawEmail)) { skipped.push(`Row ${idx + 2}: invalid email "${rawEmail}"`); return; }
          if (seen.has(rawEmail)) { duplicates.push(rawEmail); return; }
          seen.add(rawEmail);
          valid.push({ name: rawName || nameFromEmail(rawEmail), email: rawEmail });
        });
        if (!valid.length) { reject(new Error('No valid recipients found')); return; }
        resolve({ recipients: valid, skipped, duplicatesRemoved: duplicates.length });
      } catch (err) { reject(new Error(`Parse error: ${err.message}`)); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
