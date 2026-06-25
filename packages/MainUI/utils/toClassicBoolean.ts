const FALSY_CLASSIC = new Set(["N", "n", "false", "0"]);

/**
 * Coerces a value to boolean using Etendo Classic ERP semantics.
 * In Classic, YesNo fields store "Y"/"N" strings. A bare display-logic
 * reference like @bank_fee@ returns "N" which is truthy in JS but means
 * false in Classic.
 */
export function toClassicBoolean(value: unknown): boolean {
  if (!value) return false; // handles false, null, undefined, 0, ""
  if (typeof value === "string") return !FALSY_CLASSIC.has(value);
  return true;
}
