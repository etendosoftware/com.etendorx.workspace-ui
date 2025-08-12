import React, { PropsWithChildren } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
// Mock UserContext to avoid importing heavy client module
jest.mock("@/contexts/user", () => {
  const React = require("react");
  return { __esModule: true, UserContext: React.createContext({ token: null }) };
});
import { UserContext } from "@/contexts/user";

// Keep the forward path deterministic
jest.mock("@workspaceui/api-client/src/api/constants", () => ({
  API_FORWARD_PATH: "/meta/forward",
}));

// Use real logger (console-backed); we'll spy on console.debug in tests

// Force manual-processes debug flag on for the specific test run
jest.mock("@/utils/debug", () => ({
  __esModule: true,
  isDebugManualProcesses: () => true,
  isDebugCallouts: () => false,
  getEnvVar: (k: string) => undefined,
}));

// Provide a stable API base URL
jest.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => "http://localhost:3000/api",
}));

// Provide windowId via metadata context
jest.mock("@/hooks/useMetadataContext", () => ({
  useMetadataContext: () => ({ windowId: "W123" }),
}));

// Provide tab and record via tab context
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: { id: "T10", window: "W123", table: "TB1" },
    record: {
      id: "R1",
      docstatus: "DR",
      processing: "N",
      AD_Client_ID: "CLIENT",
      AD_Org_ID: "ORG",
      c_bpartner_id: "BP",
    },
  }),
}));

// Provide recordId via next/navigation
jest.mock("next/navigation", () => ({
  useParams: () => ({ recordId: "R1" }),
}));

// Mock mapping for manual processes
jest.mock("@/utils/processes/manual/data.json", () => ({
  __esModule: true,
  default: {
    TEST_BUTTON: {
      url: "/SalesOrder/Header_Edition.html",
      command: "BUTTONDocAction104",
      inpkeyColumnId: "C_Order_ID",
      keyColumnName: "C_Order_ID",
    },
    Posted: {
      url: "/SalesInvoice/Header_Edition.html",
      command: "BUTTONDocAction111",
      inpkeyColumnId: "C_Invoice_ID",
      keyColumnName: "C_Invoice_ID",
    },
  },
}));

import { useProcessExecution } from "@/hooks/Toolbar/useProcessExecution";

// Minimal harness component exercising the hook
function Harness({ buttonId }: { buttonId: string }) {
  const { executeProcess, iframeUrl } = useProcessExecution();
  const onRun = async () => {
    const btn: any = {
      id: buttonId,
      action: "processAction",
      buttonText: "Execute",
      processInfo: { parameters: [], _entityName: "", id: "", name: "", javaClassName: "", clientSideValidation: "", loadFunction: "", searchKey: "" },
      processAction: { id: "PA1" },
    };

    const recordIdField: any = { value: "R1", type: "string", label: "Record ID", name: "recordId", original: {} };
    const res = await executeProcess({ button: btn, recordId: recordIdField, params: {} });
    const out = (res && (res as any).iframeUrl) || "";
    const target = document.querySelector("#result");
    if (target) target.textContent = out;
  };
  return (
    <div>
      <button onClick={onRun}>run</button>
      <div data-testid="iframeUrl">{iframeUrl}</div>
      <div id="result" data-testid="result" />
    </div>
  );
}

function withUser(ctxValue: any, ui: React.ReactElement) {
  return <UserContext.Provider value={ctxValue as any}>{ui}</UserContext.Provider>;
}

