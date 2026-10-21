import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { compactDirectory, compactEntries, groupRecordings } from "../compact-har.mjs";

const WINDOW_URL = "http://localhost:3000/api/erp/meta/window/143";

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

test("groups the raw recordings of each spec in context order, ignoring other files", () => {
  const groups = groupRecordings(["NAVa.1.har", "NAVa.0.har", "Other.0.har", "NAVa.har.gz", "notes.md"]);
  assert.deepEqual(
    [...groups],
    [
      ["NAVa", ["NAVa.0.har", "NAVa.1.har"]],
      ["Other", ["Other.0.har"]],
    ]
  );
});

test("writes one gzipped HAR per spec and removes the raw recordings", () => {
  const dir = mkdtempSync(join(tmpdir(), "compact-har-"));
  const har = (entries) => JSON.stringify({ log: { version: "1.2", entries } });
  writeFileSync(join(dir, "NAVa.0.har"), har([entry(WINDOW_URL, "A")]));
  writeFileSync(join(dir, "NAVa.1.har"), har([entry(WINDOW_URL, "A"), entry(`${WINDOW_URL}0`, "B")]));

  assert.deepEqual(compactDirectory(dir), [join(dir, "NAVa.har.gz")]);

  const merged = JSON.parse(gunzipSync(readFileSync(join(dir, "NAVa.har.gz"))).toString());
  assert.equal(merged.log.version, "1.2");
  assert.equal(merged.log.entries.length, 2);
  assert.ok(!existsSync(join(dir, "NAVa.0.har")));
  assert.ok(!existsSync(join(dir, "NAVa.1.har")));
});
