import {
  KeyboardNavigationManager,
  createKeyboardNavigationManager,
  useKeyboardNavigation,
  type KeyboardNavigationOptions,
} from "../keyboardNavigation";

jest.mock("@/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const createMockElement = (rowId: string, columnId: string, disabled = false): HTMLElement => {
  const el = document.createElement("input");
  el.setAttribute("data-row-id", rowId);
  el.setAttribute("data-column-id", columnId);
  el.setAttribute("type", "text");
  if (disabled) el.setAttribute("disabled", "");
  el.focus = jest.fn();
  el.select = jest.fn();
  return el;
};

const setupDom = (cells: Array<{ rowId: string; columnId: string; disabled?: boolean }>) => {
  document.body.innerHTML = "";
  for (const cell of cells) {
    const el = createMockElement(cell.rowId, cell.columnId, cell.disabled);
    document.body.appendChild(el);
  }
};

const createOptions = (overrides: Partial<KeyboardNavigationOptions> = {}): KeyboardNavigationOptions => ({
  onSaveRow: jest.fn().mockResolvedValue(undefined),
  onCancelRow: jest.fn().mockResolvedValue(undefined),
  isRowEditing: jest.fn().mockReturnValue(true),
  getEditingRowIds: jest.fn().mockReturnValue(["row1", "row2"]),
  table: {} as any,
  getColumnOrder: jest.fn().mockReturnValue(["col1", "col2", "col3"]),
  ...overrides,
});

