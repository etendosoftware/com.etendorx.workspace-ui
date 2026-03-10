import { parseSmartClientMessage } from "../processModalUtils";

describe("processModalUtils", () => {
  describe("parseSmartClientMessage", () => {
    it("should parse normal html text to plain text without tags", () => {
      const html = "<span>Hello</span> <strong>World</strong>";
      const result = parseSmartClientMessage(html);
      expect(result.text).toBe("Hello World");
      expect(result.tabId).toBeUndefined();
      expect(result.recordId).toBeUndefined();
    });

    it("should strip out anchor tags entirely when extracting plain text", () => {
      const html = "Process <a href='#'>details</a> completed.";
      const result = parseSmartClientMessage(html);
      expect(result.text).toBe("Process  completed.");
    });

    it("should extract tabId and recordId from openDirectTab", () => {
      const html = "Action complete. openDirectTab('TAB_ID_123', 'RECORD_ID_456');";
      const result = parseSmartClientMessage(html);
      expect(result.text).toBe("Action complete. openDirectTab('TAB_ID_123', 'RECORD_ID_456');");
      expect(result.tabId).toBe("TAB_ID_123");
      // Result removes whitespace and quotes cleanly
      expect(result.recordId).toBe("RECORD_ID_456");
    });

    it("should handle single quotes or double quotes in openDirectTab args", () => {
      const html = 'openDirectTab("TAB1", "REC1")';
      const result = parseSmartClientMessage(html);
      expect(result.tabId).toBe("TAB1");
      expect(result.recordId).toBe("REC1");
    });

    it("should cleanly trim openDirectTab with missing spaces", () => {
      const html = "openDirectTab(TAB_ABC,REC_DEF)";
      const result = parseSmartClientMessage(html);
      expect(result.tabId).toBe("TAB_ABC");
      expect(result.recordId).toBe("REC_DEF");
    });
  });
});
