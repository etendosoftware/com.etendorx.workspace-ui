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

import { downloadBlob, fetchReportBlob, openBlobInNewTab } from "../reportActions";

const TOKEN = "tok-123";
const OBJECT_URL = "blob:mock-url";

describe("reportActions", () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => OBJECT_URL);
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("fetchReportBlob", () => {
    const mockFetch = (response: Partial<Response>): void => {
      global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
    };

    it("sends the Bearer token and returns the blob + parsed file name", async () => {
      const blob = new Blob(["x"]);
      mockFetch({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(blob),
        headers: { get: () => 'attachment; filename="report.pdf"' } as unknown as Headers,
      });

      const result = await fetchReportBlob("/api/erp/report", TOKEN);
      expect(global.fetch).toHaveBeenCalledWith("/api/erp/report", {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      expect(result.blob).toBe(blob);
      expect(result.fileName).toBe("report.pdf");
    });

    it("returns an undefined file name when the header is absent", async () => {
      mockFetch({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(new Blob(["x"])),
        headers: { get: () => null } as unknown as Headers,
      });
      const result = await fetchReportBlob("/api/erp/report", TOKEN);
      expect(result.fileName).toBeUndefined();
    });

    it("throws on a non-OK response", async () => {
      mockFetch({ ok: false, status: 500 } as Partial<Response>);
      await expect(fetchReportBlob("/api/erp/report", TOKEN)).rejects.toThrow("status 500");
    });
  });

  it("openBlobInNewTab opens the object URL in a new tab", () => {
    const open = jest.spyOn(window, "open").mockReturnValue(null);
    openBlobInNewTab(new Blob(["x"]));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(OBJECT_URL, "_blank", "noopener,noreferrer");
  });

  it("downloadBlob clicks a transient anchor with the file name", () => {
    const click = jest.fn();
    const anchor = { href: "", download: "", click } as unknown as HTMLAnchorElement;
    jest.spyOn(document, "createElement").mockReturnValue(anchor);
    const append = jest.spyOn(document.body, "appendChild").mockImplementation((n) => n);
    const remove = jest.spyOn(document.body, "removeChild").mockImplementation((n) => n);

    downloadBlob(new Blob(["x"]), "out.pdf");

    expect(anchor.href).toBe(OBJECT_URL);
    expect(anchor.download).toBe("out.pdf");
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
    append.mockRestore();
    remove.mockRestore();
  });
});
