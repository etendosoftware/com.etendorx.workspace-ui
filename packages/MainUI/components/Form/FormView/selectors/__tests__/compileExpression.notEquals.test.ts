import { compileExpression } from "../BaseSelector";

/**
 * Display logic written with the Classic aliases of "not equal to" (ETP-5996): `^` and `-` mean the same as
 * `!`. The Region tab of Country and Region is the example of the ticket: shown for Spain (has regions),
 * hidden for Andorra.
 */
describe("compileExpression — ^ and - as not-equals", () => {
  it.each(["!", "^", "-"])("shows the tab only when HasRegion is not N (operator %s)", (op) => {
    const visible = compileExpression(`@HasRegion@${op}'N'`);

    expect(visible({ HasRegion: "Y" }, { HasRegion: "Y" })).toBe(true); // Spain
    expect(visible({ HasRegion: "N" }, { HasRegion: "N" })).toBe(false); // Andorra
  });

  it.each(["^", "-"])("works inside a larger condition (operator %s)", (op) => {
    const expression = compileExpression(`@Status@${op}'CO'&@Processed@='N'`);

    expect(expression({ Status: "DR", Processed: "N" }, { Status: "DR", Processed: "N" })).toBe(true);
    expect(expression({ Status: "CO", Processed: "N" }, { Status: "CO", Processed: "N" })).toBe(false);
  });

  it("keeps the numeric subtraction of other expressions", () => {
    const expression = compileExpression("@Qty@-1=4");

    expect(expression({ Qty: 5 }, { Qty: 5 })).toBe(true);
  });
});
