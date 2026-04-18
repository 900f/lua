export function sanitize(input, maxLength = 255) {
  if (!input) return '';
  return String(input)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}