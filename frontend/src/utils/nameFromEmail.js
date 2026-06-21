export function nameFromEmail(email) {
  const local = email.split('@')[0];
  return local
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
