/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { parseSmartClientMessage } from "../processModalUtils";

describe("parseSmartClientMessage", () => {
  it("extracts tabId and recordId from openDirectTab call", () => {
    const html = `Some text <a href="javascript:openDirectTab('TAB123', 'REC456')">click</a> after`;
    const result = parseSmartClientMessage(html);
    expect(result.tabId).toBe("TAB123");
    expect(result.recordId).toBe("REC456");
  });

  it("strips the anchor tag from the text output", () => {
    const html = `Done. <a href="javascript:openDirectTab('T1', 'R1')">View record</a>`;
    const result = parseSmartClientMessage(html);
    expect(result.text).toBe("Done.");
    expect(result.text).not.toContain("<a");
    expect(result.text).not.toContain("View record");
  });

  it("returns undefined tabId and recordId when no openDirectTab call", () => {
    const html = "<p>Simple message</p>";
    const result = parseSmartClientMessage(html);
    expect(result.tabId).toBeUndefined();
    expect(result.recordId).toBeUndefined();
  });

  it("strips all HTML tags and returns plain text", () => {
    const html = "<p>Process <strong>completed</strong> successfully.</p>";
    const result = parseSmartClientMessage(html);
    expect(result.text).toBe("Process completed successfully.");
  });

  it("handles plain text with no HTML", () => {
    const result = parseSmartClientMessage("All done");
    expect(result.text).toBe("All done");
    expect(result.tabId).toBeUndefined();
    expect(result.recordId).toBeUndefined();
  });

  it("trims leading and trailing whitespace from the result text", () => {
    const result = parseSmartClientMessage("  hello world  ");
    expect(result.text).toBe("hello world");
  });

  it("handles openDirectTab with single-quoted arguments", () => {
    const html = `<a onclick="openDirectTab('TABX', 'RECX')">Go</a>`;
    const result = parseSmartClientMessage(html);
    expect(result.tabId).toBe("TABX");
    expect(result.recordId).toBe("RECX");
  });

  it("returns empty tabId as undefined when first arg is empty", () => {
    const html = `<a onclick="openDirectTab('', 'REC1')">Go</a>`;
    const result = parseSmartClientMessage(html);
    expect(result.tabId).toBeUndefined();
    expect(result.recordId).toBe("REC1");
  });

  it("handles HTML with multiple tags", () => {
    const html = "<div><span>Step 1</span><br/><span>Step 2</span></div>";
    const result = parseSmartClientMessage(html);
    expect(result.text).toBe("Step 1Step 2");
  });

  it("handles empty string input", () => {
    const result = parseSmartClientMessage("");
    expect(result.text).toBe("");
    expect(result.tabId).toBeUndefined();
    expect(result.recordId).toBeUndefined();
  });
});
