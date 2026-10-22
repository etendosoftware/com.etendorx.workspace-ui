/**
 * Fixtures of the mocked-backend specs (`e2e/mocked/`): the same `app`, `data` and `api` as the
 * real-backend specs, with every `/api/**` request answered from HAR recordings.
 *
 * `pnpm pw:record` regenerates the recordings against a running backend (`PW_MOCK_RECORD=1`): one
 * raw HAR per browser context (`<spec>.<n>.har`, `n` = 0 for the test's own context, then one per
 * `attach`), then sanitized and compacted into the committed `e2e/mocked/recordings/<spec>.har.gz`.
 */
import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BrowserContext, TestInfo } from "@playwright/test";
import { expect, test as base } from "../fixtures";
import { API_ROUTES, RecordedResponses, type ReplayReport, readHarEntries, replay } from "./replay";

const RECORDINGS_DIR = fileURLToPath(new URL("../../mocked/recordings/", import.meta.url));
const RECORDING_EXTENSION = ".har";
/** The committed recording of a spec: its raw recordings merged and gzipped by `pw:record`. */
const COMPACT_EXTENSION = ".har.gz";
const SPEC_SUFFIX = ".spec.ts";
const RECORD_MODE = process.env.PW_MOCK_RECORD === "1";
/** Background polling: how many times it fires depends on timing, so it may be unrecorded. */
const TOLERATED_UNRECORDED = [/AlertActionHandler/, /process-monitor/i, /ProcessMonitor/];
/** Request keys can be long (a datasource body): the failure shows their beginning. */
const REPORTED_KEY_LENGTH = 300;

/** The backend of a mocked spec. */
export interface MockedBackend {
  /** Serves another browser context (e.g. a fresh session) from the same recordings. */
  attach(context: BrowserContext): Promise<void>;
  /** Requests without a recording; the fixture fails the test when any is left. */
  readonly report: ReplayReport;
}

/** The recording of a spec, `<spec>.har.gz`, when it exists. */
function recordingFiles(spec: string): string[] {
  const file = `${spec}${COMPACT_EXTENSION}`;
  return readdirSync(RECORDINGS_DIR).includes(file) ? [join(RECORDINGS_DIR, file)] : [];
}

function specName(testInfo: TestInfo): string {
  return basename(testInfo.file, SPEC_SUFFIX);
}

/** Records every attached context into its own HAR file (written when the context closes). */
function recordingBackend(spec: string): MockedBackend {
  let contexts = 0;
  return {
    report: { unmatched: [] },
    attach: async (context) => {
      const file = join(RECORDINGS_DIR, `${spec}.${contexts}${RECORDING_EXTENSION}`);
      contexts += 1;
      await context.routeFromHAR(file, { update: true, updateContent: "embed", url: API_ROUTES });
    },
  };
}

/** Answers every attached context from the spec's recordings. */
function replayingBackend(spec: string): MockedBackend {
  const recordings = new RecordedResponses(readHarEntries(recordingFiles(spec)));
  if (recordings.size === 0) {
    throw new Error(`No recordings for ${spec} in ${RECORDINGS_DIR}: run pnpm pw:record`);
  }
  const report: ReplayReport = { unmatched: [] };
  return {
    report,
    attach: async (context) => {
      await replay(context, recordings, TOLERATED_UNRECORDED, report);
    },
  };
}

export const test = base.extend<{ mockedBackend: MockedBackend }>({
  mockedBackend: async ({ context }, use, testInfo) => {
    const spec = specName(testInfo);
    const backend = RECORD_MODE ? recordingBackend(spec) : replayingBackend(spec);
    await backend.attach(context);
    await use(backend);
    const unmatched = backend.report.unmatched.map((key) => key.slice(0, REPORTED_KEY_LENGTH));
    expect(unmatched, "requests without a recording: run pnpm pw:record").toEqual([]);
  },
  // The page depends on the backend so it is serving before `app` logs in
  page: async ({ page, mockedBackend }, use) => {
    expect(mockedBackend).toBeDefined();
    await use(page);
  },
});

export { expect };
