import { filterActiveListOptions, restrictListOptionsToEntries } from "../listOptions";

const options = [{ value: "I", active: true }, { value: "S" }, { value: "O", active: false }];

describe("filterActiveListOptions", () => {
  it("hides the values inactive in the dictionary", () => {
    expect(filterActiveListOptions(options).map((o) => o.value)).toEqual(["I", "S"]);
  });

  it("keeps the inactive value the record currently stores", () => {
    expect(filterActiveListOptions(options, "O").map((o) => o.value)).toEqual(["I", "S", "O"]);
  });

  it("treats a value without the active flag as active", () => {
    expect(filterActiveListOptions([{ value: "X" }]).map((o) => o.value)).toEqual(["X"]);
  });
});

describe("restrictListOptionsToEntries", () => {
  const options = [
    { value: "R", label: "Ranges" },
    { value: "F", label: "Fixed Price" },
    { value: "P", label: "Percentage" },
  ];
  const entries = [
    { id: "P", label: "Percentage" },
    { id: "R", label: "Ranges" },
  ];

  it("keeps only the values the server allows", () => {
    expect(restrictListOptionsToEntries(options, entries, "P").map((o) => o.value)).toEqual(["R", "P"]);
  });

  it("keeps the stored value even when the rule does not allow it", () => {
    expect(restrictListOptionsToEntries(options, entries, "F").map((o) => o.value)).toEqual(["R", "F", "P"]);
  });

  it("returns every option when the server sent no entries", () => {
    expect(restrictListOptionsToEntries(options, undefined, "P")).toHaveLength(3);
    expect(restrictListOptionsToEntries(options, [], "P")).toHaveLength(3);
  });
});
