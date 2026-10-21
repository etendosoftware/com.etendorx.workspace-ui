/**
 * Drift guard of the mocked-backend layer: replays recorded requests against the live backend and
 * reports the responses whose JSON shape no longer matches the recording, so a change of
 * `com.etendoerp.metadata` cannot silently leave the mocked specs testing an outdated contract.
 */
import { canonicalUrl } from "./normalize";
import type { HarEntry } from "./replay";
import { type ShapeDifference, shapeDifferences } from "./shape";

/** Requests that change data or the session: never sent again by the guard. */
const SIDE_EFFECTS = /_operationType=(add|update|remove)|command=save|\/api\/auth\//;
const JSON_TYPE = /json/;
const OK_STATUS = 200;

/** Whether a recorded entry can be sent again without side effects and compared as JSON. */
export function isComparable(entry: HarEntry): boolean {
  return (
    entry.response.status === OK_STATUS &&
    JSON_TYPE.test(entry.response.content.mimeType ?? "") &&
    !SIDE_EFFECTS.test(entry.request.url)
  );
}

function parseJson(text: string | undefined): unknown {
  try {
    return JSON.parse(text ?? "");
  } catch {
    return undefined;
  }
}

/**
 * Differences between a recorded response and the live answer to the same request, as readable
 * lines (`POST /api/datasource $.response.data[0].qty: number → string`). A live answer that is
 * not JSON is a difference of its own.
 */
export function recordingDrift(entry: HarEntry, liveText: string): string[] {
  const request = `${entry.request.method} ${canonicalUrl(entry.request.url)}`;
  const live = parseJson(liveText);
  if (live === undefined) {
    return [`${request}: the live response is not JSON`];
  }
  return shapeDifferences(parseJson(entry.response.content.text), live).map(
    ({ path, recorded, live: liveType }: ShapeDifference) => `${request} ${path}: ${recorded} → ${liveType}`
  );
}
