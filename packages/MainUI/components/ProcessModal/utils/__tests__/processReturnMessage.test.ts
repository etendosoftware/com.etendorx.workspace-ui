import { readReturnedMessage, resolveDefaultMsgType } from "../processReturnMessage";

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

describe("resolveDefaultMsgType", () => {
  it("defaults a handler-shaped message with no severity to error", () => {
    // The shape the SII handlers answer their validation and failure paths with:
    // the translated "Error" label as title, the reason as text, and no severity.
    // Classic paints it red (OB.AEATSII.execute ends in `else -> TYPE_ERROR`).
    expect(resolveDefaultMsgType({ message: { title: "Error:", text: "cashReceipt is null" } })).toBe("error");
  });

  it("applies the same default at the nested levels a handler answers from", () => {
    expect(resolveDefaultMsgType({ response: { message: { title: "Error:", text: "Boom" } } })).toBe("error");
    expect(resolveDefaultMsgType({ response: { data: { message: { title: "Error:", text: "Boom" } } } })).toBe("error");
  });

  it("keeps the success default for a bare string message", () => {
    // Not a handler answer — a script saying something.
    expect(resolveDefaultMsgType({ message: "Everything went fine" })).toBe("success");
  });

  it("keeps the success default when there is no message at all", () => {
    expect(resolveDefaultMsgType({ responseActions: [{ refreshGrid: {} }] })).toBe("success");
    expect(resolveDefaultMsgType(undefined)).toBe("success");
    expect(resolveDefaultMsgType(null)).toBe("success");
  });

  it("is only a default — a message that carries its own severity is unaffected", () => {
    // The caller spreads the read message on top, so the severity always wins.
    const result = { message: { severity: "success", title: "Done", text: "All good" } };

    expect({ msgType: resolveDefaultMsgType(result), ...readReturnedMessage(result) }).toEqual({
      msgType: "success",
      msgTitle: "Done",
      msgText: "All good",
    });
  });
});
