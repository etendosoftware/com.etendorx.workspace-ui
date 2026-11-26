import { test } from "node:test";
import assert from "node:assert/strict";
import { matchSensitive, parsePatterns, readSensitivePatterns, sensitiveChanges } from "../sensitive.mjs";

const patterns = parsePatterns(`
# comment
packages/MainUI/components/Form/**
packages/MainUI/hooks/useTableSelection.ts
packages/MainUI/**/*Context*.tsx
`);

test("matches files under a ** pattern, exact paths and * wildcards", () => {
  assert.deepEqual(
    matchSensitive(
      [
        "packages/MainUI/components/Form/FormView/FormHeader.tsx",
        "packages/MainUI/hooks/useTableSelection.ts",
        "packages/MainUI/contexts/ToolbarContext.tsx",
        "docs/README.md",
      ],
      patterns
    ),
    [
      "packages/MainUI/components/Form/FormView/FormHeader.tsx",
      "packages/MainUI/hooks/useTableSelection.ts",
      "packages/MainUI/contexts/ToolbarContext.tsx",
    ]
  );
});

test("ignores tests", () => {
  assert.deepEqual(matchSensitive(["packages/MainUI/components/Form/__tests__/A.test.tsx"], patterns), []);
});

test("readSensitivePatterns reads the committed list", () => {
  const committed = readSensitivePatterns();
  assert.ok(committed.length > 0);
  assert.deepEqual(matchSensitive(["packages/MainUI/components/Table/index.tsx"], committed), [
    "packages/MainUI/components/Table/index.tsx",
  ]);
});

test("sensitiveChanges diffs the base against HEAD and keeps the sensitive files", () => {
  const calls = [];
  const git = (...args) => {
    calls.push(args);
    return "packages/MainUI/hooks/useTableSelection.ts\ndocs/README.md\n";
  };
  assert.deepEqual(sensitiveChanges({ git, base: "abc", patterns }), ["packages/MainUI/hooks/useTableSelection.ts"]);
  assert.deepEqual(calls, [["diff", "--name-only", "abc", "HEAD"]]);
  assert.deepEqual(sensitiveChanges({ git: () => "", base: "abc", patterns }), []);
});
