export function escapeCsvCell(value: unknown): string {
  const text = String(value);
  const safeText = /^[\t\r\n]/.test(text) || /^[\u0000-\u0020]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}
