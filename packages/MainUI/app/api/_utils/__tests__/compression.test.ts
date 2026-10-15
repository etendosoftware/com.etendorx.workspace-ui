/**
 * @jest-environment node
 */
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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { gunzipSync } from "node:zlib";
import { withCompression } from "../compression";

const BIG_JSON = JSON.stringify({ rows: Array.from({ length: 200 }, (_, i) => ({ id: i, name: `row ${i}` })) });

const request = (acceptEncoding?: string) =>
  new Request("http://localhost/api/erp/meta/window/167", {
    headers: acceptEncoding ? { "accept-encoding": acceptEncoding } : {},
  });

const json = (body: string, init: ResponseInit = {}) =>
  new Response(body, { ...init, headers: { "content-type": "application/json;charset=UTF-8", ...init.headers } });

describe("withCompression", () => {
  it("gzips a JSON body the client accepts, keeping status and headers", async () => {
    const response = withCompression(
      request("gzip, deflate, br"),
      json(BIG_JSON, { status: 200, headers: { etag: '"abc"', "set-cookie": "a=1" } })
    );

    expect(response.headers.get("content-encoding")).toBe("gzip");
    expect(response.headers.get("vary")).toContain("Accept-Encoding");
    expect(response.headers.get("etag")).toBe('"abc"');
    expect(response.headers.get("content-length")).toBeNull();
    const compressed = Buffer.from(await response.arrayBuffer());
    expect(compressed.length).toBeLessThan(BIG_JSON.length);
    expect(gunzipSync(compressed).toString()).toBe(BIG_JSON);
  });

  it.each([
    ["the client does not accept gzip", request(), json(BIG_JSON)],
    [
      "the body is an event stream",
      request("gzip"),
      new Response(BIG_JSON, { headers: { "content-type": "text/event-stream" } }),
    ],
    ["the body is binary", request("gzip"), new Response(BIG_JSON, { headers: { "content-type": "application/pdf" } })],
    ["the body is already encoded", request("gzip"), json(BIG_JSON, { headers: { "content-encoding": "br" } })],
    ["the body is small", request("gzip"), json("{}", { headers: { "content-length": "2" } })],
    ["there is no body (304)", request("gzip"), new Response(null, { status: 304, headers: { etag: '"abc"' } })],
  ])("leaves the response as is when %s", (_case, req, res) => {
    expect(withCompression(req, res)).toBe(res);
  });
});
