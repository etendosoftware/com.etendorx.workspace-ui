import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  isPortInUse,
  portInUseMessage,
  readBuildId,
  servesBuild,
  startServer,
  stopServer,
  tailLines,
  waitUntilServed,
} from "../servers.mjs";

const LABEL = "head";
const URL = "http://localhost:1";
const BUILD_ID = "Rrg7LfCJ3RXggbOF6BoZn";

/** A child process still running, or one that exited with the given code. */
const fakeChild = (exitCode = null) => ({ exitCode, signalCode: null });
const healthResponse = (ok) => async () => ({ ok });

/** Runs `fn` with a TCP server listening on a free port, as a leftover `next-server` would. */
async function withBusyPort(fn) {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    return await fn(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

test("isPortInUse tells a busy port from a free one", async () => {
  const port = await withBusyPort(async (busyPort) => {
    assert.equal(await isPortInUse(busyPort), true);
    return busyPort;
  });
  assert.equal(await isPortInUse(port), false);
});

test("portInUseMessage names the port and how to free it", () => {
  const message = portInUseMessage(LABEL, 3202);
  assert.match(message, /^head: port 3202 is already in use/);
  assert.match(message, /ss -ltnp \| grep :3202/);
  assert.match(message, /BASE_PORT \/ HEAD_PORT/);
});

test("readBuildId reads the id of the last build", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-servers-"));
  fs.mkdirSync(path.join(dir, ".next"));
  fs.writeFileSync(path.join(dir, ".next", "BUILD_ID"), `${BUILD_ID}\n`);
  assert.equal(readBuildId(dir), BUILD_ID);
  fs.rmSync(dir, { recursive: true });
});

test("servesBuild finds the build id embedded in the served page", () => {
  assert.equal(servesBuild(`self.__next_f.push([1,"0:{\\"b\\":\\"${BUILD_ID}\\"}"])`, BUILD_ID), true);
  assert.equal(servesBuild('{"b":"anotherBuildId"}', BUILD_ID), false);
});

test("tailLines keeps the last lines", () => {
  assert.equal(tailLines("a\nb\nc\n", 2), "b\nc");
});

test("waitUntilServed returns once the health check answers", async () => {
  await waitUntilServed({ child: fakeChild(), url: URL, label: LABEL, fetchFn: healthResponse(true), intervalMs: 0 });
});

test("waitUntilServed retries while the server is not up", async () => {
  let calls = 0;
  const fetchFn = async () => {
    calls += 1;
    if (calls === 1) throw new Error("ECONNREFUSED");
    return { ok: calls > 2 };
  };
  await waitUntilServed({ child: fakeChild(), url: URL, label: LABEL, fetchFn, intervalMs: 0 });
  assert.equal(calls, 3);
});

test("waitUntilServed fails with the error output when the server exits", async () => {
  await assert.rejects(
    waitUntilServed({
      child: fakeChild(1),
      url: URL,
      label: LABEL,
      stderr: () => "Error: listen EADDRINUSE: address already in use :::3202\n",
      fetchFn: healthResponse(true),
    }),
    /head server exited while starting:\nError: listen EADDRINUSE/
  );
});

test("waitUntilServed fails when the server never answers", async () => {
  await assert.rejects(
    waitUntilServed({
      child: fakeChild(),
      url: URL,
      label: LABEL,
      fetchFn: healthResponse(false),
      attempts: 2,
      intervalMs: 0,
    }),
    /head did not start at http:\/\/localhost:1/
  );
});

test("stopServer stops the whole process group, not only its first process", async () => {
  // `sh` starts `sleep` as a child, as `npx` starts `next-server`
  const child = spawn("sh", ["-c", "sleep 30 & echo $!; wait"], {
    detached: true,
    stdio: ["ignore", "pipe", "ignore"],
  });
  const grandchildPid = Number(await new Promise((resolve) => child.stdout.once("data", resolve)));
  assert.equal(isAlive(grandchildPid), true);

  stopServer(child);
  await new Promise((resolve) => child.once("exit", resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.equal(isAlive(grandchildPid), false);
  stopServer(child); // already stopped: nothing to do
});

test("startServer refuses a busy port instead of measuring the server on it", async () => {
  await withBusyPort((port) =>
    assert.rejects(
      startServer({ mainUiDir: os.tmpdir(), port, label: LABEL, env: process.env, log: () => {} }),
      new RegExp(`head: port ${port} is already in use`)
    )
  );
});
