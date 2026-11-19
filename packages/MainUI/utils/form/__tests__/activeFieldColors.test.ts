import { ACTIVE_ICON_COLOR, IDLE_ICON_COLOR, fieldIconColor } from "../activeFieldColors";

describe("fieldIconColor", () => {
  it("follows the text color of a focused field, so it changes with the theme", () => {
    expect(fieldIconColor(true)).toBe(ACTIVE_ICON_COLOR);
    expect(ACTIVE_ICON_COLOR).toBe("text-(--ui-field-focus-fg)");
  });

  it("uses the idle token at rest", () => {
    expect(fieldIconColor(false)).toBe(IDLE_ICON_COLOR);
  });

  it("uses no fixed hex color", () => {
    expect(`${ACTIVE_ICON_COLOR} ${IDLE_ICON_COLOR}`).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
