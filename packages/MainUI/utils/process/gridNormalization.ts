/**
 * Keeps all process values under their original keys and additionally exposes
 * the first "main" grid entry under the "grid" key, which is what Classic's
 * OBPickAndExecuteActionHandler reads. Secondary grids (e.g. credit_to_use)
 * must remain under their own keys so the backend can find them by name.
 */
export function normalizeGridValues(mergedValues: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...mergedValues };
  for (const [key, value] of Object.entries(mergedValues)) {
    const isGridEntry =
      value !== null &&
      typeof value === "object" &&
      "_selection" in (value as object) &&
      "_allRows" in (value as object);
    if (isGridEntry && key !== "credit_to_use") {
      result.grid = value;
      break;
    }
  }
  return result;
}
