const LOCAL_ONLY_KEYS = new Set(["_locallyAdded"]);

// biome-ignore lint/suspicious/noExplicitAny: process grid rows are untyped at this layer
function stripLocalArtifacts(rows: any[] | undefined): any[] | undefined {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    // Locally-added rows carry a UUID generated client-side (see
    // `generateLocalRecordId`) that exists only for MRT/selection bookkeeping.
    // Classic Etendo never sends it, and any future backend handler that reads
    // `_allRows[i].id` as a primary key would explode on it. Strip both the
    // UUID and the marker before the row reaches the request body.
    const wasLocallyAdded = row._locallyAdded === true;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (LOCAL_ONLY_KEYS.has(k)) continue;
      if (wasLocallyAdded && k === "id") continue;
      cleaned[k] = v;
    }
    return cleaned;
  });
}

/**
 * Keeps all process values under their original keys and additionally exposes
 * the first "main" grid entry under the "grid" key, which is what Classic's
 * OBPickAndExecuteActionHandler reads. Secondary grids (e.g. credit_to_use)
 * must remain under their own keys so the backend can find them by name.
 *
 * Also sanitizes each grid's `_selection` / `_allRows` so locally-added rows
 * (created via the "+" button) don't leak their client-only UUID `id` or the
 * `_locallyAdded` marker into the request payload — mirroring the classic UI,
 * whose `paramWindow.getContextInfo()` never exposes either field.
 */
export function normalizeGridValues(mergedValues: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let firstMainGrid: unknown = undefined;

  for (const [key, value] of Object.entries(mergedValues)) {
    const isGridEntry =
      value !== null &&
      typeof value === "object" &&
      "_selection" in (value as object) &&
      "_allRows" in (value as object);

    if (!isGridEntry) {
      result[key] = value;
      continue;
    }

    const grid = value as { _selection?: unknown[]; _allRows?: unknown[]; [k: string]: unknown };
    const sanitized = {
      ...grid,
      // biome-ignore lint/suspicious/noExplicitAny: rows are untyped at this layer
      _selection: stripLocalArtifacts(grid._selection as any[] | undefined),
      // biome-ignore lint/suspicious/noExplicitAny: rows are untyped at this layer
      _allRows: stripLocalArtifacts(grid._allRows as any[] | undefined),
    };
    result[key] = sanitized;

    if (firstMainGrid === undefined && key !== "credit_to_use") {
      firstMainGrid = sanitized;
    }
  }

  if (firstMainGrid !== undefined) {
    result.grid = firstMainGrid;
  }
  return result;
}
