import {
  ScreenReaderAnnouncer,
  getScreenReaderAnnouncer,
  generateAriaAttributes,
  keyboardAccessibility,
  colorContrast,
  accessibilityTesting,
} from "../accessibilityUtils";

jest.useFakeTimers();

describe("ScreenReaderAnnouncer", () => {
  let announcer: ScreenReaderAnnouncer;

  beforeEach(() => {
    announcer = new ScreenReaderAnnouncer();
  });

  afterEach(() => {
    try {
      announcer.destroy();
    } catch {}
  });

  it("creates live regions in document body on construction", () => {
    const regions = document.querySelectorAll("[aria-live]");
    expect(regions.length).toBeGreaterThanOrEqual(2);
  });

  it("announce sets textContent after timeout", () => {
    announcer.announce("Hello screen reader");
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toBe("Hello screen reader");
  });

  it("announce with assertive priority uses assertive region", () => {
    announcer.announce("Urgent!", "assertive");
    jest.advanceTimersByTime(200);
    const assertive = document.querySelector("[aria-live='assertive']");
    expect(assertive?.textContent).toBe("Urgent!");
  });

  it("announce ignores empty/whitespace messages", () => {
    announcer.announce("   ");
    jest.advanceTimersByTime(200);
    // No update should occur for whitespace-only messages
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toBe("");
  });

  it("announceEditingStateChange - editing true", () => {
    announcer.announceEditingStateChange("row1", true, 3);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("row1");
    expect(polite?.textContent).toContain("3 editable fields");
  });

  it("announceEditingStateChange - editing false", () => {
    announcer.announceEditingStateChange("row1", false, 3);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("no longer in edit mode");
  });

  it("announceValidationErrors uses assertive region", () => {
    announcer.announceValidationErrors("fieldA", "required");
    jest.advanceTimersByTime(200);
    const assertive = document.querySelector("[aria-live='assertive']");
    expect(assertive?.textContent).toContain("fieldA");
    expect(assertive?.textContent).toContain("required");
  });

  it("announceSaveOperation - success new row", () => {
    announcer.announceSaveOperation("row1", true, true);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("created");
  });

  it("announceSaveOperation - success updated row", () => {
    announcer.announceSaveOperation("row1", true, false);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("updated");
  });

  it("announceSaveOperation - failure", () => {
    announcer.announceSaveOperation("row1", false, false);
    jest.advanceTimersByTime(200);
    const assertive = document.querySelector("[aria-live='assertive']");
    expect(assertive?.textContent).toContain("Failed to save");
  });

  it("announceNavigation", () => {
    announcer.announceNavigation("A1", "B2");
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("A1");
    expect(polite?.textContent).toContain("B2");
  });

  it("announceRowInsertion", () => {
    announcer.announceRowInsertion("row42");
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("row42");
  });

  it("announceRowCancellation - with unsaved changes", () => {
    announcer.announceRowCancellation("row1", true);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("Unsaved changes");
  });

  it("announceRowCancellation - without unsaved changes", () => {
    announcer.announceRowCancellation("row1", false);
    jest.advanceTimersByTime(200);
    const polite = document.querySelector("[aria-live='polite']");
    expect(polite?.textContent).toContain("cancelled");
  });

  it("destroy removes live regions", () => {
    const before = document.querySelectorAll("[aria-live]").length;
    announcer.destroy();
    const after = document.querySelectorAll("[aria-live]").length;
    expect(after).toBe(before - 2);
  });
});

describe("getScreenReaderAnnouncer", () => {
  it("returns same instance on multiple calls", () => {
    const a1 = getScreenReaderAnnouncer();
    const a2 = getScreenReaderAnnouncer();
    expect(a1).toBe(a2);
  });
});

describe("generateAriaAttributes", () => {
  it("editableCell generates correct attributes", () => {
    const attrs = generateAriaAttributes.editableCell("name", "Name", false, true, 2, 1);
    expect(attrs["aria-label"]).toBe("Name for row 3");
    expect(attrs["aria-required"]).toBe(true);
    expect(attrs["aria-invalid"]).toBe(false);
    expect(attrs["role"]).toBe("gridcell");
    expect(attrs["aria-rowindex"]).toBe(3);
    expect(attrs["aria-colindex"]).toBe(2);
    expect(attrs["aria-describedby"]).toBeUndefined();
  });

  it("editableCell with error includes aria-describedby", () => {
    const attrs = generateAriaAttributes.editableCell("name", "Name", true, false, 0, 0);
    expect(attrs["aria-describedby"]).toBe("name-error");
    expect(attrs["aria-invalid"]).toBe(true);
  });

  it("actionButton generates correct attributes", () => {
    const attrs = generateAriaAttributes.actionButton("Edit", "row1");
    expect(attrs["aria-label"]).toBe("Edit row row1");
    expect(attrs["aria-disabled"]).toBe(false);
    expect(attrs["tabIndex"]).toBe(0);
    expect(attrs["role"]).toBe("button");
  });

  it("actionButton disabled sets tabIndex -1", () => {
    const attrs = generateAriaAttributes.actionButton("Delete", "row1", true);
    expect(attrs["tabIndex"]).toBe(-1);
    expect(attrs["aria-disabled"]).toBe(true);
  });

  it("errorMessage generates correct attributes", () => {
    const attrs = generateAriaAttributes.errorMessage("email");
    expect(attrs.id).toBe("email-error");
    expect(attrs.role).toBe("alert");
    expect(attrs["aria-live"]).toBe("assertive");
  });

  it("editingRow with errors", () => {
    const attrs = generateAriaAttributes.editingRow("row1", true);
    expect(attrs["aria-label"]).toContain("with validation errors");
    expect(attrs["data-editing"]).toBe("true");
  });

  it("editingRow without errors", () => {
    const attrs = generateAriaAttributes.editingRow("row1", false);
    expect(attrs["aria-label"]).not.toContain("validation errors");
  });

  it("tableContainer generates correct attributes", () => {
    const attrs = generateAriaAttributes.tableContainer(100, 2);
    expect(attrs.role).toBe("grid");
    expect(attrs["aria-rowcount"]).toBe(100);
    expect(attrs["aria-label"]).toContain("100 rows");
    expect(attrs["aria-label"]).toContain("2 currently being edited");
  });
});

