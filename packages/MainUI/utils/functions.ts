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

/**
 * Executes a JavaScript function defined as a string, injecting a custom context and arguments.
 *
 * @param {string} code - A string containing the body of a JavaScript function.
 * @param {Record<string, unknown>} [context={}] - An optional object with key-value pairs to inject as variables in the function scope.
 * @param {...unknown} args - Arguments to pass to the evaluated function when called.
 * @returns {Promise<unknown>} - Returns the result of the executed function (awaited if it's asynchronous).
 *
 * @example
 * const code = "(a, b) => a + b";
 * const result = await executeStringFunction(code, {}, 2, 3);
 * console.log(result); // 5
 *
 * @example
 * const code = "(user) => `Hello, ${user}`";
 * const context = {};
 * const result = await executeStringFunction(code, context, "Luciano");
 * console.log(result); // "Hello, Luciano"
 *
 * @example
 * const code = "(a, b) => db.add(a, b)";
 * const context = { db: { add: (x, y) => x + y } };
 * const result = await executeStringFunction(code, context, 5, 7);
 * console.log(result); // 12
 *
 * WARNING: Executing code from strings is dangerous. Only use with trusted input.
 * Consider validating or restricting the code parameter to prevent code injection attacks.
 */

export async function executeStringFunction(code: string, context = {}, ...args: unknown[]) {
  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);
  // .trim() prevents ASI issues when the string starts with a newline
  // (e.g. template literals: `\nasync (...) => {}`)
  const fn = new Function(...contextKeys, `return ${code.trim()}`);
  const evaluatedFn = fn(...contextValues);

  return await evaluatedFn(...args);
}
