/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Substrate that makes Manual (`uiPattern = "M"`) Defined Processes runnable in
 * the new UI: the pattern discriminator, direct-execute mode, and the `openUrl`
 * hand-off. Each of these was missing, which left every Manual process rendering
 * an empty modal whose Execute button posted a client-side JS namespace to the
 * kernel as if it were a Java ActionHandler.
 */

import type { ProcessDefinition } from "@workspaceui/api-client/src/api/types";
import {
  isCloseModalResult,
  isDirectExecuteResult,
  shouldFireDirectExecute,
  shouldRenderDirectExecuteOverlay,
} from "@/utils/processes/definition/directExecute";
import {
  buildOpenUrlFallbackAction,
  openExternalWindow,
  isOpenUrlIntent,
  parseOpenUrlPayload,
  resolveErpHostedUrl,
  type WindowOpener,
} from "@/utils/processes/definition/openUrl";
import { initialProcessParameters } from "@/utils/processes/definition/manualProcess";
import { isManualProcess, isPickAndExecute } from "@/utils/processes/definition/pickAndExecute";

const asProcess = (partial: Partial<ProcessDefinition>): ProcessDefinition => partial as ProcessDefinition;

describe("initialProcessParameters", () => {
  // Every SII sender ships a "Warning" parameter whose default value is the
  // confirmation text. Classic never renders it: uiPattern 'M' returns from
  // openProcess before buildProcess, so the parameter window is never created.
  const warningParameter = { name: "Warning", dBColumnName: "warning" };

  it("drops the dictionary parameters of a Manual process", () => {
    const manual = asProcess({ uIPattern: "M", parameters: { warning: warningParameter } as never });
    expect(initialProcessParameters(manual)).toEqual({});
  });

  it("keeps the parameters of every other ui pattern", () => {
    const parameters = { warning: warningParameter } as never;
    expect(initialProcessParameters(asProcess({ uIPattern: "STD", parameters }))).toBe(parameters);
    expect(initialProcessParameters(asProcess({ uIPattern: "OBUIAPP_PickAndExecute", parameters }))).toBe(parameters);
    // A definition with no explicit pattern is not Manual, so nothing is dropped.
    expect(initialProcessParameters(asProcess({ parameters }))).toBe(parameters);
  });

  it("returns an empty map for a missing definition or missing parameters", () => {
    expect(initialProcessParameters(null)).toEqual({});
    expect(initialProcessParameters(undefined)).toEqual({});
    expect(initialProcessParameters(asProcess({ uIPattern: "STD" }))).toEqual({});
  });
});

describe("isManualProcess", () => {
  it("is true only for uiPattern 'M'", () => {
    expect(isManualProcess(asProcess({ uIPattern: "M" }))).toBe(true);
    expect(isManualProcess(asProcess({ uIPattern: "A" }))).toBe(false);
    expect(isManualProcess(asProcess({ uIPattern: "OBUIAPP_PickAndExecute" }))).toBe(false);
    expect(isManualProcess(asProcess({}))).toBe(false);
  });

  it("tolerates a missing process", () => {
    expect(isManualProcess(null)).toBe(false);
    expect(isManualProcess(undefined)).toBe(false);
  });

  it("does not make a parameterless Manual process look like Pick and Execute", () => {
    const manual = asProcess({ uIPattern: "M", parameters: {} });
    expect(isManualProcess(manual)).toBe(true);
    expect(isPickAndExecute(manual)).toBe(false);
  });
});

