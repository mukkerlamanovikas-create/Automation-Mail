import * as XLSX from 'xlsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse an Excel (.xlsx / .xls) file and return an array of { name, email } objects.
 * Expects at least two columns whose headers contain "name" and "email" (case-insensitive).
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          reject(new Error('Excel file contains no sheets'));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

        if (rows.length === 0) {
          reject(new Error('Excel sheet is empty — add a header row and at least one data row'));
          return;
        }

        // Locate "name" and "email" columns (case-insensitive partial match)
        const headers = Object.keys(rows[0]);
        const nameKey = headers.find(h => h.toLowerCase().includes('name'));
        const emailKey = headers.find(h => h.toLowerCase().includes('email'));

        if (!nameKey) {
          reject(new Error('No "Name" column found. Ensure the header is named "Name" (or similar)'));
          return;
        }
        if (!emailKey) {
          reject(new Error('No "Email" column found. Ensure the header is named "Email" (or similar)'));
          return;
        }

        const skipped = [];
        const recipients = [];

        rows.forEach((row, idx) => {
          const name = String(row[nameKey] || '').trim();
          const email = String(row[emailKey] || '').trim().toLowerCase();

          if (!name || !email) {
            skipped.push(`Row ${idx + 2}: empty name or email`);
            return;
          }
          if (!EMAIL_RE.test(email)) {
            skipped.push(`Row ${idx + 2}: invalid email "${email}"`);
            return;
          }
          recipients.push({ name, email });
        });

        if (recipients.length === 0) {
          reject(
            new Error(
              `No valid recipients found.\n${skipped.slice(0, 5).join('\n')}${skipped.length > 5 ? `\n…and ${skipped.length - 5} more` : ''}`
            )
          );
          return;
        }

        resolve({ recipients, skipped });
      } catch (err) {
        reject(new Error(`Failed to parse Excel: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file'));
    reader.readAsArrayBuffer(file);
  });
}
