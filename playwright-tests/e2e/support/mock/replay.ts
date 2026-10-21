/**
 * Replay of recorded backend responses: every `/api/**` request of the browser is answered from
 * HAR recordings instead of reaching the Next.js API routes, so the UI runs without an ERP.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { BrowserContext, Route } from "@playwright/test";
import { requestKey } from "./normalize";

/** Every request the browser sends to the Next.js API routes. */
export const API_ROUTES = /\/api\//;

/** The HAR 1.2 subset the replay reads. */
export interface HarEntry {
  request: { method: string; url: string; postData?: { text?: string } };
  response: {
    status: number;
    content: { mimeType?: string; text?: string; encoding?: string };
  };
}

export interface Har {
  log: { entries: HarEntry[] };
}

/** A response as recorded: status, content type and body (base64 when binary). */
export interface RecordedResponse {
  status: number;
  contentType: string;
  body: string;
  base64: boolean;
}

/** What a replay saw: the keys of requests that had no recording and are not tolerated. */
export interface ReplayReport {
  readonly unmatched: string[];
}

const NOT_RECORDED_STATUS = 404;
const DEFAULT_CONTENT_TYPE = "application/json";

function toRecordedResponse({ response }: HarEntry): RecordedResponse {
  return {
    status: response.status,
    contentType: response.content.mimeType || DEFAULT_CONTENT_TYPE,
    body: response.content.text ?? "",
    base64: response.content.encoding === "base64",
  };
}

/**
 * Recorded responses by request key, in recording order. A key asked more times than it was
 * recorded keeps answering with its last response (polling, refetches).
 */
export class RecordedResponses {
  private readonly byKey = new Map<string, RecordedResponse[]>();
  private readonly served = new Map<string, number>();

  constructor(entries: readonly HarEntry[]) {
    for (const entry of entries) {
      const key = requestKey({
        method: entry.request.method,
        url: entry.request.url,
        postData: entry.request.postData?.text,
      });
      const responses = this.byKey.get(key) ?? [];
      responses.push(toRecordedResponse(entry));
      this.byKey.set(key, responses);
    }
  }

  /** Number of distinct request keys recorded. */
  get size(): number {
    return this.byKey.size;
  }

  /** The next response for `key`, or undefined when it was never recorded. */
  next(key: string): RecordedResponse | undefined {
    const responses = this.byKey.get(key);
    if (!responses) {
      return undefined;
    }
    const index = this.served.get(key) ?? 0;
    this.served.set(key, index + 1);
    return responses[Math.min(index, responses.length - 1)];
  }
}

const GZIP_EXTENSION = ".gz";

/** Reads and merges the entries of HAR files, plain or gzipped (`.har.gz`, see scripts/compact-har.mjs). */
export function readHarEntries(files: readonly string[]): HarEntry[] {
  return files.flatMap((file) => {
    const content = readFileSync(file);
    const text = file.endsWith(GZIP_EXTENSION) ? gunzipSync(content).toString("utf8") : content.toString("utf8");
    return (JSON.parse(text) as Har).log.entries;
  });
}

async function fulfill(route: Route, response: RecordedResponse): Promise<void> {
  await route.fulfill({
    status: response.status,
    contentType: response.contentType,
    body: response.base64 ? Buffer.from(response.body, "base64") : response.body,
  });
}

/**
 * Answers the `/api/**` requests of `context` from `recordings`. A request with no recording
 * gets a 404 and, unless its URL matches `tolerated` (background polling whose count varies
 * between runs), is added to `report`: specs assert it stays empty. Pass the same report to
 * every context of a test.
 */
export async function replay(
  context: BrowserContext,
  recordings: RecordedResponses,
  tolerated: readonly RegExp[] = [],
  report: ReplayReport = { unmatched: [] }
): Promise<ReplayReport> {
  await context.route(API_ROUTES, async (route) => {
    const request = route.request();
    const key = requestKey({ method: request.method(), url: request.url(), postData: request.postData() });
    const response = recordings.next(key);
    if (response) {
      await fulfill(route, response);
      return;
    }
    if (!tolerated.some((pattern) => pattern.test(request.url()))) {
      report.unmatched.push(key);
    }
    await route.fulfill({ status: NOT_RECORDED_STATUS, json: { error: "Not recorded", key } });
  });
  return report;
}
