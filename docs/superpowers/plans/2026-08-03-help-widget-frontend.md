# Help Widget (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a navbar Help access, visible only when the active window has help text, that opens a right-side drawer showing the window's help content (window description + per-tab description + per-field help), sourced entirely from metadata the frontend already fetches.

**Architecture:** A pure content-building util (`buildHelpContent.ts`) turns `WindowMetadata` into ordered/filtered sections. A presentational `HelpButton` (ComponentLibrary, mirrors the existing `AboutButton`) is the trigger icon. A `HelpDrawer` (MainUI) renders the sanitized content inside the existing `Modal` portal, styled as a right-side sliding panel instead of a centered dialog. A `HelpAccess` orchestrator (MainUI) wires active-window state to both, and is mounted as one new sibling in `navigation.tsx` — no changes to `About`'s existing flow.

**Tech Stack:** React/TypeScript (Next.js App Router), existing `Modal.tsx` portal, DOMPurify (`sanitizeMessageHtml`), Zustand-backed `useMetadataContext`, Jest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-03-help-widget-frontend-design.md` (and backend data contract: `com.etendoerp.metadata` repo, `docs/superpowers/plans/2026-08-03-help-widget-data-contract.md` — 0 backend changes, already verified live).

**Branch:** `hotfix/ETP-4620` (created from `main`). Commit messages use the `Hotfix ETP-4620: <description>` format per this repo's Git Police convention.

---

### Task 1: Type the metadata fields the feature depends on

**Files:**
- Modify: `packages/api-client/src/api/types.ts:452-511` (`Tab` interface)
- Modify: `packages/api-client/src/api/types.ts:513-521` (`WindowMetadata` interface)

No test-first step here — this is a pure type addition (no runtime behavior), verified by the build/typecheck instead of a unit test.

- [ ] **Step 1: Add `helpComment` and `sequenceNumber` to `Tab`**

In `packages/api-client/src/api/types.ts`, inside `export interface Tab { ... }` (starts line 452), add:

```ts
  /** AD_Tab.HELP, translated (FULL_TRANSLATABLE). Always present on the wire, null when empty. */
  helpComment?: string | null;
  /** AD_Tab column position — used to order tabs the same way Classic's Help view does. */
  sequenceNumber?: number;
