import { captureWindowLayout, getLayoutSplitHeights, resolveActiveLevels } from "../layout";

describe("savedViews/layout", () => {
  describe("captureWindowLayout", () => {
    it("captures the heights and the tab levels shown", () => {
      expect(captureWindowLayout({ activeLevels: [0, 1], splitHeights: { 1: 35 } })).toEqual({
        splitHeights: { 1: 35 },
        activeLevels: [0, 1],
      });
    });

    it("captures empty heights when the split was never resized", () => {
      expect(captureWindowLayout({ activeLevels: [1] })).toEqual({ splitHeights: {}, activeLevels: [1] });
    });
  });

  describe("getLayoutSplitHeights", () => {
    it("converts the stored keys to tab levels", () => {
      expect(getLayoutSplitHeights({ splitHeights: { "1": 30, "2": 60 } })).toEqual({ 1: 30, 2: 60 });
    });

    it("returns the default heights for a view without layout", () => {
      expect(getLayoutSplitHeights()).toEqual({});
    });
  });

  describe("resolveActiveLevels", () => {
    const layoutWith = (activeLevels?: number[]) => ({ splitHeights: {}, activeLevels });

    it.each([
      ["reopens the child panel of the split", [0], layoutWith([0, 1]), [0, 1]],
      ["maximizes an open child level", [0, 1], layoutWith([1]), [1]],
      ["collapses the children to the parent level", [0, 1], layoutWith([0]), [0]],
      ["restores a deeper split once its parent level is open", [0, 1], layoutWith([1, 2]), [1, 2]],
      ["restores a shallower split from a deeper level", [2, 3], layoutWith([0, 1]), [0, 1]],
      ["skips levels whose parent level is not open", [0], layoutWith([1, 2]), null],
      ["keeps the levels that already match", [0, 1], layoutWith([0, 1]), null],
      ["restores the split of a maximized child without saved levels", [2], layoutWith(), [1, 2]],
      ["restores the split for a view without layout", [1], undefined, [0, 1]],
      ["keeps parent and child shown without saved levels", [0, 1], undefined, null],
      ["keeps the header level alone without saved levels", [0], undefined, null],
    ])("%s", (_label, activeLevels, layout, expected) => {
      expect(resolveActiveLevels(activeLevels, layout)).toEqual(expected);
    });
  });
});
