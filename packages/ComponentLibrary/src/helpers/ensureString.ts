// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function ensureString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  return '';
}
