import { executeLogic, resolveMutualExclusion, type PayScriptRules } from "../LogicEngine";

describe("LogicEngine", () => {
  describe("executeLogic", () => {
    it("should return success with empty results for rules with no phases", () => {
      const rules: PayScriptRules = { id: "test" };
      const result = executeLogic(rules, {});
      expect(result.success).toBe(true);
      expect(result.computed).toEqual({});
      expect(result.validations).toEqual([]);
    });

    it("should execute compute phase", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (ctx, util) => ({
          total: util.num(ctx.amount).toNumber(),
        }),
      };
      const result = executeLogic(rules, { amount: "100.50" });
      expect(result.success).toBe(true);
      expect(result.computed?.total).toBe(100.5);
    });

    it("should execute transform phase with computed values", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: () => ({ doubled: 20 }),
        transform: (_ctx, computed) => ({
          invoices: { total: computed.doubled },
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.success).toBe(true);
      expect(result.invoices).toEqual({ total: 20 });
    });

    it("should execute validate phase", () => {
      const rules: PayScriptRules = {
        id: "test",
        validate: () => [{ id: "v1", isValid: false, message: "Amount is zero", severity: "error" }],
      };
      const result = executeLogic(rules, {});
      expect(result.validations).toHaveLength(1);
      expect(result.validations?.[0].isValid).toBe(false);
    });

    it("should handle errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const rules: PayScriptRules = {
        id: "test",
        compute: () => {
          throw new Error("Test error");
        },
      };
      const result = executeLogic(rules, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
      consoleSpy.mockRestore();
    });
  });

  describe("util functions", () => {
    it("util.num should parse various types", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          fromString: util.num("42.5").toNumber(),
          fromNumber: util.num(10).toNumber(),
          fromCommaString: util.num("1,234.56").toNumber(),
          fromNull: util.num(null).toNumber(),
          fromUndefined: util.num(undefined).toNumber(),
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.fromString).toBe(42.5);
      expect(result.computed?.fromNumber).toBe(10);
      expect(result.computed?.fromCommaString).toBe(1234.56);
      expect(result.computed?.fromNull).toBe(0);
      expect(result.computed?.fromUndefined).toBe(0);
    });

    it("util.sum should sum array field values", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          total: util.sum([{ amount: 10 }, { amount: 20 }, { amount: 30 }], "amount").toNumber(),
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.total).toBe(60);
    });

    it("util.sum should support function accessor", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          total: util.sum([{ a: 5 }, { a: 15 }], (item) => item.a).toNumber(),
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.total).toBe(20);
    });

    it("util.sum should handle null/undefined array", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          total: util.sum(null as any, "amount").toNumber(),
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.total).toBe(0);
    });

    it("util.convert should convert currencies", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          converted: util.convert(100, 1.5, 1, 2).toNumber(),
        }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.converted).toBe(150);
    });

    it("util.val should get context values", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          direct: util.val("myKey"),
          withInp: util.val("otherKey"),
          missing: util.val("nonexistent"),
        }),
      };
      const result = executeLogic(rules, { myKey: "hello", inpotherKey: "world" });
      expect(result.computed?.direct).toBe("hello");
      expect(result.computed?.withInp).toBe("world");
      expect(result.computed?.missing).toBeUndefined();
    });

    it("util.valNum should return numeric value", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          num: util.valNum("amount"),
        }),
      };
      const result = executeLogic(rules, { amount: "42.5" });
      expect(result.computed?.num).toBe(42.5);
    });

    it("util.valStr should return string value", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          str: util.valStr("name"),
          empty: util.valStr("missing"),
        }),
      };
      const result = executeLogic(rules, { name: 123 });
      expect(result.computed?.str).toBe("123");
      expect(result.computed?.empty).toBe("");
    });

    it("util.valBool should return boolean value", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          fromBool: util.valBool("boolField"),
          fromY: util.valBool("yField"),
          fromTrue: util.valBool("trueField"),
          fromYes: util.valBool("yesField"),
          fromNo: util.valBool("noField"),
          fromMissing: util.valBool("missing"),
        }),
      };
      const result = executeLogic(rules, {
        boolField: true,
        yField: "Y",
        trueField: "true",
        yesField: "yes",
        noField: "N",
      });
      expect(result.computed?.fromBool).toBe(true);
      expect(result.computed?.fromY).toBe(true);
      expect(result.computed?.fromTrue).toBe(true);
      expect(result.computed?.fromYes).toBe(true);
      expect(result.computed?.fromNo).toBe(false);
      expect(result.computed?.fromMissing).toBe(false);
    });

    it("util.getGridItems should extract grid selection items", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          items: util.getGridItems(["amount"]),
        }),
      };
      const context = {
        _gridSelection: {
          invoices: {
            _selection: [
              { id: "1", amount: "100.50" },
              { id: "2", amount: "200" },
            ],
          },
        },
      };
      const result = executeLogic(rules, context);
      const items = result.computed?.items;
      expect(items).toHaveLength(2);
      expect(items[0].amount).toBe(100.5);
      expect(items[0].selected).toBe(true);
      expect(items[0].obSelected).toBe(true);
    });

    it("util.getGridItems should filter by grid name", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          items: util.getGridItems([], ["invoices"]),
        }),
      };
      const context = {
        _gridSelection: {
          invoices: { _selection: [{ id: "1" }] },
          credits: { _selection: [{ id: "2" }] },
        },
      };
      const result = executeLogic(rules, context);
      expect(result.computed?.items).toHaveLength(1);
      expect(result.computed?.items[0].id).toBe("1");
    });

    it("util.getGridItems should ignore _allRows", () => {
      // Pick & Execute semantics: only rows the user picked count as "items".
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({ items: util.getGridItems([], ["glitem"]) }),
      };
      const context = {
        _gridSelection: {
          glitem: { _selection: [], _allRows: [{ id: "row-1" }, { id: "row-2" }] },
        },
      };
      const result = executeLogic(rules, context);
      expect(result.computed?.items).toEqual([]);
    });

    it("util.getAllGridRows should return every row from _allRows", () => {
      // Input-style grids (e.g. GL Items) have obuiappShowSelect=false; all rows are input.
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({ rows: util.getAllGridRows([], ["glitem"]) }),
      };
      const context = {
        _gridSelection: {
          glitem: {
            _selection: [],
            _allRows: [
              { id: "row-1", paid_out: 10 },
              { id: "row-2", paid_out: 20 },
            ],
          },
        },
      };
      const result = executeLogic(rules, context);
      expect(result.computed?.rows).toHaveLength(2);
      expect(result.computed?.rows.map((r: { id: string }) => r.id)).toEqual(["row-1", "row-2"]);
    });

    it("util.getAllGridRows should parse numeric fields like getGridItems", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          rows: util.getAllGridRows(["received_in", "paid_out"], ["glitem"]),
        }),
      };
      const context = {
        _gridSelection: {
          glitem: {
            _selection: [],
            _allRows: [{ id: "row-1", received_in: "100.50", paid_out: "1,000" }],
          },
        },
      };
      const result = executeLogic(rules, context);
      expect(result.computed?.rows[0].received_in).toBe(100.5);
      expect(result.computed?.rows[0].paid_out).toBe(1000);
      expect(result.computed?.rows[0].selected).toBe(true);
      expect(result.computed?.rows[0].obSelected).toBe(true);
    });

    it("util.getAllGridRows should filter by grid name", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({ rows: util.getAllGridRows([], ["glitem"]) }),
      };
      const context = {
        _gridSelection: {
          glitem: { _allRows: [{ id: "keep" }] },
          order_invoice: { _allRows: [{ id: "drop" }] },
        },
      };
      const result = executeLogic(rules, context);
      expect(result.computed?.rows).toHaveLength(1);
      expect(result.computed?.rows[0].id).toBe("keep");
    });

    it("util.getAllGridRows should return [] when _gridSelection is missing", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({ rows: util.getAllGridRows() }),
      };
      const result = executeLogic(rules, {});
      expect(result.computed?.rows).toEqual([]);
    });

    it("util.distributeAmount should distribute amount across items", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          items: util.distributeAmount(
            [
              { amount: 0, outstandingAmount: 50 },
              { amount: 0, outstandingAmount: 80 },
            ],
            100
          ),
        }),
      };
      const result = executeLogic(rules, {});
      const items = result.computed?.items;
      expect(items[0].amount).toBe(50);
      expect(items[1].amount).toBe(50);
    });

    it("util.distributeAmount should respect pre-allocated amounts", () => {
      const rules: PayScriptRules = {
        id: "test",
        compute: (_ctx, util) => ({
          items: util.distributeAmount(
            [
              { amount: 30, outstandingAmount: 50 },
              { amount: 0, outstandingAmount: 80 },
            ],
            100
          ),
        }),
      };
      const result = executeLogic(rules, {});
      const items = result.computed?.items;
      expect(items[0].amount).toBe(30);
      expect(items[1].amount).toBe(70);
    });
  });

  describe("resolveMutualExclusion", () => {
    const makeRules = (fieldInteractions?: PayScriptRules["fieldInteractions"]): PayScriptRules => ({
      id: "test",
      fieldInteractions,
    });

    it("returns {} when rules have no fieldInteractions", () => {
      expect(resolveMutualExclusion(makeRules(), "glitem", { received_in: 50 })).toEqual({});
    });

    it("returns {} when the grid has no mutualExclusion entry", () => {
      const rules = makeRules({ glitem: {} });
      expect(resolveMutualExclusion(rules, "glitem", { received_in: 50 })).toEqual({});
    });

    it("returns {} when the gridName is absent from fieldInteractions", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "order_invoice", { received_in: 50 })).toEqual({});
    });

    it("zeroes the second column of a pair when the first is edited non-zero", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "glitem", { received_in: 50 })).toEqual({ paid_out: 0 });
    });

    it("zeroes the first column when the second is edited non-zero (reciprocal)", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "glitem", { paid_out: 30 })).toEqual({ received_in: 0 });
    });

    it("returns {} when the edited value is 0 (clearing should not touch the sibling)", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "glitem", { received_in: 0 })).toEqual({});
    });

    it("treats null and empty string as zero (no patch)", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "glitem", { received_in: null })).toEqual({});
      expect(resolveMutualExclusion(rules, "glitem", { received_in: "" })).toEqual({});
    });

    it("parses numeric strings", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      expect(resolveMutualExclusion(rules, "glitem", { received_in: "12.5" })).toEqual({ paid_out: 0 });
    });

    it("matches HQL keys when both DB and HQL pairs are declared", () => {
      const rules = makeRules({
        glitem: {
          mutualExclusion: [
            ["received_in", "paid_out"],
            ["receivedIn", "paidOut"],
          ],
        },
      });
      expect(resolveMutualExclusion(rules, "glitem", { receivedIn: 50 })).toEqual({ paidOut: 0 });
    });

    it("emits sibling zeros for both pair members when both are edited in the same event (last write wins)", () => {
      const rules = makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } });
      const patch = resolveMutualExclusion(rules, "glitem", { received_in: 50, paid_out: 100 });
      expect(patch).toEqual({ paid_out: 0, received_in: 0 });
    });
  });
});
