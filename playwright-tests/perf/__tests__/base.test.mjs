import { test } from "node:test";
import assert from "node:assert/strict";
import { baseLine, mergeBaseOrTip } from "../base.mjs";

const TARGET = "origin/main";
const MERGE_BASE = "1111111111aaaa";
const TIP = "2222222222bbbb";

/** A git stub: answers rev-parse with the tip, and merge-base only when the clone has it. */
const fakeGit =
  (hasMergeBase) =>
  (...args) => {
    if (args[0] === "merge-base") {
      if (!hasMergeBase) throw new Error("fatal: no merge base");
      return MERGE_BASE;
    }
    return TIP;
  };

test("uses the merge-base when the clone has it", () => {
  assert.deepEqual(mergeBaseOrTip(fakeGit(true), TARGET), { baseSha: MERGE_BASE, baseIsTip: false });
});

test("falls back to the tip of the target in a shallow clone", () => {
  assert.deepEqual(mergeBaseOrTip(fakeGit(false), TARGET), { baseSha: TIP, baseIsTip: true });
});

test("the report says which commit of the target was measured", () => {
  assert.equal(
    baseLine({ target: TARGET, baseSha: MERGE_BASE, baseIsTip: false }),
    "- **Base:** `origin/main` merge-base `111111111`"
  );
  assert.equal(
    baseLine({ target: TARGET, baseSha: TIP, baseIsTip: true }),
    "- **Base:** `origin/main` tip `222222222` (no merge-base in this clone)"
  );
});
