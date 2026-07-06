import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { resolveProcessModalDescription } from "../resolveProcessModalDescription";

const DESCRIPTION = "Synchronize the terminology within the system.";
const HELP =
  "Based on the entries in Window Element, the fields in windows, parameters, etc. are synchronized, if they are centrally maintained.";

describe("resolveProcessModalDescription", () => {
  describe("Report and Process (classic Help-first criterion)", () => {
    const type = PROCESS_TYPES.REPORT_AND_PROCESS;

    it("returns helpComment when present", () => {
      expect(resolveProcessModalDescription({ description: DESCRIPTION, helpComment: HELP }, type)).toBe(HELP);
    });

    it("falls back to description when helpComment is empty", () => {
      expect(resolveProcessModalDescription({ description: DESCRIPTION, helpComment: "" }, type)).toBe(DESCRIPTION);
    });

    it("falls back to description when helpComment is absent", () => {
      expect(resolveProcessModalDescription({ description: DESCRIPTION }, type)).toBe(DESCRIPTION);
    });
  });

  describe("Process Definition (description unchanged)", () => {
    const type = PROCESS_TYPES.PROCESS_DEFINITION;

    it("returns description and ignores helpComment", () => {
      expect(resolveProcessModalDescription({ description: DESCRIPTION, helpComment: HELP }, type)).toBe(DESCRIPTION);
    });
  });

  it("returns an empty string when neither field applies", () => {
    expect(resolveProcessModalDescription({}, PROCESS_TYPES.REPORT_AND_PROCESS)).toBe("");
    expect(resolveProcessModalDescription({ description: undefined }, PROCESS_TYPES.PROCESS_DEFINITION)).toBe("");
  });
});
