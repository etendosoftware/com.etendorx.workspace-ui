/**
 * Determines if a value represents a valid CSS color.
 * Supports multiple formats: hexadecimal, RGB/RGBA, HSL/HSLA, and standard color names.
 *
 * @param value Value to evaluate. Usually a string is expected.
 * @returns {boolean} Returns true if the value is a valid color, false otherwise.
 *
 * Supported formats:
 *   - Hexadecimal: #fff, #ffffff
 *   - RGB/RGBA: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
 *   - HSL/HSLA: hsl(120, 100%, 50%), hsla(120, 100%, 50%, 0.3)
 *   - Color names: red, blue, transparent, inherit, etc.
 *
 * @example
 * isColorString("#1F845A"); // true
 * isColorString("rgba(0,0,0,0.5)"); // true
 * isColorString("banana"); // false
 */
export const isColorString = (value: unknown): boolean => {
  if (typeof value !== "string") return false;

  // Hex color pattern (#fff or #ffffff)
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (hexPattern.test(value)) return true;

  // RGB/RGBA pattern
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
  if (rgbPattern.test(value)) return true;

  // HSL/HSLA pattern
  const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
  if (hslPattern.test(value)) return true;

  // Named colors (basic check - could be expanded)
  const namedColors = [
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    "gray",
    "grey",
    "transparent",
    "inherit",
    "initial",
  ];
  if (namedColors.includes(value.toLowerCase())) return true;

  return false;
};
