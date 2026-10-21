/**
 * JSON shapes, to tell whether the backend still answers a recorded request with the same
 * structure (drift guard). Values are ignored: ids, dates and amounts change between databases.
 */

/** One difference between two shapes: where, and the type on each side. */
export interface ShapeDifference {
  path: string;
  recorded: string;
  live: string;
}

const MISSING = "missing";

function typeOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * Compares the shape of two JSON values: types at every path and the keys of every object.
 * Arrays compare their first element only, as the shape of their items; empty arrays match any
 * array. A `null` matches any type: the backend sends null for unset values of any field.
 */
export function shapeDifferences(recorded: unknown, live: unknown, path = "$"): ShapeDifference[] {
  const recordedType = typeOf(recorded);
  const liveType = typeOf(live);
  if (recordedType === "null" || liveType === "null") {
    return [];
  }
  if (recordedType !== liveType) {
    return [{ path, recorded: recordedType, live: liveType }];
  }
  if (recordedType === "array") {
    const [recordedItem] = recorded as unknown[];
    const [liveItem] = live as unknown[];
    if (recordedItem === undefined || liveItem === undefined) {
      return [];
    }
    return shapeDifferences(recordedItem, liveItem, `${path}[0]`);
  }
  if (recordedType === "object") {
    return objectDifferences(recorded as Record<string, unknown>, live as Record<string, unknown>, path);
  }
  return [];
}

function objectDifferences(
  recorded: Record<string, unknown>,
  live: Record<string, unknown>,
  path: string
): ShapeDifference[] {
  const keys = new Set([...Object.keys(recorded), ...Object.keys(live)]);
  return [...keys].flatMap((key) => {
    const childPath = `${path}.${key}`;
    if (!(key in live)) {
      return [{ path: childPath, recorded: typeOf(recorded[key]), live: MISSING }];
    }
    if (!(key in recorded)) {
      return [{ path: childPath, recorded: MISSING, live: typeOf(live[key]) }];
    }
    return shapeDifferences(recorded[key], live[key], childPath);
  });
}