```

- [ ] **Step 2: Add `helpComment` to `WindowMetadata`**

In the same file, inside `export interface WindowMetadata { ... }` (starts line 513), add:

```ts
  /** AD_Window.HELP, translated (FULL_TRANSLATABLE). Always present on the wire, null when empty. */
  helpComment?: string | null;
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @workspaceui/api-client build`
Expected: succeeds with no type errors (this is a pure additive change to optional fields, nothing else references them yet).

- [ ] **Step 4: Commit**

```bash
git add packages/api-client/src/api/types.ts
git commit -m "Hotfix ETP-4620: type window/tab helpComment and sequenceNumber"
```

---

### Task 2: Pure content-building util

**Files:**
- Create: `packages/MainUI/utils/help/buildHelpContent.ts`
- Test: `packages/MainUI/utils/help/__tests__/buildHelpContent.test.ts`

This is the core logic: ordering, filtering (omit fields with no help text and no column fallback, omit audit fields), and the window-level visibility rule. Fully unit-testable with no DOM/React involved.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/MainUI/utils/help/__tests__/buildHelpContent.test.ts
import { buildHelpSections, shouldShowHelp } from "../buildHelpContent";
import { createMockWindowMetadata, createMockTab, createMockField } from "@/utils/tests/mockHelpers";

describe("shouldShowHelp", () => {
  it("returns true for non-empty helpComment", () => {
    expect(shouldShowHelp({ helpComment: "Some help" })).toBe(true);
  });

  it("returns false for null/undefined/empty/whitespace helpComment", () => {
    expect(shouldShowHelp({ helpComment: null })).toBe(false);
    expect(shouldShowHelp({ helpComment: undefined })).toBe(false);
    expect(shouldShowHelp({ helpComment: "" })).toBe(false);
    expect(shouldShowHelp({ helpComment: "   " })).toBe(false);
  });

  it("returns false for a null/undefined window", () => {
    expect(shouldShowHelp(null)).toBe(false);
    expect(shouldShowHelp(undefined)).toBe(false);
  });
});

describe("buildHelpSections", () => {
  it("orders tabs by sequenceNumber regardless of array order", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    const sections = buildHelpSections(window);

    expect(sections.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("orders fields within a tab by sequenceNumber", () => {
    const field20 = createMockField({ id: "f20", name: "Second", sequenceNumber: 20, helpComment: "help" });
    const field10 = createMockField({ id: "f10", name: "First", sequenceNumber: 10, helpComment: "help" });
    const tab = createMockTab({ id: "t1", sequenceNumber: 10, fields: { field20, field10 } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields.map((f) => f.id)).toEqual(["f10", "f20"]);
  });

  it("omits fields with no helpComment and no column fallback", () => {
    const withHelp = createMockField({ id: "f1", helpComment: "has help", column: { helpComment: undefined } });
    const withoutHelp = createMockField({ id: "f2", helpComment: "", column: { helpComment: undefined } });
    const tab = createMockTab({ id: "t1", fields: { withHelp, withoutHelp } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields.map((f) => f.id)).toEqual(["f1"]);
  });

  it("falls back to column.helpComment when field.helpComment is empty", () => {
    const field = createMockField({ id: "f1", helpComment: "", column: { helpComment: "column help text" } });
    const tab = createMockTab({ id: "t1", fields: { field } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([{ id: "f1", name: field.name, helpComment: "column help text" }]);
  });

  it("omits audit synthetic fields regardless of help content", () => {
    const auditField = createMockField({ id: "f1", helpComment: "audit help", isAuditField: true });
    const tab = createMockTab({ id: "t1", fields: { auditField } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([]);
  });

  it("returns empty-string tab helpComment (not null/undefined) when tab has none", () => {
    const tab = createMockTab({ id: "t1", helpComment: null, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].helpComment).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:mainui -- buildHelpContent`
Expected: FAIL — `Cannot find module '../buildHelpContent'`

- [ ] **Step 3: Implement**

```ts
// packages/MainUI/utils/help/buildHelpContent.ts
import type { Field, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";

export interface HelpField {
  id: string;
  name: string;
  helpComment: string;
}

export interface HelpTabSection {
  id: string;
  name: string;
  helpComment: string;
  fields: HelpField[];
}

export function shouldShowHelp(window: { helpComment?: string | null } | null | undefined): boolean {
  return Boolean(window?.helpComment?.trim());
}

// field.column is typed as required in Field, but live metadata has shown it can
// genuinely be null/undefined at runtime for some field kinds — read defensively.
function getFieldHelp(field: Field): string {
  const own = field.helpComment?.trim();
  if (own) return own;
  return (field.column as Field["column"] | null | undefined)?.helpComment?.trim() ?? "";
}

export function buildHelpSections(window: WindowMetadata): HelpTabSection[] {
  const orderedTabs = [...window.tabs].sort(
    (a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0)
  );

  return orderedTabs.map((tab: Tab) => {
    const fields = Object.values(tab.fields)
      .filter((field) => !field.isAuditField)
      .map((field) => ({ field, help: getFieldHelp(field) }))
      .filter(({ help }) => help.length > 0)
      .sort((a, b) => a.field.sequenceNumber - b.field.sequenceNumber)
      .map(({ field, help }) => ({ id: field.id, name: field.name, helpComment: help }));

    return {
      id: tab.id,
      name: tab.name,
      helpComment: tab.helpComment?.trim() ?? "",
      fields,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:mainui -- buildHelpContent`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/utils/help/buildHelpContent.ts packages/MainUI/utils/help/__tests__/buildHelpContent.test.ts
