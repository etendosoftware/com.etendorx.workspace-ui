import { debounce } from "../debounce";

jest.useFakeTimers();

describe("debounce", () => {
  it("should delay function execution", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not execute if cancelled", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();

    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("should pass arguments to the original function", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced("arg1", 2);
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("arg1", 2);
  });

  it("cancel should be safe to call multiple times", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    debounced.cancel(); // should handle timeoutId being null

    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
