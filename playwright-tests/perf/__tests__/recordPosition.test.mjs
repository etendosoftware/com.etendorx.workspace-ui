import { test } from "node:test";
import assert from "node:assert/strict";
import { availableNextClicks, parseRecordPosition } from "../recordPosition.mjs";

test("parseRecordPosition reads the form's position indicator", () => {
  assert.deepEqual(parseRecordPosition("3 / 100"), { current: 3, total: 100 });
  assert.equal(parseRecordPosition("- / -"), null);
});

test("availableNextClicks never goes past the last record", () => {
  assert.equal(availableNextClicks("1 / 101", 5), 5);
  assert.equal(availableNextClicks("1 / 3", 5), 2);
  assert.equal(availableNextClicks("3 / 3", 5), 0);
  assert.equal(availableNextClicks("- / -", 5), 0);
});
