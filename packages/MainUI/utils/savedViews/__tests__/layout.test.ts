import { captureWindowLayout, getLayoutSplitHeights, resolveActiveLevels } from "../layout";

describe("savedViews/layout", () => {
  describe("captureWindowLayout", () => {
    it("captures the heights and the maximized level when a single level is shown", () => {
      expect(captureWindowLayout({ activeLevels: [1], splitHeights: { 1: 35 } })).toEqual({
        splitHeights: { 1: 35 },
        maximizedLevel: 1,
      });
    });

    it("has no maximized level when parent and child are shown", () => {
      expect(captureWindowLayout({ activeLevels: [0, 1] })).toEqual({ splitHeights: {} });
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
    it.each([
      ["maximizes an open child level", [0, 1], { splitHeights: {}, maximizedLevel: 1 }, [1]],
      ["collapses the children to the header level", [0, 1], { splitHeights: {}, maximizedLevel: 0 }, [0]],
      ["skips a level deeper than the open ones", [0], { splitHeights: {}, maximizedLevel: 1 }, null],
      ["keeps the levels already maximized", [1], { splitHeights: {}, maximizedLevel: 1 }, null],
      ["restores the split of a maximized child", [2], { splitHeights: {} }, [1, 2]],
      ["restores the split for a view without layout", [1], undefined, [0, 1]],
      ["keeps parent and child shown", [0, 1], undefined, null],
      ["keeps the header level alone", [0], undefined, null],
    ])("%s", (_label, activeLevels, layout, expected) => {
      expect(resolveActiveLevels(activeLevels, layout)).toEqual(expected);
    });
  });
});
