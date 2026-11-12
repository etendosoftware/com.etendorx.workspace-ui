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

/** Prefix that turns the text of a numeric input into an arithmetic expression, as in Classic (`=2*5`). */
export const MATH_EXPRESSION_PREFIX = "=";

/** Characters a numeric input accepts while the user types an expression. */
const EXPRESSION_ALLOWED_CHARS = /[^\d.,+\-*/()=\s]/g;

/** Whether the text typed in a numeric input is an arithmetic expression. */
export const isMathExpression = (text: string): boolean => text.trimStart().startsWith(MATH_EXPRESSION_PREFIX);

/** Drops the characters that can never be part of an expression, so the user cannot type them. */
export const sanitizeMathExpression = (text: string): string => text.replace(EXPRESSION_ALLOWED_CHARS, "");

/**
 * Evaluates a simple arithmetic expression (`+ - * /`, parentheses, unary minus and decimals) without `eval`.
 * The leading `=` is optional and `decimalSeparator` is accepted as the decimal mark.
 *
 * @returns The result, or `null` when the expression is malformed, divides by zero or is not finite.
 */
export const evaluateMathExpression = (text: string, decimalSeparator = "."): number | null => {
  let source = text.trim();
  if (source.startsWith(MATH_EXPRESSION_PREFIX)) {
    source = source.slice(MATH_EXPRESSION_PREFIX.length);
  }
  // Spaces are allowed around operators, never inside a number ("2 3").
  if (/[\d.,]\s+[\d.,]/.test(source)) {
    return null;
  }
  // With "," as the decimal mark, "." is a thousands separator and is dropped; otherwise "," is dropped.
  source = (decimalSeparator === "," ? source.replace(/\./g, "").replace(",", ".") : source.replace(/,/g, "")).replace(
    /\s+/g,
    ""
  );
  if (source === "") {
    return null;
  }

  let position = 0;
  let failed = false;

  const fail = (): number => {
    failed = true;
    return Number.NaN;
  };

  const parseNumber = (): number => {
    const match = /^\d*\.?\d+|^\d+\.?/.exec(source.slice(position));
    if (!match) {
      return fail();
    }
    position += match[0].length;
    return Number.parseFloat(match[0]);
  };

  const parseFactor = (): number => {
    const char = source[position];
    if (char === "-") {
      position++;
      return -parseFactor();
    }
    if (char === "+") {
      position++;
      return parseFactor();
    }
    if (char === "(") {
      position++;
      const inner = parseExpression();
      if (source[position] !== ")") {
        return fail();
      }
      position++;
      return inner;
    }
    return parseNumber();
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (!failed && (source[position] === "*" || source[position] === "/")) {
      const operator = source[position++];
      const right = parseFactor();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };

  function parseExpression(): number {
    let value = parseTerm();
    while (!failed && (source[position] === "+" || source[position] === "-")) {
      const operator = source[position++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (failed || position !== source.length || !Number.isFinite(result)) {
    return null;
  }
  return result;
};
