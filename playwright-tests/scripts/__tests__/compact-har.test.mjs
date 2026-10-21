import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { compactDirectory, compactEntries, groupRecordings, isReceived } from "../compact-har.mjs";

const WINDOW_URL = "http://localhost:3000/api/erp/meta/window/143";
const RAW_CONTEXT_0 = "NAVa.0.har";
const RAW_CONTEXT_1 = "NAVa.1.har";
const COMPACTED = "NAVa.har.gz";

/** A HAR entry answering `url` with `text`. */
const entry = (url, text) => ({ request: { method: "GET", url }, response: { status: 200, content: { text } } });

test("drops a response equal to the previous one for the same request", () => {
  const entries = [entry(WINDOW_URL, "A"), entry(WINDOW_URL, "A"), entry(`${WINDOW_URL}0`, "A")];
  assert.deepEqual(compactEntries(entries), [entries[0], entries[2]]);
});

test("keeps a changed response and the ones after it, so the replay order is unchanged", () => {
  const entries = [entry(WINDOW_URL, "A"), entry(WINDOW_URL, "B"), entry(WINDOW_URL, "A")];
  assert.deepEqual(compactEntries(entries), entries);
});

test("drops the requests aborted in flight, whose response body never arrived", () => {
  const withoutBody = (method, status) => ({ request: { method, url: WINDOW_URL }, response: { status, content: {} } });
  const aborted = withoutBody("GET", -1);
  const cutOff = withoutBody("GET", 200);
  const preflight = withoutBody("OPTIONS", 200);
  const received = entry(WINDOW_URL, "A");
  assert.equal(isReceived(aborted), false);
  assert.equal(isReceived(entry(WINDOW_URL, "")), true);
  assert.deepEqual(compactEntries([aborted, cutOff, preflight, received]), [preflight, received]);
});

test("groups the raw recordings of each spec in context order, ignoring other files", () => {
  const groups = groupRecordings([RAW_CONTEXT_1, RAW_CONTEXT_0, "Other.0.har", COMPACTED, "notes.md"]);
  assert.deepEqual(
    [...groups],
    [
      ["NAVa", [RAW_CONTEXT_0, RAW_CONTEXT_1]],
      ["Other", ["Other.0.har"]],
    ]
  );
});

test("writes one gzipped HAR per spec and removes the raw recordings", () => {
  const dir = mkdtempSync(join(tmpdir(), "compact-har-"));
  const har = (entries) => JSON.stringify({ log: { version: "1.2", entries } });
  writeFileSync(join(dir, RAW_CONTEXT_0), har([entry(WINDOW_URL, "A")]));
  writeFileSync(join(dir, RAW_CONTEXT_1), har([entry(WINDOW_URL, "A"), entry(`${WINDOW_URL}0`, "B")]));

  assert.deepEqual(compactDirectory(dir), [join(dir, COMPACTED)]);

  const merged = JSON.parse(gunzipSync(readFileSync(join(dir, COMPACTED))).toString());
  assert.equal(merged.log.version, "1.2");
  assert.equal(merged.log.entries.length, 2);
  assert.ok(!existsSync(join(dir, RAW_CONTEXT_0)));
  assert.ok(!existsSync(join(dir, RAW_CONTEXT_1)));
});
