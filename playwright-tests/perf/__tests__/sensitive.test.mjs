import { test } from "node:test";
import assert from "node:assert/strict";
import { matchSensitive, parsePatterns } from "../sensitive.mjs";

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
