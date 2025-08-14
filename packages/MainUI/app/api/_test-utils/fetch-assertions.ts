/**
 * Small test helper to assert the forwarded ERP fetch call and return decoded body for further checks.
 * Centralizes repetitive expectations so tests don't duplicate assertion blocks.
 */
export function assertErpForwardCall(
  expectedUrl: string,
  expectedAuth: string,
  expectedAccept = "application/json",
  expectedContentType?: string
) {
  const [dest, init] = (global as any).fetch.mock.calls[0];
  expect(String(dest)).toBe(expectedUrl);
  expect(init.method).toBe("POST");
  expect(init.headers.Authorization).toBe(expectedAuth);
  expect(init.headers.Accept).toBe(expectedAccept);
  if (expectedContentType !== undefined) {
    expect(init.headers["Content-Type"]).toBe(expectedContentType);
  }

  const decoded = init.body ? decodeURIComponent(init.body as string) : null;
  return { init, decoded };
}

export default assertErpForwardCall;
