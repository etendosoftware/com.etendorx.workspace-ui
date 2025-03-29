const toHex = (value: number): string => value.toString(16).padStart(2, '0').toUpperCase();
const parseColorValue = (color: string) => parseFloat(color.trim());
const parseRgbaValues = (rgba: string) => {
  const start = rgba.indexOf('(') + 1;
  const end = rgba.indexOf(')');

  return rgba.slice(start, end).split(',').map(parseColorValue);
};

type FnWithCache = { cache: { [key: string]: string } };

export function rgbaToHex(this: FnWithCache, rgba: string): string {
  this.cache = this.cache || {};

  if (rgba.startsWith('#')) {
    return rgba.toUpperCase();
  } else if (!this.cache[rgba]) {
    const [r, g, b, a = 1] = parseRgbaValues(rgba);

    const rHex = toHex(r);
    const gHex = toHex(g);
    const bHex = toHex(b);
    const alphaHex = toHex(Math.round(a * 255));

    this.cache[rgba] = `#${rHex}${gHex}${bHex}${alphaHex}`;
  }

  return this.cache[rgba];
}