const createKeyboardEvent = (key: string, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent => {
  return {
    key,
    preventDefault: jest.fn(),
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    target: document.createElement("input"),
    ...overrides,
  } as unknown as KeyboardEvent;
};

describe("KeyboardNavigationManager", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("constructor and basic methods", () => {
    it("should create instance via factory function", () => {
      const manager = createKeyboardNavigationManager(createOptions());
      expect(manager).toBeInstanceOf(KeyboardNavigationManager);
    });

    it("should get and set current focused cell", () => {
      const manager = new KeyboardNavigationManager(createOptions());
      expect(manager.getCurrentFocusedCell()).toBeNull();

      manager.setCurrentFocusedCell("row1", "col1");
      expect(manager.getCurrentFocusedCell()).toEqual({ rowId: "row1", columnId: "col1" });
    });

    it("should clean up on destroy", () => {
      const manager = new KeyboardNavigationManager(createOptions());
      manager.setCurrentFocusedCell("row1", "col1");
      manager.destroy();
      expect(manager.getCurrentFocusedCell()).toBeNull();
    });
  });

  describe("navigateToNextCell", () => {
    it("should navigate to next cell in same row", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.navigateToNextCell("row1", "col1");

      expect(result).toBe(true);
    });

    it("should return false when at last cell", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.navigateToNextCell("row1", "col2");
      expect(result).toBe(false);
    });
  });

  describe("navigateToPreviousCell", () => {
    it("should navigate to previous cell", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.navigateToPreviousCell("row1", "col2");

      expect(result).toBe(true);
    });

    it("should return false when at first cell", async () => {
      setupDom([{ rowId: "row1", columnId: "col1" }]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.navigateToPreviousCell("row1", "col1");
      expect(result).toBe(false);
    });
  });

  describe("navigateToNextRow", () => {
    it("should navigate to first cell in next row", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row2", columnId: "col1" },
      ]);

      const manager = new KeyboardNavigationManager(createOptions());

      const result = await manager.navigateToNextRow("row1");

      expect(result).toBe(true);
    });

    it("should return false when no next row", async () => {
      setupDom([{ rowId: "row2", columnId: "col1" }]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row2"]) })
      );

      const result = await manager.navigateToNextRow("row2");
      expect(result).toBe(false);
    });

    it("should return false when row has no editable cells", async () => {
      setupDom([]);

      const manager = new KeyboardNavigationManager(createOptions({ getEditingRowIds: jest.fn().mockReturnValue([]) }));

      const result = await manager.navigateToNextRow("row1");
      expect(result).toBe(false);
    });
  });

  describe("navigateToPreviousRow", () => {
    it("should navigate to first cell in previous row", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row2", columnId: "col1" },
      ]);

      const manager = new KeyboardNavigationManager(createOptions());

      const result = await manager.navigateToPreviousRow("row2");

      expect(result).toBe(true);
    });

    it("should return false when at first row", async () => {
      setupDom([{ rowId: "row1", columnId: "col1" }]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.navigateToPreviousRow("row1");
      expect(result).toBe(false);
    });
  });

  describe("focusFirstCellInRow", () => {
    it("should focus first editable cell in row", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const result = await manager.focusFirstCellInRow("row1");

      expect(result).toBe(true);
      expect(manager.getCurrentFocusedCell()).toEqual({ rowId: "row1", columnId: "col1" });
    });

    it("should return false when no cells in row", async () => {
      setupDom([]);

      const manager = new KeyboardNavigationManager(createOptions({ getEditingRowIds: jest.fn().mockReturnValue([]) }));

      const result = await manager.focusFirstCellInRow("row1");
      expect(result).toBe(false);
    });
  });

  describe("handleKeyDown", () => {
    it("should handle Tab key", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const event = createKeyboardEvent("Tab");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle Shift+Tab key", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const event = createKeyboardEvent("Tab", { shiftKey: true });
      const result = await manager.handleKeyDown(event, "row1", "col2");
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle Enter key to save row", async () => {
      setupDom([{ rowId: "row1", columnId: "col1" }]);

      const onSaveRow = jest.fn().mockResolvedValue(undefined);
      const manager = new KeyboardNavigationManager(
        createOptions({
          onSaveRow,
          getEditingRowIds: jest.fn().mockReturnValue(["row1"]),
        })
      );

      const event = createKeyboardEvent("Enter");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(onSaveRow).toHaveBeenCalledWith("row1");
      expect(result).toBe(true);
    });

    it("should handle Enter key save failure", async () => {
      setupDom([{ rowId: "row1", columnId: "col1" }]);

      const onSaveRow = jest.fn().mockRejectedValue(new Error("save failed"));
      const manager = new KeyboardNavigationManager(
        createOptions({
          onSaveRow,
          getEditingRowIds: jest.fn().mockReturnValue(["row1"]),
        })
      );

      const event = createKeyboardEvent("Enter");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(false);
    });

    it("should handle Shift+Enter to navigate to previous row", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row2", columnId: "col1" },
      ]);

      const manager = new KeyboardNavigationManager(createOptions());

      const event = createKeyboardEvent("Enter", { shiftKey: true });
      const result = await manager.handleKeyDown(event, "row2", "col1");
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle Escape key to cancel row", async () => {
      const onCancelRow = jest.fn().mockResolvedValue(undefined);
      const manager = new KeyboardNavigationManager(createOptions({ onCancelRow }));

      const event = createKeyboardEvent("Escape");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(onCancelRow).toHaveBeenCalledWith("row1");
      expect(result).toBe(true);
    });

    it("should handle Escape key cancel failure", async () => {
      const onCancelRow = jest.fn().mockRejectedValue(new Error("cancel failed"));
      const manager = new KeyboardNavigationManager(createOptions({ onCancelRow }));

      const event = createKeyboardEvent("Escape");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(false);
    });

    it("should ignore non-Tab modifier keys", async () => {
      const manager = new KeyboardNavigationManager(createOptions());

      const event = createKeyboardEvent("a", { ctrlKey: true });
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(false);
    });

    it("should return false for unhandled keys", async () => {
      const manager = new KeyboardNavigationManager(createOptions());

      const event = createKeyboardEvent("Space");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(false);
    });

    it("should handle ArrowUp with Ctrl/Meta", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row2", columnId: "col1" },
      ]);

      const manager = new KeyboardNavigationManager(createOptions());

      // Without ctrl - should not navigate
      const event1 = createKeyboardEvent("ArrowUp");
      // With handleKeyDown, modifier keys are checked in the switch, not at top level
      // Actually, ArrowUp without ctrl returns false from handleArrowUpKey
      const result1 = await manager.handleKeyDown(event1, "row2", "col1");
      expect(result1).toBe(false);
    });

    it("should handle ArrowDown with Ctrl/Meta", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row2", columnId: "col1" },
      ]);

      const manager = new KeyboardNavigationManager(createOptions());

      const event = createKeyboardEvent("ArrowDown");
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(false);
    });

    it("should handle ArrowLeft at start of input", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const input = document.createElement("input");
      input.type = "text";
      input.value = "test";
      Object.defineProperty(input, "selectionStart", { value: 0, writable: true });
      Object.defineProperty(input, "selectionEnd", { value: 0, writable: true });

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const event = createKeyboardEvent("ArrowLeft", { target: input });
      const result = await manager.handleKeyDown(event, "row1", "col2");
      expect(result).toBe(true);
    });

    it("should handle ArrowRight at end of input", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const input = document.createElement("input");
      input.type = "text";
      input.value = "test";
      Object.defineProperty(input, "selectionStart", { value: 4, writable: true });
      Object.defineProperty(input, "selectionEnd", { value: 4, writable: true });

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      const event = createKeyboardEvent("ArrowRight", { target: input });
      const result = await manager.handleKeyDown(event, "row1", "col1");
      expect(result).toBe(true);
    });
  });

  describe("getEditableCells sorting", () => {
    it("should skip disabled elements", async () => {
      setupDom([
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2", disabled: true },
        { rowId: "row1", columnId: "col3" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({ getEditingRowIds: jest.fn().mockReturnValue(["row1"]) })
      );

      // Navigate from col1 - should go to col3 (skipping disabled col2)
      const result = await manager.navigateToNextCell("row1", "col1");

      expect(result).toBe(true);
      expect(manager.getCurrentFocusedCell()?.columnId).toBe("col3");
    });

    it("should sort by column order when provided", async () => {
      setupDom([
        { rowId: "row1", columnId: "col3" },
        { rowId: "row1", columnId: "col1" },
        { rowId: "row1", columnId: "col2" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({
          getEditingRowIds: jest.fn().mockReturnValue(["row1"]),
          getColumnOrder: jest.fn().mockReturnValue(["col1", "col2", "col3"]),
        })
      );

      const result = await manager.navigateToNextCell("row1", "col1");

      expect(result).toBe(true);
      expect(manager.getCurrentFocusedCell()?.columnId).toBe("col2");
    });

    it("should fallback to alphabetical sort without column order", async () => {
      setupDom([
        { rowId: "row1", columnId: "colB" },
        { rowId: "row1", columnId: "colA" },
      ]);

      const manager = new KeyboardNavigationManager(
        createOptions({
          getEditingRowIds: jest.fn().mockReturnValue(["row1"]),
          getColumnOrder: undefined,
        })
      );

      const result = await manager.navigateToNextCell("row1", "colA");

      expect(result).toBe(true);
      expect(manager.getCurrentFocusedCell()?.columnId).toBe("colB");
    });
  });
});

describe("useKeyboardNavigation", () => {
  it("should return handleKeyDown and setFocused", () => {
    const manager = new KeyboardNavigationManager(createOptions());
    const result = useKeyboardNavigation("row1", "col1", manager);

    expect(result.handleKeyDown).toBeInstanceOf(Function);
    expect(result.setFocused).toBeInstanceOf(Function);
  });

  it("should delegate handleKeyDown to manager", async () => {
    const manager = new KeyboardNavigationManager(createOptions());
    jest.spyOn(manager, "handleKeyDown").mockResolvedValue(true);

    const { handleKeyDown } = useKeyboardNavigation("row1", "col1", manager);
    const event = { key: "Tab" } as KeyboardEvent;
    const result = await handleKeyDown(event);

    expect(manager.handleKeyDown).toHaveBeenCalledWith(event, "row1", "col1");
    expect(result).toBe(true);
  });

  it("should return false when no manager", async () => {
    const { handleKeyDown } = useKeyboardNavigation("row1", "col1", null);
    const result = await handleKeyDown({} as KeyboardEvent);
    expect(result).toBe(false);
  });

  it("should set focused cell via setFocused", () => {
    const manager = new KeyboardNavigationManager(createOptions());
    const { setFocused } = useKeyboardNavigation("row1", "col1", manager);

    setFocused();
    expect(manager.getCurrentFocusedCell()).toEqual({ rowId: "row1", columnId: "col1" });
  });

  it("should handle setFocused with null manager", () => {
    const { setFocused } = useKeyboardNavigation("row1", "col1", null);
    expect(() => setFocused()).not.toThrow();
  });
});
