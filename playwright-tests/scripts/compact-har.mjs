#!/usr/bin/env node
/**
 * Compacts the HAR recordings of the mocked-backend layer: the per-context files of each spec
 * (`<spec>.<n>.har`) become one gzipped HAR (`<spec>.har.gz`) without repeated responses. A
 * response equal to the previous one for the same request is dropped: the replay answers a
 * request asked more times than recorded with its last response, so nothing changes. Window
 * metadata, fetched again on every reload, is most of the size. Requests a reload cut off while in
 * flight are dropped too: their response never arrived, so the replay would answer them empty.
 *
 * Usage:
 *   node scripts/compact-har.mjs <recordings dir>   compacts every spec, removing the raw files
 */
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/** `<spec>.<n>.har`: one raw recording per browser context. */
const RAW_RECORDING = /^(.+)\.(\d+)\.har$/;
const COMPACT_EXTENSION = ".har.gz";
/** CORS preflight: answered without a body. */
const PREFLIGHT_METHOD = "OPTIONS";

const requestSignature = ({ request }) => `${request.method} ${request.url} ${request.postData?.text ?? ""}`;

/**
 * Whether the response body of an entry was received: a reload aborts the requests in flight, and
 * the HAR keeps them without a body (`content.text`). A preflight never has one.
 */
export function isReceived(entry) {
  return entry.request.method === PREFLIGHT_METHOD || entry.response.content?.text !== undefined;
}

/**
 * Entries without the aborted requests and without the responses that repeat the previous
 * response of the same exact request.
 */
export function compactEntries(entries) {
  const lastResponse = new Map();
  return entries.filter(isReceived).filter((entry) => {
    const signature = requestSignature(entry);
    const response = entry.response.content?.text ?? "";
    const repeated = lastResponse.get(signature) === response;
    lastResponse.set(signature, response);
    return !repeated;
  });
}

/** Raw recordings of a directory grouped by spec, each group in context order. */
export function groupRecordings(files) {
  const groups = new Map();
  for (const file of files) {
    const match = RAW_RECORDING.exec(file);
    if (match) {
      groups.set(match[1], [...(groups.get(match[1]) ?? []), { file, context: Number(match[2]) }]);
    }
  }
  return new Map(
    [...groups].map(([spec, recordings]) => [spec, recordings.sort((a, b) => a.context - b.context).map((r) => r.file)])
  );
}

/** Merges, compacts and gzips the raw recordings of every spec in `dir`; returns the written files. */
export function compactDirectory(dir) {
  const written = [];
  for (const [spec, files] of groupRecordings(readdirSync(dir))) {
    const hars = files.map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
    const merged = { log: { ...hars[0].log, entries: compactEntries(hars.flatMap((har) => har.log.entries)) } };
    const target = join(dir, `${spec}${COMPACT_EXTENSION}`);
    writeFileSync(target, gzipSync(JSON.stringify(merged)));
    for (const file of files) {
      rmSync(join(dir, file));
    }
    written.push(target);
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const file of compactDirectory(process.argv[2])) {
    console.log(`Compacted ${file}`);
  }
}
