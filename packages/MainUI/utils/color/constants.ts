/**
 * Named CSS colors with their corresponding RGB values.
 * This ensures consistency between color validation and RGB conversion.
 */
export const NAMED_COLORS: Record<string, { r: number; g: number; b: number }> = {
  red: { r: 255, g: 0, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  green: { r: 0, g: 128, b: 0 },
  yellow: { r: 255, g: 255, b: 0 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 192, b: 203 },
  brown: { r: 165, g: 42, b: 42 },
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  transparent: { r: 255, g: 255, b: 255 }, // Assume white background for transparent
};
