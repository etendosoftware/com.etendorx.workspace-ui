import "../testUtils/useProcessExecution.mocks";
import { renderHook } from "@testing-library/react";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

// ---------------------------------------------------------------------------
// Tests — parseProcessResponse
// ---------------------------------------------------------------------------

describe("useProcessExecution — parseProcessResponse", () => {
  it("parses responseActions array with showMsgInProcessView", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: {
        responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "Done" } }],
      },
    });
    expect(res.success).toBe(true);
    expect(res.messageType).toBe("success");
  });

  it("parses responseActions object (non-array) with showMsgInProcessView", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: {
        responseActions: { showMsgInProcessView: { msgType: "success", msgText: "OK" } },
      },
    });
    expect(res.messageType).toBe("success");
  });

  it("parses smartclientSay message", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: {
        responseActions: [{ smartclientSay: { message: "Hello" } }],
      },
    });
    expect(res.messageType).toBe("success");
    expect(res.data).toBe("Hello");
  });

  it("parses response error object", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: false,
      data: { response: { error: { message: "Something failed" } } },
    });
    expect(res.success).toBe(false);
    expect(res.messageType).toBe("error");
  });

  it("parses data with text field", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: { text: "result text", severity: "success" },
    });
    expect(res.messageType).toBe("success");
  });

  it("parses data with nested potentialMessage object", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: { message: { text: "msg text", severity: "success" } },
    });
    expect(res.messageType).toBe("success");
  });

  it("falls back to plain potentialMessage string", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: { message: "plain msg", msgType: "success" },
    });
    expect(res.messageType).toBe("success");
    expect(res.data).toBe("plain msg");
  });

  it("marks as error when success=false and no message type", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({ success: false, data: {} });
    expect(res.success).toBe(false);
  });

  it("parses response.responseActions (nested path)", () => {
    const { result } = renderHook(() => useProcessExecution(makeParams()));
    const res = result.current.parseProcessResponse({
      success: true,
      data: {
        response: {
          responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "Nested" } }],
        },
      },
    });
    expect(res.messageType).toBe("success");
  });
});

// ---------------------------------------------------------------------------
// Tests — handleSuccessClose
// ---------------------------------------------------------------------------

describe("useProcessExecution — handleSuccessClose", () => {
  it("calls onSuccess when shouldTriggerSuccess is true", () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useProcessExecution(makeParams({ shouldTriggerSuccess: true, onSuccess })));
    result.current.handleSuccessClose();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does nothing when isPending is true", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useProcessExecution(makeParams({ isPending: true, onClose })));
    result.current.handleSuccessClose();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls setGridRefreshKey when keepOpenOnSuccess is true", () => {
    const setGridRefreshKey = jest.fn();
    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ keepOpenOnSuccess: true, setGridRefreshKey }))
    );
    result.current.handleSuccessClose();
    expect(setGridRefreshKey).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — handleWindowReferenceExecute
// ---------------------------------------------------------------------------

describe("useProcessExecution — handleWindowReferenceExecute", () => {
  it("calls executeJavaProcess via startTransition when processId is set", async () => {
    const setResult = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "OK" } }] }),
    }) as any;

    const { result } = renderHook(() =>
      useProcessExecution(
        makeParams({
          processId: "PROC-001",
          setResult,
          startTransition: (fn: () => Promise<void>) => {
            fn();
          },
        })
      )
    );

    await result.current.handleWindowReferenceExecute();
    // fetch was called (executeJavaProcess ran)
    expect(global.fetch).toHaveBeenCalled();
  });

  it("does nothing when processId is empty", async () => {
    global.fetch = jest.fn() as any;
    const { result } = renderHook(() => useProcessExecution(makeParams({ processId: "" })));
    await result.current.handleWindowReferenceExecute();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("passes actionValue as _buttonValue when provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as any;

    const { result } = renderHook(() =>
      useProcessExecution(
        makeParams({
          startTransition: (fn: () => Promise<void>) => {
            fn();
          },
        })
      )
    );

    await result.current.handleWindowReferenceExecute("CUSTOM_ACTION");
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body._buttonValue).toBe("CUSTOM_ACTION");
  });

  it("uses newVersion as default _buttonValue when actionValue is not provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as any;

    const { result } = renderHook(() =>
      useProcessExecution(
        makeParams({
          startTransition: (fn: () => Promise<void>) => {
            fn();
          },
        })
      )
    );

    await result.current.handleWindowReferenceExecute();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body._buttonValue).toBe("newVersion");
  });
});

// ---------------------------------------------------------------------------
// Tests — executeJavaProcess (error path)
// ---------------------------------------------------------------------------

describe("useProcessExecution — executeJavaProcess error handling", () => {
  it("calls setResult with error when fetch fails", async () => {
    const setResult = jest.fn();
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as jest.Mock;

    const { result } = renderHook(() => useProcessExecution(makeParams({ setResult })));
    await result.current.executeJavaProcess({});
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("calls setResult when response is not ok", async () => {
    const setResult = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue("Bad request"),
    }) as jest.Mock;

    const { result } = renderHook(() => useProcessExecution(makeParams({ setResult })));
    await result.current.executeJavaProcess({});
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

// ---------------------------------------------------------------------------
// Tests — handleExecute
// ---------------------------------------------------------------------------

describe("useProcessExecution — handleExecute", () => {
  it("calls setGridRefreshKey when action button is a filter", async () => {
    const setGridRefreshKey = jest.fn();
    const { result } = renderHook(() =>
      useProcessExecution(
        makeParams({
          availableButtons: [{ value: "FILTER_BTN", isFilter: true }],
          setGridRefreshKey,
        })
      )
    );
    await result.current.handleExecute("FILTER_BTN");
    expect(setGridRefreshKey).toHaveBeenCalled();
  });

  it("delegates to handleWindowReferenceExecute when hasWindowReference is true", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;
    const setResult = jest.fn();
    const { result } = renderHook(() =>
      useProcessExecution(
        makeParams({
          hasWindowReference: true,
          setResult,
          startTransition: (fn: () => Promise<void>) => {
            fn();
          },
        })
      )
    );
    await result.current.handleExecute();
    expect(global.fetch).toHaveBeenCalled();
  });
});
