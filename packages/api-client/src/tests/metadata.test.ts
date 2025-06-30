import { Metadata } from "../api/metadata";

describe("Metadata module", () => {
  it("initializes correctly", () => {
    expect(Metadata.client).toBeTruthy();
  });
});
