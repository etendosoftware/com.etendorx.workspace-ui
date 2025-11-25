/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { isEmptyObject, isEmptyArray, extractValue, extractKeyValuePairs } from "../commons";

describe("commons utilities", () => {
  describe("isEmptyObject", () => {
    it("should return true for empty objects", () => {
      const result = isEmptyObject({});
      expect(result).toBe(true);
    });

    it("should return false for objects with properties", () => {
      const result = isEmptyObject({ key: "value" });
      expect(result).toBe(false);
    });

    it("should return true for null", () => {
      const result = isEmptyObject(null);
      expect(result).toBe(true);
    });

    it("should return true for undefined", () => {
      const result = isEmptyObject(undefined);
      expect(result).toBe(true);
    });

    it("should return false for objects with multiple properties", () => {
      const result = isEmptyObject({ a: 1, b: 2, c: 3 });
      expect(result).toBe(false);
    });

    it("should return false for objects with null values", () => {
      const result = isEmptyObject({ key: null });
      expect(result).toBe(false);
    });

    it("should return false for objects with undefined values", () => {
      const result = isEmptyObject({ key: undefined });
      expect(result).toBe(false);
    });

    it("should return false for objects with false values", () => {
      const result = isEmptyObject({ active: false });
      expect(result).toBe(false);
    });

    it("should return false for objects with 0 values", () => {
      const result = isEmptyObject({ count: 0 });
      expect(result).toBe(false);
    });

    it("should return false for objects with empty string values", () => {
      const result = isEmptyObject({ name: "" });
      expect(result).toBe(false);
    });
  });

  describe("isEmptyArray", () => {
    it("should return true for empty arrays", () => {
      const result = isEmptyArray([]);
      expect(result).toBe(true);
    });

    it("should return false for arrays with elements", () => {
      const result = isEmptyArray([1, 2, 3]);
      expect(result).toBe(false);
    });

    it("should return true for null", () => {
      const result = isEmptyArray(null);
      expect(result).toBe(true);
    });

    it("should return true for undefined", () => {
      const result = isEmptyArray(undefined);
      expect(result).toBe(true);
    });

    it("should return false for arrays with single element", () => {
      const result = isEmptyArray([1]);
      expect(result).toBe(false);
    });

    it("should return false for arrays with null elements", () => {
      const result = isEmptyArray([null, null]);
      expect(result).toBe(false);
    });

    it("should return false for arrays with undefined elements", () => {
      const result = isEmptyArray([undefined]);
      expect(result).toBe(false);
    });

    it("should return false for arrays with falsy values", () => {
      const result = isEmptyArray([0, false, ""]);
      expect(result).toBe(false);
    });

    it("should return false for arrays with mixed types", () => {
      const result = isEmptyArray([1, "two", { three: 3 }, null]);
      expect(result).toBe(false);
    });

    it("should work with string arrays", () => {
      expect(isEmptyArray(["a", "b"])).toBe(false);
      expect(isEmptyArray([])).toBe(true);
    });

    it("should work with object arrays", () => {
      const arr = [{ id: 1 }, { id: 2 }];
      expect(isEmptyArray(arr)).toBe(false);
    });
  });

  describe("extractValue", () => {
    it("should return first non-empty value from keys", () => {
      const obj = { name: "", username: "jdoe", email: "jdoe@example.com" };
      const result = extractValue(obj, ["name", "username", "email"], "N/A");
      expect(result).toBe("jdoe");
    });

    it("should return default value when all keys are empty", () => {
      const obj = { a: null, b: "", c: undefined };
      const result = extractValue(obj, ["a", "b", "c"], "default");
      expect(result).toBe("default");
    });

    it("should skip null values", () => {
      const obj = { first: null, second: "value" };
      const result = extractValue(obj, ["first", "second"], "fallback");
      expect(result).toBe("value");
    });

    it("should skip undefined values", () => {
      const obj = { first: undefined, second: "found" };
      const result = extractValue(obj, ["first", "second"], "fallback");
      expect(result).toBe("found");
    });

    it("should skip empty strings", () => {
      const obj = { a: "", b: "", c: "result" };
      const result = extractValue(obj, ["a", "b", "c"], "default");
      expect(result).toBe("result");
    });

    it("should return first key value even if it's not first in array", () => {
      const obj = { z: "first", a: "second", m: "third" };
      const result = extractValue(obj, ["z", "a", "m"], "default");
      expect(result).toBe("first");
    });

    it("should convert non-string values to string", () => {
      const obj = { num: 42, str: "", bool: false };
      const result = extractValue(obj, ["str", "num"], "default");
      expect(result).toBe("42");
      expect(typeof result).toBe("string");
    });

    it("should handle zero as a valid value", () => {
      const obj = { count: 0, name: "fallback" };
      const result = extractValue(obj, ["count", "name"], "default");
      expect(result).toBe("0");
    });

    it("should handle false as a valid value", () => {
      const obj = { active: false, status: "fallback" };
      const result = extractValue(obj, ["active", "status"], "default");
      expect(result).toBe("false");
    });

    it("should handle single key array", () => {
      const obj = { only: "value" };
      const result = extractValue(obj, ["only"], "default");
      expect(result).toBe("value");
    });

    it("should return default for single missing key", () => {
      const obj = { other: "value" } as Record<string, unknown>;
      const result = extractValue(obj, ["missing"] as (keyof typeof obj)[], "default");
      expect(result).toBe("default");
    });

    it("should work with objects containing many keys", () => {
      const obj = {
        a: "",
        b: null,
        c: undefined,
        d: "",
        e: "found",
        f: "not reached",
      };
      const result = extractValue(obj, ["a", "b", "c", "d", "e", "f"], "default");
      expect(result).toBe("found");
    });

    it("should preserve numeric strings", () => {
      const obj = { id: "123", name: "" };
      const result = extractValue(obj, ["name", "id"], "default");
      expect(result).toBe("123");
    });

    it("should handle objects with symbol-like property names", () => {
      const obj = { _id: "from_id", normal: "" };
      const result = extractValue(obj, ["normal", "_id"], "default");
      expect(result).toBe("from_id");
    });
  });

  describe("extractKeyValuePairs", () => {
    it("should extract values from nested value properties", () => {
      const input = {
        fieldA: { value: "hello", meta: "..." },
        fieldB: { value: "world", meta: "..." },
      };
      const result = extractKeyValuePairs(input);
      expect(result).toEqual({
        fieldA: "hello",
        fieldB: "world",
      });
    });

    it("should convert null values to empty strings", () => {
      const input = {
        field: { value: null },
      };
      const result = extractKeyValuePairs(input);
      expect(result.field).toBe("");
    });

    it("should convert undefined values to empty strings", () => {
      const input = {
        field: { value: undefined },
      };
      const result = extractKeyValuePairs(input);
      expect(result.field).toBe("");
    });

    it("should convert numeric values to strings", () => {
      const input = {
        count: { value: 42 },
        price: { value: 19.99 },
      };
      const result = extractKeyValuePairs(input);
      expect(result.count).toBe("42");
      expect(result.price).toBe("19.99");
      expect(typeof result.count).toBe("string");
      expect(typeof result.price).toBe("string");
    });

    it("should convert boolean values to strings", () => {
      const input = {
        active: { value: true },
        deleted: { value: false },
      };
      const result = extractKeyValuePairs(input);
      expect(result.active).toBe("true");
      expect(result.deleted).toBe("false");
    });

    it("should handle empty input object", () => {
      const input = {};
      const result = extractKeyValuePairs(input);
      expect(result).toEqual({});
    });

    it("should preserve string values as-is", () => {
      const input = {
        name: { value: "John Doe" },
        email: { value: "john@example.com" },
      };
      const result = extractKeyValuePairs(input);
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
    });

    it("should handle zero values", () => {
      const input = {
        zero: { value: 0 },
      };
      const result = extractKeyValuePairs(input);
      expect(result.zero).toBe("0");
    });

    it("should handle empty string values", () => {
      const input = {
        empty: { value: "" },
      };
      const result = extractKeyValuePairs(input);
      expect(result.empty).toBe("");
    });

    it("should handle objects with many fields", () => {
      const input = {
        field1: { value: "value1", extra: "data" },
        field2: { value: "value2", extra: "data" },
        field3: { value: "value3", extra: "data" },
        field4: { value: null, extra: "data" },
        field5: { value: 123, extra: "data" },
      };
      const result = extractKeyValuePairs(input);
      expect(result).toEqual({
        field1: "value1",
        field2: "value2",
        field3: "value3",
        field4: "",
        field5: "123",
      });
    });

    it("should handle special characters in keys", () => {
      const input = {
        "field-name": { value: "hyphenated" },
        "field_name": { value: "underscored" },
        fieldName: { value: "camelCase" },
      };
      const result = extractKeyValuePairs(input);
      const fieldNameKey = "field-name";
      const fieldUnderscoreKey = "field_name";
      expect(result[fieldNameKey]).toBe("hyphenated");
      expect(result[fieldUnderscoreKey]).toBe("underscored");
      expect(result.fieldName).toBe("camelCase");
    });

    it("should ignore extra properties in value objects", () => {
      const input = {
        field: { value: "keep", extra: "ignore", meta: "ignore" },
      };
      const result = extractKeyValuePairs(input);
      expect(result.field).toBe("keep");
      expect(Object.keys(result)).toEqual(["field"]);
    });

    it("should convert array values to string", () => {
      const input = {
        tags: { value: ["a", "b", "c"] },
      };
      const result = extractKeyValuePairs(input);
      expect(result.tags).toBe("a,b,c");
    });

    it("should convert object values to string representation", () => {
      const input = {
        data: { value: { nested: "object" } },
      };
      const result = extractKeyValuePairs(input);
      expect(typeof result.data).toBe("string");
      expect(result.data).toBe("[object Object]");
    });
  });

  describe("Integration tests", () => {
    it("should work together with isEmptyObject and isEmptyArray", () => {
      const obj = { items: [] };
      const arr: unknown[] = [];

      expect(isEmptyObject(obj)).toBe(false);
      expect(isEmptyArray(arr)).toBe(true);
    });

    it("should handle typical form data scenario", () => {
      const formData = {
        firstName: { value: "John" },
        lastName: { value: "Doe" },
        email: { value: "john@example.com" },
        phone: { value: null },
        active: { value: true },
      };

      const extracted = extractKeyValuePairs(formData);
      expect(extracted.firstName).toBe("John");
      expect(extracted.lastName).toBe("Doe");
      expect(extracted.email).toBe("john@example.com");
      expect(extracted.phone).toBe("");
      expect(extracted.active).toBe("true");
    });

    it("should handle user preference fallback scenario", () => {
      const user = {
        _identifier: null,
        displayName: "",
        firstName: "Jane",
        lastName: "Smith",
      };

      const displayName = extractValue(
        user,
        ["_identifier", "displayName", "firstName", "lastName"],
        "Anonymous"
      );

      expect(displayName).toBe("Jane");
    });
  });
});
