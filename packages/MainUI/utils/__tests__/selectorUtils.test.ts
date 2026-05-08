import { handleKeyboardActivation } from "../selectorUtils";

describe("selectorUtils", () => {
  describe("handleKeyboardActivation", () => {
    let callback: jest.Mock;
    let preventDefault: jest.Mock;

    beforeEach(() => {
      callback = jest.fn();
      preventDefault = jest.fn();
    });

    const makeKeyEvent = (key: string) => ({ key, preventDefault }) as unknown as React.KeyboardEvent;

    it("should call callback on Enter key", () => {
      handleKeyboardActivation(makeKeyEvent("Enter"), callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("should call callback on Space key", () => {
      handleKeyboardActivation(makeKeyEvent(" "), callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("should not call callback on other keys", () => {
      handleKeyboardActivation(makeKeyEvent("Escape"), callback);
      expect(callback).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("should not call callback on Tab key", () => {
      handleKeyboardActivation(makeKeyEvent("Tab"), callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
