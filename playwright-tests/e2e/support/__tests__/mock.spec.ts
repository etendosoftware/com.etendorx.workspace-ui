import { expect, test } from "@playwright/test";
import { canonicalBody, canonicalUrl, requestKey } from "../mock/normalize";
import { type HarEntry, RecordedResponses } from "../mock/replay";

const DATASOURCE = "http://localhost:3000/api/datasource";
const SESSION = "http://localhost:3000/api/erp/meta/session";

function entry(url: string, text: string, postData?: string): HarEntry {
  return {
    request: { method: "POST", url, ...(postData && { postData: { text: postData } }) },
    response: { status: 200, content: { mimeType: "application/json", text } },
  };
}

test.describe("request keys", () => {
  test("ignore the order and the volatile query parameters", () => {
    expect(canonicalUrl(`${SESSION}?b=2&language=en_US&a=1&_noCache=123`)).toBe("/api/erp/meta/session?a=1&b=2");
    expect(canonicalUrl(SESSION)).toBe("/api/erp/meta/session");
  });

  test("ignore the order and the volatile properties of a JSON body, at any depth", () => {
    const a = canonicalBody(JSON.stringify({ entity: "Order", params: { b: 1, csrfToken: "x", a: [{ z: 1, y: 2 }] } }));
    const b = canonicalBody(JSON.stringify({ params: { a: [{ y: 2, z: 1 }], b: 1 }, entity: "Order" }));
    expect(a).toBe(b);
  });

  test("ignore the load time selector requests carry", () => {
    const selector = (recordTime: string) => JSON.stringify({ params: { fieldId: "1573", recordTime } });
    expect(canonicalBody(selector("1792585608604"))).toBe(canonicalBody(selector("1792585611811")));
  });

  test("ignore the login password", () => {
    const login = (password: string) => JSON.stringify({ username: "admin", password });
    expect(canonicalBody(login("admin"))).toBe(canonicalBody(login("***")));
  });

  test("keep bodies that are not JSON as they are", () => {
    expect(canonicalBody("a=1&b=2")).toBe("a=1&b=2");
    expect(canonicalBody(undefined)).toBe("");
  });

  test("tell apart method, path, query and body", () => {
    const base = { method: "POST", url: `${DATASOURCE}?x=1`, postData: '{"entity":"Order"}' };
    const keys = new Set([
      requestKey(base),
      requestKey({ ...base, method: "GET" }),
      requestKey({ ...base, url: `${DATASOURCE}?x=2` }),
      requestKey({ ...base, postData: '{"entity":"Invoice"}' }),
    ]);
    expect(keys.size).toBe(4);
    expect(requestKey({ ...base, method: "post" })).toBe(requestKey(base));
  });
});

test.describe("recorded responses", () => {
  const recordings = new RecordedResponses([
    entry(DATASOURCE, '{"n":1}', '{"entity":"Order"}'),
    entry(DATASOURCE, '{"n":2}', '{"entity":"Order"}'),
    entry(SESSION, "{}"),
  ]);
  const orderKey = requestKey({ method: "POST", url: DATASOURCE, postData: '{"entity":"Order"}' });

  test("index the entries by request key", () => {
    expect(recordings.size).toBe(2);
  });

  test("answer a repeated key in recording order and then repeat the last response", () => {
    expect([1, 2, 3].map(() => recordings.next(orderKey)?.body)).toEqual(['{"n":1}', '{"n":2}', '{"n":2}']);
  });

  test("have no answer for a key never recorded", () => {
    expect(recordings.next(requestKey({ method: "GET", url: DATASOURCE }))).toBeUndefined();
  });
});
