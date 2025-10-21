import { NAMED_COLORS } from "./constants";

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

  // Named colors check using the predefined constant
  if (Object.prototype.hasOwnProperty.call(NAMED_COLORS, value.toLowerCase())) return true;

  return false;
};

/**
 * Calculates the optimal text color (black or white) for a given background color
 * to ensure proper contrast ratio according to WCAG guidelines.
 *
 * @param backgroundColor The background color in any valid CSS format
 * @returns {string} Returns "#000000" for light backgrounds or "#FFFFFF" for dark backgrounds
 *
 * Supports all formats that isColorString validates:
 *   - Hexadecimal: #fff, #ffffff
 *   - RGB/RGBA: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
 *   - HSL/HSLA: hsl(120, 100%, 50%), hsla(120, 100%, 50%, 0.3)
 *   - Color names: red, blue, transparent, etc.
 *
 * @example
 * getContrastTextColor("#1F845A"); // "#FFFFFF" (white text on dark green)
 * getContrastTextColor("#FFEB3B"); // "#000000" (black text on yellow)
 * getContrastTextColor("rgb(255, 0, 0)"); // "#FFFFFF" (white text on red)
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  // Convert color to RGB values
  const rgb = colorToRgb(backgroundColor);
  if (!rgb) {
    // Fallback to black text if color conversion fails
    return "#000000";
  }

  // Calculate relative luminance using WCAG formula
  const { r, g, b } = rgb;
  const luminance = calculateLuminance(r, g, b);

  // Return white text for dark backgrounds, black text for light backgrounds
  // Threshold of 0.5 provides good contrast in most cases
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

/**
 * Converts a CSS color string to RGB values.
 * @param color CSS color string
 * @returns RGB object or null if conversion fails
 */
const colorToRgb = (color: string): { r: number; g: number; b: number } | null => {
  // Handle hex colors
  const hexMatch = color.match(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/);
  if (hexMatch) {
    return hexToRgb(color);
  }

  // Handle RGB/RGBA colors
  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)$/);
  if (rgbMatch) {
    return {
      r: Number.parseInt(rgbMatch[1], 10),
      g: Number.parseInt(rgbMatch[2], 10),
      b: Number.parseInt(rgbMatch[3], 10),
    };
  }

  // Handle HSL/HSLA colors
  const hslMatch = color.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+)?\s*\)$/);
  if (hslMatch) {
    const h = Number.parseInt(hslMatch[1], 10);
    const s = Number.parseInt(hslMatch[2], 10) / 100;
    const l = Number.parseInt(hslMatch[3], 10) / 100;
    return hslToRgb(h, s, l);
  }

  // Handle named colors
  return namedColorToRgb(color);
};

/**
 * Converts hex color to RGB values.
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length === 3) {
    // Short hex format (#fff)
    return {
      r: Number.parseInt(cleanHex[0] + cleanHex[0], 16),
      g: Number.parseInt(cleanHex[1] + cleanHex[1], 16),
      b: Number.parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }

  // Full hex format (#ffffff)
  return {
    r: Number.parseInt(cleanHex.substring(0, 2), 16),
    g: Number.parseInt(cleanHex.substring(2, 4), 16),
    b: Number.parseInt(cleanHex.substring(4, 6), 16),
  };
};

/**
 * Converts HSL values to RGB.
 */
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h = h / 360;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    // Achromatic
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
};

/**
 * Converts named colors to RGB values using the predefined NAMED_COLORS constant.
 */
const namedColorToRgb = (color: string): { r: number; g: number; b: number } | null => {
  return NAMED_COLORS[color.toLowerCase()] || null;
};

/**
 * Calculates relative luminance according to WCAG guidelines.
 */
const calculateLuminance = (r: number, g: number, b: number): number => {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  // Calculate luminance using WCAG formula
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};
