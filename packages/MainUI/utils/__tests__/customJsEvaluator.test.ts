import { evaluateCustomJs } from "../customJsEvaluator";
import * as functions from "../functions";
import { logger } from "@/utils/logger";

jest.mock("../functions", () => ({
  executeStringFunction: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("evaluateCustomJs", () => {
  it("should evaluate JS properly", async () => {
    (functions.executeStringFunction as jest.Mock).mockResolvedValue("success");
    const result = await evaluateCustomJs("return 'success';", { record: {}, column: {} as any });
    expect(result).toBe("success");
    expect(functions.executeStringFunction).toHaveBeenCalledWith("return 'success';", expect.any(Object), {
      record: {},
      column: {},
    });
  });

  it("should handle error in evaluation", async () => {
    (functions.executeStringFunction as jest.Mock).mockRejectedValue(new Error("Syntax error"));
    const result = await evaluateCustomJs("bad js", { record: {}, column: {} as any });
    expect(result).toBe("[Error: Syntax error]");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle unknown error objects in evaluation", async () => {
    (functions.executeStringFunction as jest.Mock).mockRejectedValue("string error");
    const result = await evaluateCustomJs("bad js", { record: {}, column: {} as any });
    expect(result).toBe("[Error: Unknown error]");
    expect(logger.error).toHaveBeenCalled();
  });
});
