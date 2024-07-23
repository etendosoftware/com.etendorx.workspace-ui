export function rgbaToHex(rgba: string): string {
  if (rgba.startsWith('#')) {
    return rgba.toUpperCase();
  }

  const parts = rgba.substring(rgba.indexOf('(')).split(','),
    r = parseInt(parts[0].substring(1).trim(), 10),
    g = parseInt(parts[1].trim(), 10),
    b = parseInt(parts[2].trim(), 10),
    a = parseFloat(parts[3] || '1');

  const hex =
    '#' +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

  if (a === 1) {
    return hex;
  }

  const alpha = Math.round(a * 255)
    .toString(16)
    .toUpperCase();
  return hex + (alpha.length === 1 ? '0' + alpha : alpha);
}
