import {
  generateAriaAttributes,
  colorContrast,
  accessibilityTesting,
  ScreenReaderAnnouncer,
  getScreenReaderAnnouncer,
  keyboardAccessibility,
} from "../accessibilityUtils";
import "@testing-library/jest-dom";

// ---------------------------------------------------------------------------
// generateAriaAttributes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// colorContrast
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// accessibilityTesting
// ---------------------------------------------------------------------------
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
      document.body.removeChild(errorEl);
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
  });
});

// ---------------------------------------------------------------------------
// ScreenReaderAnnouncer
// ---------------------------------------------------------------------------
describe("ScreenReaderAnnouncer", () => {
  it("creates live regions on construction", () => {
    const announcer = new ScreenReaderAnnouncer();
    const polite = document.querySelector('[aria-live="polite"]');
    const assertive = document.querySelector('[aria-live="assertive"]');
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
    announcer.destroy();
  });

  it("announce sets region textContent after timeout", () => {
    jest.useFakeTimers();
    const announcer = new ScreenReaderAnnouncer();
    announcer.announce("Hello screen reader", "polite");
    jest.advanceTimersByTime(100);
    const polite = document.querySelector('[aria-live="polite"]');
    expect(polite?.textContent).toBe("Hello screen reader");
    announcer.destroy();
    jest.useRealTimers();
  });

  it("announce does nothing for empty/blank messages", () => {
    jest.useFakeTimers();
    const announcer = new ScreenReaderAnnouncer();
    announcer.announce("   ");
    jest.advanceTimersByTime(100);
    const polite = document.querySelector('[aria-live="polite"]');
    expect(polite?.textContent).toBe("");
    announcer.destroy();
    jest.useRealTimers();
  });

  it("announce assertive uses the assertive region", () => {
    jest.useFakeTimers();
    const announcer = new ScreenReaderAnnouncer();
    announcer.announce("Urgent!", "assertive");
    jest.advanceTimersByTime(100);
    const assertive = document.querySelector('[aria-live="assertive"]');
    expect(assertive?.textContent).toBe("Urgent!");
    announcer.destroy();
    jest.useRealTimers();
  });

  it("announceEditingStateChange — entering edit mode", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceEditingStateChange("row-1", true, 3);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("edit mode"), "polite");
    announcer.destroy();
  });

  it("announceEditingStateChange — leaving edit mode", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceEditingStateChange("row-1", false, 3);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("no longer"), "polite");
    announcer.destroy();
  });

  it("announceValidationErrors calls announce with assertive priority", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceValidationErrors("email", "Invalid format");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("email"), "assertive");
    announcer.destroy();
  });

  it("announceSaveOperation success for new row", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceSaveOperation("row-1", true, true);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("created"), "polite");
    announcer.destroy();
  });

  it("announceSaveOperation failure", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceSaveOperation("row-1", false, false);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Failed"), "assertive");
    announcer.destroy();
  });

  it("announceNavigation announces move message", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceNavigation("A1", "B1");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("A1"), "polite");
    announcer.destroy();
  });

  it("announceRowInsertion calls announce", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceRowInsertion("row-5");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("row-5"), "polite");
    announcer.destroy();
  });

  it("announceRowCancellation with unsaved changes", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceRowCancellation("row-3", true);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Unsaved"), "polite");
    announcer.destroy();
  });

  it("announceRowCancellation without unsaved changes", () => {
    const announcer = new ScreenReaderAnnouncer();
    const spy = jest.spyOn(announcer, "announce");
    announcer.announceRowCancellation("row-3", false);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("row-3"), "polite");
    announcer.destroy();
  });

  it("destroy removes live regions from DOM", () => {
    const announcer = new ScreenReaderAnnouncer();
    announcer.destroy();
    // After destroy, calling destroy again should not throw
    expect(() => announcer.destroy()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getScreenReaderAnnouncer (singleton)
// ---------------------------------------------------------------------------
describe("getScreenReaderAnnouncer", () => {
  it("returns the same instance on repeated calls", () => {
    const a = getScreenReaderAnnouncer();
    const b = getScreenReaderAnnouncer();
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// keyboardAccessibility
// ---------------------------------------------------------------------------
describe("keyboardAccessibility", () => {
  describe("isFocusable", () => {
    it("returns true for an enabled button", () => {
      const btn = document.createElement("button");
      expect(keyboardAccessibility.isFocusable(btn)).toBe(true);
    });

    it("returns false for a disabled button", () => {
      const btn = document.createElement("button");
      btn.disabled = true;
      expect(keyboardAccessibility.isFocusable(btn)).toBe(false);
    });

    it("returns true for an anchor with href", () => {
      const a = document.createElement("a");
      a.href = "#";
      expect(keyboardAccessibility.isFocusable(a)).toBe(true);
    });

    it("returns false for a plain div", () => {
      const div = document.createElement("div");
      expect(keyboardAccessibility.isFocusable(div)).toBe(false);
    });
  });

  describe("getFocusableElements", () => {
    it("finds all focusable children", () => {
      const container = document.createElement("div");
      const btn = document.createElement("button");
      const input = document.createElement("input");
      const div = document.createElement("div");
      container.appendChild(btn);
      container.appendChild(input);
      container.appendChild(div);
      const result = keyboardAccessibility.getFocusableElements(container);
      expect(result).toContain(btn);
      expect(result).toContain(input);
      expect(result).not.toContain(div);
    });

    it("returns empty array for container with no focusable children", () => {
      const container = document.createElement("div");
      container.appendChild(document.createElement("span"));
      expect(keyboardAccessibility.getFocusableElements(container)).toHaveLength(0);
    });
  });

  describe("trapFocus", () => {
    it("returns false for non-Tab keys", () => {
      const container = document.createElement("div");
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      expect(keyboardAccessibility.trapFocus(container, event)).toBe(false);
    });

    it("returns false when no focusable elements", () => {
      const container = document.createElement("div");
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      expect(keyboardAccessibility.trapFocus(container, event)).toBe(false);
    });
  });
});