describe("directExecute", () => {
  it("recognizes the onLoad direct-execute request", () => {
    expect(isDirectExecuteResult({ type: "directExecute" })).toBe(true);
  });

  it("ignores every other onLoad return shape", () => {
    expect(isDirectExecuteResult({ type: "warehouseProcess" })).toBe(false);
    expect(isDirectExecuteResult({ _gridSelection: {} })).toBe(false);
    expect(isDirectExecuteResult(undefined)).toBe(false);
    expect(isDirectExecuteResult(null)).toBe(false);
    expect(isDirectExecuteResult("directExecute")).toBe(false);
  });

  it("fires once per open session", () => {
    expect(shouldFireDirectExecute({ requested: true, open: true, alreadyFired: false })).toBe(true);
    expect(shouldFireDirectExecute({ requested: true, open: true, alreadyFired: true })).toBe(false);
  });

  it("never fires when the modal is closed or the mode was not requested", () => {
    expect(shouldFireDirectExecute({ requested: true, open: false, alreadyFired: false })).toBe(false);
    expect(shouldFireDirectExecute({ requested: false, open: true, alreadyFired: false })).toBe(false);
  });

  it("shows the bare overlay while running and restores the chrome once a result lands", () => {
    expect(shouldRenderDirectExecuteOverlay({ requested: true, hasResult: false })).toBe(true);
    expect(shouldRenderDirectExecuteOverlay({ requested: true, hasResult: true })).toBe(false);
    expect(shouldRenderDirectExecuteOverlay({ requested: false, hasResult: false })).toBe(false);
  });

  // The overlay has no message bar, so a script message — or the platform's own
  // "popup blocked / Open link" banner — would be stuck behind a spinner.
  it("yields the chrome as soon as the message bar holds a message", () => {
    expect(shouldRenderDirectExecuteOverlay({ requested: true, hasResult: false, hasMessage: true })).toBe(false);
    expect(shouldRenderDirectExecuteOverlay({ requested: true, hasResult: false, hasMessage: false })).toBe(true);
  });
});

describe("parseOpenUrlPayload", () => {
  it("parses the onProcess return shape, including its flags", () => {
    expect(
      parseOpenUrlPayload({
        type: "openUrl",
        url: "https://bank.example/consent",
        closeModal: true,
        refreshRecord: true,
        windowFeatures: "width=800,height=600",
      })
    ).toEqual({
      url: "https://bank.example/consent",
      closeModal: true,
      refreshRecord: true,
      windowFeatures: "width=800,height=600",
    });
  });

  it("requires the type discriminator on the onProcess return path", () => {
    expect(parseOpenUrlPayload({ url: "https://example.test" })).toBeNull();
    expect(parseOpenUrlPayload({ url: "https://example.test" }, false)).toEqual({
      url: "https://example.test",
      closeModal: undefined,
      refreshRecord: undefined,
      windowFeatures: undefined,
    });
  });

  it("rejects a request with no usable url", () => {
    expect(parseOpenUrlPayload({ type: "openUrl" })).toBeNull();
    expect(parseOpenUrlPayload({ type: "openUrl", url: "" })).toBeNull();
    expect(parseOpenUrlPayload({ type: "openUrl", url: 7 })).toBeNull();
    expect(parseOpenUrlPayload(null)).toBeNull();
  });

  it("drops non-boolean flags instead of coercing them", () => {
    const parsed = parseOpenUrlPayload({ type: "openUrl", url: "https://example.test", closeModal: "Y" });
    expect(parsed?.closeModal).toBeUndefined();
  });

  it("carries the erpHosted flag through, and only as a boolean", () => {
    expect(parseOpenUrlPayload({ type: "openUrl", url: "/web/x/", erpHosted: true })?.erpHosted).toBe(true);
    expect(parseOpenUrlPayload({ type: "openUrl", url: "/web/x/", erpHosted: "Y" })?.erpHosted).toBeUndefined();
    expect(parseOpenUrlPayload({ type: "openUrl", url: "https://example.test" })?.erpHosted).toBeUndefined();
  });
});

describe("isOpenUrlIntent", () => {
  it("recognizes the hand-off even when it carries no usable url", () => {
    // The whole point: `parseOpenUrlPayload` rejects these, and the caller still
    // has to know a hand-off was requested so it does not report success.
    expect(isOpenUrlIntent({ type: "openUrl" })).toBe(true);
    expect(isOpenUrlIntent({ type: "openUrl", url: undefined, closeModal: true })).toBe(true);
    expect(isOpenUrlIntent({ type: "openUrl", url: "" })).toBe(true);
  });

  it("still recognizes a usable hand-off", () => {
    expect(isOpenUrlIntent({ type: "openUrl", url: "https://bank.example/consent" })).toBe(true);
  });

  it("ignores anything that is not an open-url request", () => {
    expect(isOpenUrlIntent({ type: "closeModal" })).toBe(false);
    expect(isOpenUrlIntent({ message: { severity: "error", text: "boom" } })).toBe(false);
    expect(isOpenUrlIntent(null)).toBe(false);
    expect(isOpenUrlIntent("openUrl")).toBe(false);
    expect(isOpenUrlIntent([{ type: "openUrl" }])).toBe(false);
  });
});