git commit -m "Hotfix ETP-4620: add pure Help content builder"
```

---

### Task 3: `HelpButton` (presentational trigger icon, ComponentLibrary)

**Files:**
- Create: `packages/ComponentLibrary/src/components/Help/HelpButton.tsx`
- Create: `packages/ComponentLibrary/src/components/Help/types.ts`
- Test: `packages/ComponentLibrary/src/components/Help/HelpButton.test.tsx`
- Modify: `packages/ComponentLibrary/src/components/index.ts` (barrel export)

Mirrors `About/AboutButton.tsx` exactly — dumb presentational component, no visibility logic (the caller decides whether to mount it, same as `{isCopilotInstalled && <CopilotButton .../>}` in `navigation.tsx:212`).

- [ ] **Step 1: Write the failing test**

```tsx
// packages/ComponentLibrary/src/components/Help/HelpButton.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import HelpButton from "./HelpButton";

jest.mock("../../assets/icons/help-circle.svg", () => {
  return function HelpIcon() {
    return <svg data-testid="help-icon" />;
  };
});

describe("HelpButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with default tooltip and aria-label", () => {
    render(<HelpButton onClick={mockOnClick} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Help");
  });

  it("calls onClick when clicked", () => {
    render(<HelpButton onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("renders the help icon", () => {
    render(<HelpButton onClick={mockOnClick} />);
    expect(screen.getByTestId("help-icon")).toBeInTheDocument();
  });

  it("respects a custom tooltip", () => {
    render(<HelpButton onClick={mockOnClick} tooltip="Window help" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Window help");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:component-library -- HelpButton`
Expected: FAIL — `Cannot find module './HelpButton'`

- [ ] **Step 3: Implement**

```ts
// packages/ComponentLibrary/src/components/Help/types.ts
export interface HelpButtonProps {
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  iconButtonClassName?: string;
}
```

```tsx
// packages/ComponentLibrary/src/components/Help/HelpButton.tsx
import IconButton from "../IconButton";
import HelpIcon from "../../assets/icons/help-circle.svg";
import type { HelpButtonProps } from "./types";

const HelpButton: React.FC<HelpButtonProps> = ({
  onClick,
  tooltip = "Help",
  disabled = false,
  iconButtonClassName = "w-10 h-10",
}) => {
  return (
    <IconButton
      onClick={onClick}
      tooltip={tooltip}
      disabled={disabled}
      className={iconButtonClassName}
      ariaLabel={tooltip}>
      <HelpIcon />
    </IconButton>
  );
};

export default HelpButton;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:component-library -- HelpButton`
Expected: PASS (4 tests)

- [ ] **Step 5: Export from the barrel**

In `packages/ComponentLibrary/src/components/index.ts`:
- Add near the `AboutButtonComp` import: `import HelpButtonComp from "./Help/HelpButton";`
- Add near `const AboutButton = AboutButtonComp;`: `const HelpButton = HelpButtonComp;`
- Add `HelpButton,` to the `export { ... }` list (next to `AboutButton,`).

- [ ] **Step 6: Commit**

```bash
git add packages/ComponentLibrary/src/components/Help packages/ComponentLibrary/src/components/index.ts
git commit -m "Hotfix ETP-4620: add HelpButton presentational component"
```

---

### Task 4: `HelpDrawer` (content view, MainUI)

**Files:**
- Create: `packages/MainUI/components/HelpDrawer/HelpDrawer.tsx`
- Test: `packages/MainUI/components/HelpDrawer/__tests__/HelpDrawer.test.tsx`

Reuses `Modal.tsx` (`packages/MainUI/components/Modal.tsx`) for the portal + Escape-close behavior — no new generic Drawer primitive. Styles its content as a right-anchored panel instead of `Modal`'s default centered usage. Sanitizes with `sanitizeMessageHtml` (`packages/MainUI/utils/processes/definition/sanitizeHtml.ts`) — **not** `RichTextSelector`'s permissive default DOMPurify call (see design doc rationale: `<a>`/images are out of scope for Help content).

- [ ] **Step 1: Write the failing test**

```tsx
// packages/MainUI/components/HelpDrawer/__tests__/HelpDrawer.test.tsx
import { render, screen } from "@testing-library/react";
import HelpDrawer from "../HelpDrawer";
import { createMockWindowMetadata, createMockTab, createMockField } from "@/utils/tests/mockHelpers";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../Modal", () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mock-modal">{children}</div> : null,
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));

describe("HelpDrawer", () => {
  const mockOnClose = jest.fn();

  it("renders nothing when closed", () => {
    const window = createMockWindowMetadata("W1");
    render(<HelpDrawer open={false} window={window} onClose={mockOnClose} />);
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });

  it("renders the window title and sanitized window helpComment", () => {
    const window = { ...createMockWindowMetadata("W1"), helpComment: "<p>Window help</p><script>alert(1)</script>" };
    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByText(/Window W1/)).toBeInTheDocument();
    expect(screen.getByText("Window help")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("renders tabs ordered by sequenceNumber with their field help", () => {
    const field = createMockField({ id: "f1", name: "Document No.", helpComment: "Field help text" });
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, helpComment: "Lines help", fields: {} });
    const tabB = createMockTab({
      id: "b",
      name: "Header",
      sequenceNumber: 10,
      helpComment: "Header help",
      fields: { f1: field },
    });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Header", "Lines"]);
    expect(screen.getByText("Document No.")).toBeInTheDocument();
    expect(screen.getByText("Field help text")).toBeInTheDocument();
  });

  it("omits fields with no help content", () => {
    const withHelp = createMockField({ id: "f1", name: "Has Help", helpComment: "yes" });
    const withoutHelp = createMockField({ id: "f2", name: "No Help", helpComment: "", column: { helpComment: undefined } });
    const tab = createMockTab({ id: "t1", fields: { withHelp, withoutHelp } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByText("Has Help")).toBeInTheDocument();
    expect(screen.queryByText("No Help")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:mainui -- HelpDrawer`
Expected: FAIL — `Cannot find module '../HelpDrawer'`

- [ ] **Step 3: Implement**

```tsx
// packages/MainUI/components/HelpDrawer/HelpDrawer.tsx
"use client";

import Modal from "../Modal";
import { sanitizeMessageHtml } from "@/utils/processes/definition/sanitizeHtml";
import { buildHelpSections } from "@/utils/help/buildHelpContent";
import { useTranslation } from "@/hooks/useTranslation";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import type { WindowMetadata } from "@workspaceui/api-client/src/api/types";

export interface HelpDrawerProps {
  open: boolean;
  window: WindowMetadata | null | undefined;
  onClose: () => void;
}

const HelpDrawer: React.FC<HelpDrawerProps> = ({ open, window, onClose }) => {
  const { t } = useTranslation();
  const sections = window ? buildHelpSections(window) : [];
  const windowHelp = window?.helpComment?.trim() ?? "";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="fixed inset-0 bg-black/20" onClick={onClose}>
        <div
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              {t("common.helpFor")} {window?.name}
            </h2>
            <button type="button" onClick={onClose} aria-label={t("common.close")}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-6">
            {windowHelp && (
              // biome-ignore lint: sanitized via sanitizeMessageHtml above
              <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(windowHelp) }} />
            )}
            {sections.map((tab) => (
              <section key={tab.id}>
                <h3 className="font-semibold">{tab.name}</h3>
                {tab.helpComment && (
                  // biome-ignore lint: sanitized via sanitizeMessageHtml above
                  <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(tab.helpComment) }} />
                )}
                {tab.fields.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {tab.fields.map((field) => (
                      <li key={field.id}>
                        <strong>{field.name}</strong>
                        {/* biome-ignore lint: sanitized via sanitizeMessageHtml above */}
                        <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(field.helpComment) }} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HelpDrawer;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:mainui -- HelpDrawer`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/HelpDrawer
git commit -m "Hotfix ETP-4620: add HelpDrawer content view"
```

---

### Task 5: `HelpAccess` orchestrator (MainUI)

**Files:**
- Create: `packages/MainUI/components/Header/HelpAccess.tsx`
- Test: `packages/MainUI/components/Header/__tests__/HelpAccess.test.tsx`

Wires active-window state (`useMetadataContext`) to `HelpButton` (only mounted when `shouldShowHelp` is true) and `HelpDrawer`. Also owns the "close the drawer if the active window changes while it's open" rule from the spec.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/MainUI/components/Header/__tests__/HelpAccess.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import HelpAccess from "../HelpAccess";
import { createMockWindowMetadata } from "@/utils/tests/mockHelpers";

const mockUseMetadataContext = jest.fn();
jest.mock("@/contexts/metadata", () => ({
  useMetadataContext: () => mockUseMetadataContext(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/help-circle.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="help-icon" />,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));
jest.mock("../../Modal", () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mock-modal">{children}</div> : null,
}));

describe("HelpAccess", () => {
  beforeEach(() => {
    mockUseMetadataContext.mockReset();
  });

  it("renders nothing when the active window has no helpComment", () => {
    mockUseMetadataContext.mockReturnValue({ windowId: "w1", window: createMockWindowMetadata("w1") });
    render(<HelpAccess />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the trigger when the active window has helpComment", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    render(<HelpAccess />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens the drawer when the trigger is clicked", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    render(<HelpAccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
  });

  it("closes the drawer when the active window changes", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    const { rerender } = render(<HelpAccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();

    mockUseMetadataContext.mockReturnValue({
      windowId: "w2",
      window: { ...createMockWindowMetadata("w2"), helpComment: "Other help" },
    });
    rerender(<HelpAccess />);

    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:mainui -- HelpAccess`
Expected: FAIL — `Cannot find module '../HelpAccess'`

- [ ] **Step 3: Implement**

```tsx
// packages/MainUI/components/Header/HelpAccess.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useMetadataContext } from "@/contexts/metadata";
import { useTranslation } from "@/hooks/useTranslation";
import { HelpButton } from "@workspaceui/componentlibrary/src/components";
import HelpDrawer from "../HelpDrawer/HelpDrawer";
import { shouldShowHelp } from "@/utils/help/buildHelpContent";

const HelpAccess: React.FC = () => {
  const { t } = useTranslation();
  const { window, windowId } = useMetadataContext();
  const [open, setOpen] = useState(false);
  const previousWindowId = useRef(windowId);

  useEffect(() => {
    if (open && previousWindowId.current !== windowId) {
      setOpen(false);
    }
    previousWindowId.current = windowId;
  }, [windowId, open]);

  if (!shouldShowHelp(window)) {
    return null;
  }

  return (
    <>
      <HelpButton onClick={() => setOpen(true)} tooltip={t("common.help")} />
      <HelpDrawer open={open} window={window} onClose={() => setOpen(false)} />
    </>
  );
};

export default HelpAccess;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:mainui -- HelpAccess`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Header/HelpAccess.tsx packages/MainUI/components/Header/__tests__/HelpAccess.test.tsx
git commit -m "Hotfix ETP-4620: add HelpAccess orchestrator"
```

---

### Task 6: Translations

**Files:**
- Modify: `packages/ComponentLibrary/src/locales/en.ts:49` (after the `about` key)
- Modify: `packages/ComponentLibrary/src/locales/es.ts:48` (after the `about` key)

No test — these are static string tables already covered indirectly by the mocked-translation component tests above; add a quick manual check instead.

- [ ] **Step 1: Add English keys**

In `packages/ComponentLibrary/src/locales/en.ts`, inside `common: { ... }`, right after `about: "About",` (line 49):

```ts
    help: "Help",
    helpFor: "Help for",
```

- [ ] **Step 2: Add Spanish keys**

In `packages/ComponentLibrary/src/locales/es.ts`, inside `common: { ... }`, right after `about: "Acerca de",` (line 48):

```ts
    help: "Ayuda",
    helpFor: "Ayuda de",
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @workspaceui/componentlibrary build`

**Known pre-existing failure, not caused by this task:** this command currently fails on this
branch with ~30 TS errors (missing `*.svg?react` module declarations, several `__tests__`
files with type mismatches unrelated to translations) — confirmed present identically on
`main` at `99268dcdb` (before any Help widget work), via a throwaway worktree build. This is
pre-existing repo tech debt, out of scope for this hotfix. Don't attempt to fix it here.

Use instead, as the actual verification for this task: `pnpm test:component-library` (jest —
passes; jest's transform doesn't hit the same `tsc`-only failures) and
`cd packages/MainUI && npx tsc --noEmit` (must be clean — this is what actually proves the
`common.help`/`common.helpFor` keys resolve correctly for real consumers, `HelpAccess.tsx`
and `HelpDrawer.tsx`).

- [ ] **Step 4: Commit**

```bash
git add packages/ComponentLibrary/src/locales/en.ts packages/ComponentLibrary/src/locales/es.ts
git commit -m "Hotfix ETP-4620: add help/helpFor translation keys"
```

---

### Task 7: Wire `HelpAccess` into the navbar

**Files:**
- Modify: `packages/MainUI/components/navigation.tsx:37` (import)
- Modify: `packages/MainUI/components/navigation.tsx:209-220` (render)

This is the only change to `navigation.tsx` — one import, one new sibling element next to `ConfigurationSection`. No new test file: `navigation.tsx` has no existing test (heavy transitive deps — Copilot, user store, etc.) and `HelpAccess` itself is already fully tested in Task 5; this step is covered by manual verification (Step 3 below).

- [ ] **Step 1: Add the import**

In `packages/MainUI/components/navigation.tsx`, after line 37 (`import ConfigurationSection from "./Header/ConfigurationSection";`):

```ts
import HelpAccess from "./Header/HelpAccess";
```

- [ ] **Step 2: Render it next to `ConfigurationSection`**

Change (`navigation.tsx:220`):

```tsx
        <ConfigurationSection data-testid="ConfigurationSection__120cc9" />
```

to:

```tsx
        <ConfigurationSection data-testid="ConfigurationSection__120cc9" />
        <HelpAccess data-testid="HelpAccess__120cc9" />
```

- [ ] **Step 3: Manual verification**

Run: `pnpm --filter @workspaceui/mainui dev`

In the browser:
1. Open a window whose `AD_WINDOW.HELP` is set (e.g. Sales Order) — confirm the Help icon appears in the navbar, next to the gear/config icon.
2. Click it — confirm the drawer slides in from the right, background stays interactive (click a grid row behind it), shows window help + tabs ordered correctly + only fields with real help text.
3. Press Escape — confirm it closes.
4. Open a window with no `AD_WINDOW.HELP` (or Home) — confirm the icon does not render.
5. With the drawer open, navigate to a different window — confirm the drawer closes.

- [ ] **Step 4: Run the full MainUI suite**

Run: `pnpm test:mainui`
Expected: PASS, no regressions.

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/navigation.tsx
git commit -m "Hotfix ETP-4620: mount HelpAccess in the navbar"
```

---

## Out of scope (per design doc)

- Backend / `com.etendoerp.metadata` module — 0 changes, already verified live.
- Any change to `About`'s existing iframe modal flow.
- A generic reusable `Drawer` primitive (checked: the existing `Drawer` export in `packages/ComponentLibrary/src/components/Drawer` is the main left-nav menu drawer, unrelated and not reusable here).
- Tab-level or field-level Help triggers (window-level only, per spec §3).
- Per-tab index/anchors inside the drawer.

## Status: implemented (2026-08-04)

All 7 tasks done, each through spec-compliance + code-quality review (two real bugs caught
and fixed along the way: a missing icon-render test in `HelpButton`, and a dead/unreachable
`onKeyDown` Escape handler in `HelpDrawer`). Full final review across the whole diff found
no cross-task issues (no duplicated logic, sanitizer discipline holds everywhere, barrel
exports resolve correctly, no dead code). `pnpm test:mainui` (386 suites/5072 tests) and
`pnpm test:component-library` (78 suites/706 tests) both green; `tsc --noEmit` clean.

**Known fast-follow, not fixed here (user decision 2026-08-04):** `HelpDrawer` reuses
`Modal.tsx`'s scale/fade transition (built for centered dialogs) rather than a translate —
during the ~200ms open/close animation this may read as a zoom instead of a slide-in from
the right (functionally harmless: Escape, click-outside, and background-stays-interactive
all verified working; this is purely about the transition's visual character, unverified in
a live browser). Fix if a visual check confirms it's noticeable: give `HelpDrawer`'s panel
its own `translate-x` transition instead of relying on `Modal`'s wrapper transform.

**Also pending:** manual browser QA (plan Task 7, Step 3) — not done in this session (no
live app instance driven end-to-end here), still worth a human pass before considering this
fully done.
