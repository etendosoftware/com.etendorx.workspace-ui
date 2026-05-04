import {
  PROCESS_DEFINITION_DATA,
  WINDOW_SPECIFIC_KEYS,
  PROCESS_TYPES,
  COPY_FROM_ORDER_PROCESS_ID,
  SERVERS_WINDOW_ID,
  BUTTON_REFERENCE_ID,
  BUTTON_LIST_REFERENCE_ID,
} from "../constants";

describe("processes/definition/constants", () => {
  describe("PROCESS_DEFINITION_DATA", () => {
    it("should have entries for known process IDs", () => {
      expect(PROCESS_DEFINITION_DATA[COPY_FROM_ORDER_PROCESS_ID]).toBeDefined();
    });

    it("should have required fields for each process definition", () => {
      for (const [, definition] of Object.entries(PROCESS_DEFINITION_DATA)) {
        expect(definition).toHaveProperty("inpColumnId");
        expect(definition).toHaveProperty("inpPrimaryKeyColumnId");
        expect(definition).toHaveProperty("defaultKeys");
        expect(definition).toHaveProperty("dynamicKeys");
        expect(definition).toHaveProperty("staticOptions");
        expect(typeof definition.inpColumnId).toBe("string");
        expect(typeof definition.inpPrimaryKeyColumnId).toBe("string");
      }
    });

    it("should have at least one process definition", () => {
      expect(Object.keys(PROCESS_DEFINITION_DATA).length).toBeGreaterThan(0);
    });
  });

  describe("WINDOW_SPECIFIC_KEYS", () => {
    it("should have entry for SERVERS_WINDOW_ID", () => {
      const entry = WINDOW_SPECIFIC_KEYS[SERVERS_WINDOW_ID];
      expect(entry).toBeDefined();
      expect(entry.key).toBe("Smfsch_Servers_ID");
    });

    it("should have value function that returns record id", () => {
      const entry = WINDOW_SPECIFIC_KEYS[SERVERS_WINDOW_ID];
      expect(entry.value({ id: "test-id" })).toBe("test-id");
      expect(entry.value(null)).toBeNull();
      expect(entry.value(undefined)).toBeNull();
    });
  });

  describe("PROCESS_TYPES", () => {
    it("should have expected process types", () => {
      expect(PROCESS_TYPES.PROCESS_DEFINITION).toBe("process-definition");
      expect(PROCESS_TYPES.REPORT_AND_PROCESS).toBe("report-and-process");
    });
  });

  describe("reference IDs", () => {
    it("should have button reference IDs defined", () => {
      expect(BUTTON_REFERENCE_ID).toBe("28");
      expect(typeof BUTTON_LIST_REFERENCE_ID).toBe("string");
      expect(BUTTON_LIST_REFERENCE_ID.length).toBeGreaterThan(0);
    });
  });
});