describe("useProcessExecution manual processes integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    try {
      window.localStorage.clear();
    } catch {}
  });
  it("builds iframe URL with required params for non-posted processes", async () => {
    const userCtx = { token: "tok_abc123" };
    render(withUser(userCtx, <Harness buttonId="TEST_BUTTON" />));

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    const resultEl = await screen.findByTestId("result");
    await waitFor(() => expect(resultEl.textContent).toContain("http://localhost:3000/api"));

    const url = new URL(resultEl.textContent || "http://localhost");
    expect(url.pathname).toContain("/meta/forward");
    expect(url.pathname).toContain("/SalesOrder/Header_Edition.html");

    const p = url.searchParams;
    expect(p.get("IsPopUpCall")).toBe("1");
    expect(p.get("Command")).toBe("BUTTONDocAction104");
    expect(p.get("inpKey")).toBe("R1");
    expect(p.get("inpcOrderId")).toBe("R1");
    expect(p.get("inpwindowId")).toBe("W123");
    expect(p.get("inpWindowId")).toBe("W123");
    expect(p.get("inpTabId")).toBe("T10");
    expect(p.get("inpTableId")).toBe("TB1");
    expect(p.get("inpadClientId")).toBe("CLIENT");
    expect(p.get("inpadOrgId")).toBe("ORG");
    expect(p.get("inpcBpartnerId")).toBe("BP");
    expect(p.get("inpkeyColumnId")).toBe("C_Order_ID");
    expect(p.get("keyColumnName")).toBe("C_Order_ID");
    expect(p.get("inpdocstatus")).toBe("DR");
    expect(p.get("inpprocessing")).toBe("N");
    expect(p.get("inpdocaction")).toBe("CO");
    expect(p.get("token")).toBe("tok_abc123");

    // Hook state mirrors the returned url
    const iframeStateEl = screen.getByTestId("iframeUrl");
    expect(iframeStateEl.textContent).toBe(resultEl.textContent);
  });

  it("sets inpdocaction=P for posted heuristic", async () => {
    const userCtx = { token: "tok_abc123" };
    render(withUser(userCtx, <Harness buttonId="Posted" />));

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    const resultEl = await screen.findByTestId("result");
    await waitFor(() => expect(resultEl.textContent).toContain("http://localhost:3000/api"));

    const url = new URL(resultEl.textContent || "http://localhost");
    const p = url.searchParams;
    expect(p.get("inpdocaction")).toBe("P");
  });

  it("rejects when button id is not found in mapping", async () => {
    const userCtx = { token: "tok_abc123" };

    // Create a harness that captures errors
    function ErrorHarness() {
      const { executeProcess } = useProcessExecution();
      const onRun = async () => {
        const badBtn: any = {
          id: "UNKNOWN",
          action: "processAction",
          buttonText: "Execute",
          processInfo: { parameters: [] },
          processAction: { id: "PA1" },
        };
        const recordIdField: any = { value: "R1", type: "string", label: "Record ID", name: "recordId", original: {} };
        try {
          await executeProcess({ button: badBtn, recordId: recordIdField, params: {} });
        } catch (e: any) {
          const target = document.querySelector("#error");
          if (target) target.textContent = e?.message || String(e);
        }
      };
      return (
        <div>
          <button onClick={onRun}>run</button>
          <div id="error" data-testid="error" />
        </div>
      );
    }

    render(withUser(userCtx, <ErrorHarness />));
    fireEvent.click(screen.getByRole("button", { name: /run/i }));
    const errEl = await screen.findByTestId("error");
    await waitFor(() => expect(errEl.textContent).toMatch(/Tipo de proceso no soportado/i));
  });

  it.skip("emits debug logs when DEBUG_MANUAL_PROCESSES is enabled", async () => {
    // Enable debug via localStorage flag
    process.env.NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES = "true";
    try { window.localStorage.setItem("DEBUG_MANUAL_PROCESSES", "true"); } catch {}

    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

    const userCtx = { token: "tok_abc123" };
    render(withUser(userCtx, <Harness buttonId="TEST_BUTTON" />));

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    const resultEl = await screen.findByTestId("result");
    await waitFor(() => expect(resultEl.textContent).toContain("http://localhost:3000/api"));
    await waitFor(() => expect(debugSpy).toHaveBeenCalled());
    expect(debugSpy.mock.calls.some((args) => String(args?.[0]).includes("[MANUAL_PROCESS]"))).toBe(true);
  });
});