describe("keyboardAccessibility", () => {
  it("isFocusable - input is focusable", () => {
    const input = document.createElement("input");
    expect(keyboardAccessibility.isFocusable(input)).toBe(true);
  });

  it("isFocusable - disabled input is not focusable", () => {
    const input = document.createElement("input");
    input.disabled = true;
    expect(keyboardAccessibility.isFocusable(input)).toBe(false);
  });

  it("isFocusable - button is focusable", () => {
    const btn = document.createElement("button");
    expect(keyboardAccessibility.isFocusable(btn)).toBe(true);
  });

  it("isFocusable - div is not focusable", () => {
    const div = document.createElement("div");
    expect(keyboardAccessibility.isFocusable(div)).toBe(false);
  });

  it("isFocusable - anchor with href is focusable", () => {
    const a = document.createElement("a");
    a.href = "#";
    expect(keyboardAccessibility.isFocusable(a)).toBe(true);
  });

  it("getFocusableElements returns focusable elements in container", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    const button = document.createElement("button");
    const div = document.createElement("div");
    container.appendChild(input);
    container.appendChild(button);
    container.appendChild(div);
    const focusable = keyboardAccessibility.getFocusableElements(container);
    expect(focusable).toContain(input);
    expect(focusable).toContain(button);
    expect(focusable).not.toContain(div);
  });

  it("trapFocus returns false for non-Tab key", () => {
    const container = document.createElement("div");
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    expect(keyboardAccessibility.trapFocus(container, event)).toBe(false);
  });

  it("trapFocus returns false when no focusable elements", () => {
    const container = document.createElement("div");
    const event = new KeyboardEvent("keydown", { key: "Tab" });
    expect(keyboardAccessibility.trapFocus(container, event)).toBe(false);
  });

  it("ensureVisible removes sr-only classes and styles", () => {
    const el = document.createElement("div");
    el.classList.add("sr-only");
    el.style.position = "absolute";
    keyboardAccessibility.ensureVisible(el);
    expect(el.classList.contains("sr-only")).toBe(false);
    expect(el.style.position).toBe("");
  });
});

describe("colorContrast", () => {
  it("getLuminance for white is ~1", () => {
    const lum = colorContrast.getLuminance(255, 255, 255);
    expect(lum).toBeCloseTo(1.0, 1);
  });

  it("getLuminance for black is 0", () => {
    const lum = colorContrast.getLuminance(0, 0, 0);
    expect(lum).toBe(0);
  });

  it("getContrastRatio black on white is ~21", () => {
    const ratio = colorContrast.getContrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("meetsWCAGAA - black on white passes", () => {
    expect(colorContrast.meetsWCAGAA([0, 0, 0], [255, 255, 255])).toBe(true);
  });

  it("meetsWCAGAA - similar colors fail", () => {
    expect(colorContrast.meetsWCAGAA([200, 200, 200], [220, 220, 220])).toBe(false);
  });

  it("meetsWCAGAAA - black on white passes", () => {
    expect(colorContrast.meetsWCAGAAA([0, 0, 0], [255, 255, 255])).toBe(true);
  });

  it("meetsWCAGAAA - low contrast fails", () => {
    expect(colorContrast.meetsWCAGAAA([100, 100, 100], [150, 150, 150])).toBe(false);
  });
});

describe("accessibilityTesting", () => {
  it("hasProperLabeling - aria-label present", () => {
    const el = document.createElement("div");
    el.setAttribute("aria-label", "test");
    expect(accessibilityTesting.hasProperLabeling(el)).toBe(true);
  });

  it("hasProperLabeling - no label", () => {
    const el = document.createElement("div");
    expect(accessibilityTesting.hasProperLabeling(el)).toBe(false);
  });

  it("hasProperLabeling - title present", () => {
    const el = document.createElement("div");
    el.setAttribute("title", "test");
    expect(accessibilityTesting.hasProperLabeling(el)).toBe(true);
  });

  it("hasProperErrorAssociation - valid element without error", () => {
    const el = document.createElement("input");
    expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(true);
  });

  it("hasProperErrorAssociation - invalid without describedby", () => {
    const el = document.createElement("input");
    el.setAttribute("aria-invalid", "true");
    expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(false);
  });

  it("hasProperErrorAssociation - invalid with missing referenced element", () => {
    const el = document.createElement("input");
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", "nonexistent-error");
    expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(false);
  });

  it("validateInlineEditingAccessibility returns issues for empty container", () => {
    const container = document.createElement("div");
    const issues = accessibilityTesting.validateInlineEditingAccessibility(container);
    expect(issues).toContain("No gridcell roles found for editable cells");
  });

  it("validateInlineEditingAccessibility returns issues for unlabeled inputs", () => {
    const container = document.createElement("div");
    const cell = document.createElement("div");
    cell.setAttribute("role", "gridcell");
    const input = document.createElement("input");
    container.appendChild(cell);
    container.appendChild(input);
    const issues = accessibilityTesting.validateInlineEditingAccessibility(container);
    expect(issues.some((i) => i.includes("labeling"))).toBe(true);
  });
});
