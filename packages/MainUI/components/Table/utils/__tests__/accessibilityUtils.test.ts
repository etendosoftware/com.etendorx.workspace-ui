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
    expect(polite?.textContent).toContain("Unsaved");
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

  it("calling destroy twice does not throw", () => {
    announcer.destroy();
    expect(() => announcer.destroy()).not.toThrow();
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
  describe("editableCell", () => {
    it("generates correct aria attributes", () => {
      const attrs = generateAriaAttributes.editableCell("name", "Name", false, true, 0, 1);
      expect(attrs["aria-label"]).toBe("Name for row 1");
      expect(attrs["aria-required"]).toBe(true);
      expect(attrs["aria-invalid"]).toBe(false);
      expect(attrs.role).toBe("gridcell");
      expect(attrs["aria-rowindex"]).toBe(1);
      expect(attrs["aria-colindex"]).toBe(2);
    });

    it("sets aria-describedby when there is an error", () => {
      const attrs = generateAriaAttributes.editableCell("amount", "Amount", true, false, 2, 0);
      expect(attrs["aria-describedby"]).toBe("amount-error");
      expect(attrs["aria-invalid"]).toBe(true);
    });

    it("omits aria-describedby when no error", () => {
      const attrs = generateAriaAttributes.editableCell("amount", "Amount", false, false, 0, 0);
      expect(attrs["aria-describedby"]).toBeUndefined();
    });
  });

  describe("actionButton", () => {
    it("generates correct attributes for enabled button", () => {
      const attrs = generateAriaAttributes.actionButton("Delete", "row-1");
      expect(attrs["aria-label"]).toBe("Delete row row-1");
      expect(attrs["aria-disabled"]).toBe(false);
      expect(attrs.tabIndex).toBe(0);
      expect(attrs.role).toBe("button");
    });

    it("generates correct attributes for disabled button", () => {
      const attrs = generateAriaAttributes.actionButton("Edit", "row-2", true);
      expect(attrs["aria-disabled"]).toBe(true);
      expect(attrs.tabIndex).toBe(-1);
    });
  });

  describe("errorMessage", () => {
    it("generates correct attributes", () => {
      const attrs = generateAriaAttributes.errorMessage("email");
      expect(attrs.id).toBe("email-error");
      expect(attrs.role).toBe("alert");
      expect(attrs["aria-live"]).toBe("assertive");
    });
  });

  describe("editingRow", () => {
    it("includes 'with validation errors' when hasErrors is true", () => {
      const attrs = generateAriaAttributes.editingRow("row-1", true);
      expect(attrs["aria-label"]).toContain("with validation errors");
      expect(attrs["data-editing"]).toBe("true");
    });

    it("omits error text when hasErrors is false", () => {
      const attrs = generateAriaAttributes.editingRow("row-1", false);
      expect(attrs["aria-label"]).not.toContain("with validation errors");
    });
  });

  describe("tableContainer", () => {
    it("generates correct attributes", () => {
      const attrs = generateAriaAttributes.tableContainer(50, 2);
      expect(attrs.role).toBe("grid");
      expect(attrs["aria-rowcount"]).toBe(50);
      expect(attrs["aria-label"]).toContain("50 rows");
      expect(attrs["aria-label"]).toContain("2 currently being edited");
    });
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

  it("isFocusable - disabled button is not focusable", () => {
    const btn = document.createElement("button");
    btn.disabled = true;
    expect(keyboardAccessibility.isFocusable(btn)).toBe(false);
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

  it("getFocusableElements returns empty array for container with no focusable children", () => {
    const container = document.createElement("div");
    container.appendChild(document.createElement("span"));
    expect(keyboardAccessibility.getFocusableElements(container)).toHaveLength(0);
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
  it("getLuminance returns 0 for black", () => {
    expect(colorContrast.getLuminance(0, 0, 0)).toBeCloseTo(0);
  });

  it("getLuminance returns ~1 for white", () => {
    expect(colorContrast.getLuminance(255, 255, 255)).toBeCloseTo(1, 1);
  });

  it("getContrastRatio returns ~21 for black on white", () => {
    const ratio = colorContrast.getContrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("getContrastRatio returns 1 for same color", () => {
    const ratio = colorContrast.getContrastRatio([128, 128, 128], [128, 128, 128]);
    expect(ratio).toBeCloseTo(1, 1);
  });

  it("meetsWCAGAA returns true for black on white", () => {
    expect(colorContrast.meetsWCAGAA([0, 0, 0], [255, 255, 255])).toBe(true);
  });

  it("meetsWCAGAA returns false for low contrast", () => {
    expect(colorContrast.meetsWCAGAA([200, 200, 200], [255, 255, 255])).toBe(false);
  });

  it("meetsWCAGAAA returns true for black on white", () => {
    expect(colorContrast.meetsWCAGAAA([0, 0, 0], [255, 255, 255])).toBe(true);
  });

  it("meetsWCAGAAA returns false for low contrast", () => {
    expect(colorContrast.meetsWCAGAAA([150, 150, 150], [255, 255, 255])).toBe(false);
  });
});

describe("accessibilityTesting", () => {
  describe("hasProperLabeling", () => {
    it("returns true when aria-label is present", () => {
      const el = document.createElement("button");
      el.setAttribute("aria-label", "Close");
      expect(accessibilityTesting.hasProperLabeling(el)).toBe(true);
    });

    it("returns false when no labeling attributes", () => {
      const el = document.createElement("button");
      expect(accessibilityTesting.hasProperLabeling(el)).toBe(false);
    });

    it("returns true when title is present", () => {
      const el = document.createElement("button");
      el.setAttribute("title", "Submit");
      expect(accessibilityTesting.hasProperLabeling(el)).toBe(true);
    });

    it("returns true when aria-labelledby is present", () => {
      const el = document.createElement("input");
      el.setAttribute("aria-labelledby", "label-id");
      expect(accessibilityTesting.hasProperLabeling(el)).toBe(true);
    });
  });

  describe("hasProperErrorAssociation", () => {
    it("returns true when element is not invalid", () => {
      const el = document.createElement("input");
      expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(true);
    });

    it("returns false when invalid but no aria-describedby", () => {
      const el = document.createElement("input");
      el.setAttribute("aria-invalid", "true");
      expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(false);
    });

    it("returns false when invalid and error element is empty", () => {
      const el = document.createElement("input");
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "my-error");
      const errorEl = document.createElement("span");
      errorEl.id = "my-error";
      document.body.appendChild(errorEl);
      expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(false);
      errorEl.remove();
    });

    it("returns true when invalid and error element has content", () => {
      const el = document.createElement("input");
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "my-error2");
      const errorEl = document.createElement("span");
      errorEl.id = "my-error2";
      errorEl.textContent = "Required field";
      document.body.appendChild(errorEl);
      expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(true);
      errorEl.remove();
    });

    it("returns false for invalid with missing referenced element", () => {
      const el = document.createElement("input");
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "nonexistent-error");
      expect(accessibilityTesting.hasProperErrorAssociation(el)).toBe(false);
    });
  });

  describe("validateInlineEditingAccessibility", () => {
    it("returns issues for empty container", () => {
      const container = document.createElement("div");
      const issues = accessibilityTesting.validateInlineEditingAccessibility(container);
      expect(issues).toContain("No gridcell roles found for editable cells");
    });

    it("returns issues for unlabeled inputs", () => {
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
});
