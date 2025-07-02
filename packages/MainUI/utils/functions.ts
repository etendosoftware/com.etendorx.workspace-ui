export async function executeStringFunction(code: string, context = {}, ...args: unknown[]) {
  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);
  const fn = new Function(...contextKeys, `return ${code}`);
  const evaluatedFn = fn(...contextValues);

  return await evaluatedFn(...args);
}
