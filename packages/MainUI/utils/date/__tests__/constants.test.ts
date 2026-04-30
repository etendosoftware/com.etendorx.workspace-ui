import {
  getInputClassNames,
  getButtonClassNames,
  getLabelClassNames,
  getHelperTextClassNames,
  INPUT_FOCUS_CLASS,
  INPUT_HOVER_CLASS,
  INPUT_READONLY_CLASS,
  INPUT_ERROR_CLASS,
  BUTTON_FOCUSED_COLOR_CLASS,
  BUTTON_UNFOCUSED_COLOR_CLASS,
  LABEL_FOCUSED_COLOR_CLASS,
  LABEL_DEFAULT_COLOR_CLASS,
  LABEL_READONLY_COLOR_CLASS,
  HELPER_TEXT_ERROR_CLASS,
  HELPER_TEXT_DEFAULT_CLASS,
} from "../constants";

describe("date/constants", () => {
  describe("getInputClassNames", () => {
    it("should include focus class when focused and not readonly", () => {
      const result = getInputClassNames({ isFocused: true });
      expect(result).toContain(INPUT_FOCUS_CLASS);
    });

    it("should not include focus class when readonly even if focused", () => {
      const result = getInputClassNames({ isFocused: true, isReadOnly: true });
      expect(result).not.toContain(INPUT_FOCUS_CLASS);
    });

    it("should include hover class when not readonly", () => {
      const result = getInputClassNames({ isFocused: false });
      expect(result).toContain(INPUT_HOVER_CLASS);
    });

    it("should not include hover class when readonly", () => {
      const result = getInputClassNames({ isFocused: false, isReadOnly: true });
      expect(result).not.toContain(INPUT_HOVER_CLASS);
    });

    it("should include readonly class when readonly", () => {
      const result = getInputClassNames({ isFocused: false, isReadOnly: true });
      expect(result).toContain(INPUT_READONLY_CLASS);
    });

    it("should include error class when hasError", () => {
      const result = getInputClassNames({ isFocused: false, hasError: true });
      expect(result).toContain(INPUT_ERROR_CLASS);
    });
  });

  describe("getButtonClassNames", () => {
    it("should use focused color when focused", () => {
      const result = getButtonClassNames({ isFocused: true });
      expect(result).toContain(BUTTON_FOCUSED_COLOR_CLASS);
    });

    it("should use unfocused color when not focused", () => {
      const result = getButtonClassNames({ isFocused: false });
      expect(result).toContain(BUTTON_UNFOCUSED_COLOR_CLASS);
    });
  });

  describe("getLabelClassNames", () => {
    it("should use focused color when focused and not readonly", () => {
      const result = getLabelClassNames({ isFocused: true });
      expect(result).toContain(LABEL_FOCUSED_COLOR_CLASS);
    });

    it("should use readonly color when readonly", () => {
      const result = getLabelClassNames({ isFocused: false, isReadOnly: true });
      expect(result).toContain(LABEL_READONLY_COLOR_CLASS);
    });

    it("should use readonly color when readonly even if focused", () => {
      const result = getLabelClassNames({ isFocused: true, isReadOnly: true });
      expect(result).toContain(LABEL_READONLY_COLOR_CLASS);
    });

    it("should use default color when not focused and not readonly", () => {
      const result = getLabelClassNames({ isFocused: false });
      expect(result).toContain(LABEL_DEFAULT_COLOR_CLASS);
    });
  });

  describe("getHelperTextClassNames", () => {
    it("should use error class when hasError", () => {
      const result = getHelperTextClassNames({ hasError: true });
      expect(result).toContain(HELPER_TEXT_ERROR_CLASS);
    });

    it("should use default class when no error", () => {
      const result = getHelperTextClassNames({ hasError: false });
      expect(result).toContain(HELPER_TEXT_DEFAULT_CLASS);
    });

    it("should use default class when hasError is undefined", () => {
      const result = getHelperTextClassNames({});
      expect(result).toContain(HELPER_TEXT_DEFAULT_CLASS);
    });
  });
});