// Classic scripts build ERP URLs as
// `OB.Utilities.getLocationUrlWithoutFragment() + <erp path>` because the classic
// UI is served from the ERP host. The new UI is a separate app, so the host is
// resolved at dispatch time.
describe("resolveErpHostedUrl", () => {
  const CLASSIC_HOST = "http://localhost:8080/etendo";

  it("leaves an ordinary hand-off untouched, so external URLs are never rewritten", () => {
    const external = { url: "https://bank.example/consent" };
    expect(resolveErpHostedUrl(external, { classicHost: CLASSIC_HOST, token: "jwt" })).toBe(
      "https://bank.example/consent"
    );
  });

  it("routes an erpHosted path through the legacy redirect, which primes a Classic session", () => {
    const resolved = resolveErpHostedUrl(
      { url: "/web/com.etendoerp.openapi/?tag=Bulk Task", erpHosted: true },
      { classicHost: CLASSIC_HOST, token: "jwt" }
    );

    // The servlet rejects absolute locations: it gets the context-path-relative form.
    expect(resolved).toBe(
      `${CLASSIC_HOST}/meta/legacy/redirect?location=${encodeURIComponent("/etendo/web/com.etendoerp.openapi/?tag=Bulk Task")}&token=jwt`
    );
  });

  it("falls back to the plain Classic URL when there is no token", () => {
    expect(
      resolveErpHostedUrl({ url: "/web/com.etendoerp.openapi/", erpHosted: true }, { classicHost: CLASSIC_HOST })
    ).toBe("http://localhost:8080/etendo/web/com.etendoerp.openapi/");
  });

  it("keeps the path as-is when the runtime config has not loaded, rather than opening a broken URL", () => {
    const payload = { url: "/web/com.etendoerp.openapi/", erpHosted: true };
    expect(resolveErpHostedUrl(payload, { classicHost: "", token: "jwt" })).toBe("/web/com.etendoerp.openapi/");
    expect(resolveErpHostedUrl(payload, {})).toBe("/web/com.etendoerp.openapi/");
  });

  it("normalizes a trailing slash on the host and a missing one on the path", () => {
    expect(resolveErpHostedUrl({ url: "web/x/", erpHosted: true }, { classicHost: `${CLASSIC_HOST}/` })).toBe(
      "http://localhost:8080/etendo/web/x/"
    );
  });
});

describe("openExternalWindow", () => {
  it("reports success when the browser returns a window handle", () => {
    const opener = jest.fn(() => ({}) as Window) as unknown as jest.MockedFunction<WindowOpener>;
    expect(openExternalWindow({ url: "https://example.test", windowFeatures: "width=800" }, opener)).toBe(true);
    expect(opener).toHaveBeenCalledWith("https://example.test", "_blank", "width=800");
  });

  it("reports failure when the popup is blocked, so the caller can offer a fallback", () => {
    const opener = jest.fn(() => null) as unknown as jest.MockedFunction<WindowOpener>;
    expect(openExternalWindow({ url: "https://example.test" }, opener)).toBe(false);
  });

  it("re-opens the url from a direct click through the fallback action", () => {
    const opener = jest.fn(() => null) as unknown as jest.MockedFunction<WindowOpener>;
    const action = buildOpenUrlFallbackAction({ url: "https://example.test" }, "Open link", opener);
    expect(action.label).toBe("Open link");
    action.onClick();
    expect(opener).toHaveBeenCalledWith("https://example.test", "_blank", undefined);
  });
});

describe("closeModal", () => {
  it("recognizes the onProcess dismiss request", () => {
    expect(isCloseModalResult({ type: "closeModal" })).toBe(true);
  });

  it("does not confuse a dismiss with a direct-execute request", () => {
    expect(isDirectExecuteResult({ type: "closeModal" })).toBe(false);
    expect(isCloseModalResult({ type: "directExecute" })).toBe(false);
  });

  it("treats a bare return as a result, not a dismiss", () => {
    // The distinction matters: a bare `return` renders a blank failure banner,
    // which is why a declined confirm must return the explicit dismiss.
    expect(isCloseModalResult(undefined)).toBe(false);
    expect(isCloseModalResult(null)).toBe(false);
    expect(isCloseModalResult({})).toBe(false);
  });
});
