import { expect, test } from "@playwright/test";
import * as data from "../registry/data";
import { DATASOURCE } from "../registry/datasources";
import { TABS, WINDOWS } from "../registry/windows";

const RECORD_ID = /^[0-9A-F]{32}$/;
/** AD ids: core ones are numeric, module ones UUIDs. */
const AD_ID = /^([0-9]+|[0-9A-F]{32})$/;
const SAMPLE_CATALOGS = {
  BUSINESS_PARTNER: data.BUSINESS_PARTNER,
  PRODUCT: data.PRODUCT,
  PAYMENT_METHOD: data.PAYMENT_METHOD,
  OFFER_TYPE: data.OFFER_TYPE,
  DOCUMENT_TYPE: data.DOCUMENT_TYPE,
  FINANCIAL_ACCOUNT: data.FINANCIAL_ACCOUNT,
  GL_ITEM: data.GL_ITEM,
  ROLE: data.ROLE,
  LIST_VALUE: data.LIST_VALUE,
};

test.describe("uniqueValue", () => {
  test("keeps the readable base and adds a suffix", () => {
    expect(data.uniqueValue("60d/10")).toMatch(/^60d\/10-[0-9a-z]+$/);
  });

  test("never repeats a value within a run", () => {
    const values = Array.from({ length: 200 }, () => data.uniqueValue("key"));
    expect(new Set(values).size).toBe(values.length);
  });

  test("stays short enough for a 40 character search key", () => {
    expect(data.uniqueValue("Golden House").length).toBeLessThanOrEqual(40);
  });
});

test.describe("uniqueAmounts", () => {
  test("returns the requested count, one unit apart, below 1000", () => {
    const amounts = data.uniqueAmounts(3);
    expect(amounts).toHaveLength(3);
    expect(amounts[1] - amounts[0]).toBeCloseTo(1, 10);
    expect(amounts[2] - amounts[1]).toBeCloseTo(1, 10);
    expect(Math.max(...amounts)).toBeLessThan(1000);
    expect(Math.min(...amounts)).toBeGreaterThanOrEqual(100);
  });

  test("never carries float noise, whatever the clock says", () => {
    const realNow = Date.now;
    const noisy: number[] = [];
    try {
      // 269.46 + 2 gave 271.46000000000004 and 538.68 + 2 gave 540.6800000000001 with the old formula
      for (let clock = 0; clock < 80_000; clock += 1) {
        Date.now = () => clock;
        for (const amount of data.uniqueAmounts(3)) {
          if (amount !== Number(amount.toFixed(2))) noisy.push(amount);
        }
      }
    } finally {
      Date.now = realNow;
    }
    expect(noisy).toEqual([]);
  });
});

test.describe("sample data catalog", () => {
  for (const [catalog, records] of Object.entries(SAMPLE_CATALOGS)) {
    test(`${catalog} entries have a record id and a name`, () => {
      for (const record of Object.values(records)) {
        expect(record.id).toMatch(RECORD_ID);
        expect(record.name).not.toBe("");
      }
    });
  }
});

test.describe("storage bins", () => {
  test("every storage bin has a locator id and a search key", () => {
    for (const bin of Object.values(data.LOCATOR)) {
      expect(bin.id).toMatch(RECORD_ID);
      expect(bin.value).not.toBe("");
    }
  });
});

test.describe("tab registry", () => {
  test("every tab id is an AD_Tab_ID", () => {
    for (const tabId of Object.values(TABS)) {
      expect(tabId).toMatch(AD_ID);
    }
  });
});

test.describe("datasource registry", () => {
  test("every datasource names its entity, window and tab", () => {
    for (const target of Object.values(DATASOURCE)) {
      expect(target.entity).toMatch(/^[A-Z]\w+$/);
      expect(target.windowId).toMatch(AD_ID);
      expect(target.tabId).toMatch(AD_ID);
    }
  });
});

test.describe("window registry", () => {
  test("every window has a search text, a menu id and a breadcrumb", () => {
    for (const window of Object.values(WINDOWS)) {
      expect(window.search.trim()).not.toBe("");
      expect(window.menuId).toMatch(AD_ID);
      expect(window.breadcrumb).toBeInstanceOf(RegExp);
    }
  });

  test("no two windows share a menu entry", () => {
    const menuIds = Object.values(WINDOWS).map((window) => window.menuId);
    expect(new Set(menuIds).size).toBe(menuIds.length);
  });

  test("list-only views land on the grid", () => {
    expect(WINDOWS.processRequest.landing).toBe("grid");
    expect(WINDOWS.manageRequisitions.landing).toBe("grid");
  });
});
