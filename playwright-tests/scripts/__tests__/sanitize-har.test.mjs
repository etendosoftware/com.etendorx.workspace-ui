import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { maskBody, sanitizeFiles, sanitizeHar } from "../sanitize-har.mjs";

const JWT = "eyJhbGciOiJIUzI1NiJ9.e30.signature";
const LOGIN_BODY = JSON.stringify({ username: "admin", password: "admin" });

/** A HAR with one login entry carrying every kind of credential. */
function loginHar() {
  return {
    log: {
      version: "1.2",
      entries: [
        {
          request: {
            method: "POST",
            url: "http://localhost:3000/api/auth/login",
            headers: [
              { name: "Authorization", value: `Bearer ${JWT}` },
              { name: "Content-Type", value: "application/json" },
            ],
            cookies: [{ name: "JSESSIONID", value: "abc" }],
            postData: { mimeType: "application/json", text: LOGIN_BODY },
          },
          response: {
            status: 200,
            headers: [{ name: "Set-Cookie", value: "JSESSIONID=abc" }],
            cookies: [{ name: "JSESSIONID", value: "abc" }],
            content: { mimeType: "application/json", text: JSON.stringify({ token: JWT, user: { name: "Admin" } }) },
          },
        },
      ],
    },
  };
}

test("removes auth and cookie headers and cookies, keeping the rest", () => {
  const [entry] = sanitizeHar(loginHar()).log.entries;
  assert.deepEqual(entry.request.headers, [{ name: "Content-Type", value: "application/json" }]);
  assert.deepEqual(entry.response.headers, []);
  assert.deepEqual(entry.request.cookies, []);
  assert.deepEqual(entry.response.cookies, []);
});

test("masks the login password and the session token", () => {
  const [entry] = sanitizeHar(loginHar()).log.entries;
  assert.deepEqual(JSON.parse(entry.request.postData.text), { username: "admin", password: "***" });
  assert.deepEqual(JSON.parse(entry.response.content.text), { token: "e2e-token", user: { name: "Admin" } });
});

test("masks secrets at any depth and keeps non-JSON bodies", () => {
  assert.equal(
    maskBody(JSON.stringify({ data: [{ csrfToken: "x" }] })),
    JSON.stringify({ data: [{ csrfToken: "e2e-csrf" }] })
  );
  assert.equal(maskBody("a=1&b=2"), "a=1&b=2");
  assert.equal(maskBody(""), "");
});

test("rewrites recording files in place", () => {
  const file = join(mkdtempSync(join(tmpdir(), "sanitize-har-")), "pilot.har");
  writeFileSync(file, JSON.stringify(loginHar()));
  sanitizeFiles([file]);
  const text = readFileSync(file, "utf8");
  assert.ok(!text.includes(JWT), "the token is still in the file");
  assert.ok(text.includes("e2e-token"));
});
