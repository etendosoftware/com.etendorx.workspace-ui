import { readReturnedMessage } from "../processReturnMessage";

describe("readReturnedMessage", () => {
  describe("script-facing spelling (msgType/msgTitle/msgText)", () => {
    it("reads the shape a migrated onProcess returns (migration guide, AR-1)", () => {
      const result = {
        message: { msgType: "success", msgTitle: "Permissions recalculated", msgText: "No new records added" },
        responseActions: [{ refreshGrid: {} }],
      };

      expect(readReturnedMessage(result)).toEqual({
        msgType: "success",
        msgTitle: "Permissions recalculated",
        msgText: "No new records added",
      });
    });

    it("keeps a title-only message so the server heading still reaches the user", () => {
      expect(readReturnedMessage({ message: { msgType: "success", msgTitle: "Done" } })).toEqual({
        msgType: "success",
        msgTitle: "Done",
      });
    });
  });

  describe("raw Etendo Classic spelling (severity/title/text)", () => {
    it("reads a handler response handed back untouched", () => {
      const response = {
        message: {
          severity: "success",
          title: "Permissions recalculated correctly for role System Administrator",
          text: "No new records added into the role accesses",
        },
      };

      expect(readReturnedMessage(response)).toEqual({
        msgType: "success",
        msgTitle: "Permissions recalculated correctly for role System Administrator",
        msgText: "No new records added into the role accesses",
      });
    });

    it("prefers the script-facing keys when both spellings are present", () => {
      const result = {
        message: { msgType: "warning", severity: "success", msgText: "A", text: "B" },
      };

      expect(readReturnedMessage(result)).toEqual({ msgType: "warning", msgText: "A" });
    });
  });

  it("accepts `message` as a plain string", () => {
    expect(readReturnedMessage({ message: "Everything went fine" })).toEqual({
      msgText: "Everything went fine",
    });
  });

  describe("nesting", () => {
    it("reads `response.message`", () => {
      expect(readReturnedMessage({ response: { message: { severity: "error", text: "Boom" } } })).toEqual({
        msgType: "error",
        msgText: "Boom",
      });
    });

    it("reads `response.data.message`", () => {
      expect(readReturnedMessage({ response: { data: { message: { severity: "error", text: "Boom" } } } })).toEqual({
        msgType: "error",
        msgText: "Boom",
      });
    });

    it("prefers the top-level message over the nested ones", () => {
      const data = {
        message: { text: "top" },
        response: { message: { text: "nested" } },
      };

      expect(readReturnedMessage(data)).toEqual({ msgText: "top" });
    });
  });

  describe("absence — the caller must keep its own default texts", () => {
    it("returns null when there is no `message` field", () => {
      expect(readReturnedMessage({ responseActions: [{ refreshGrid: {} }] })).toBeNull();
    });

    it("returns null for a message carrying a severity but no words to show", () => {
      expect(readReturnedMessage({ message: { severity: "success" } })).toBeNull();
      expect(readReturnedMessage({ message: { msgType: "success", msgText: "" } })).toBeNull();
    });

    it("returns null for non-object, non-string messages", () => {
      expect(readReturnedMessage({ message: 42 })).toBeNull();
      expect(readReturnedMessage({ message: null })).toBeNull();
      expect(readReturnedMessage({ message: [] })).toBeNull();
    });

    it("returns null for values that are not objects at all", () => {
      expect(readReturnedMessage(undefined)).toBeNull();
      expect(readReturnedMessage(null)).toBeNull();
      expect(readReturnedMessage("plain string")).toBeNull();
    });
  });
});
