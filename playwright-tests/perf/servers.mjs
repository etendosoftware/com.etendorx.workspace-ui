// Starts and stops the `next start` servers of pnpm perf:compare. A server is started in its own process
// group so stopping it also stops `next-server` (killing only `npx` leaves it running on the port), and a
// run never measures a server it did not start: a busy port, a server that exits while starting or a
// server that serves another build all fail the run with an explanation.
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const HEALTH_PATH = "/api/health";
const BUILD_ID_FILE = path.join(".next", "BUILD_ID");
const START_ATTEMPTS = 120;
const START_INTERVAL_MS = 1000;
const STDERR_TAIL_LINES = 20;
const ADDRESS_IN_USE = "EADDRINUSE";
const PROCESS_NOT_FOUND = "ESRCH";

/** Resolves whether something already listens on the port (on any interface, as `next start`). */
export function isPortInUse(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (error) => {
      if (error.code === ADDRESS_IN_USE) {
        resolve(true);
      } else {
        reject(error);
      }
    });
    probe.once("listening", () => probe.close(() => resolve(false)));
    probe.listen(port);
  });
}

/** Explains a busy port and how to free it; the run never kills a process it did not start. */
export const portInUseMessage = (label, port) =>
  [
    `${label}: port ${port} is already in use, probably by a server a previous perf:compare left running.`,
    `Find it with "ss -ltnp | grep :${port}" (or "lsof -i :${port}"), stop it and run again,`,
    "or choose other ports with BASE_PORT / HEAD_PORT.",
  ].join(" ");

/** The id of the last production build of a MainUI directory. */
export const readBuildId = (mainUiDir) => fs.readFileSync(path.join(mainUiDir, BUILD_ID_FILE), "utf8").trim();

/** Whether a page served by `next start` comes from the given build (the id is embedded in the HTML). */
export const servesBuild = (html, buildId) => html.includes(buildId);

/** The last lines of a text, to show why a server stopped. */
export const tailLines = (text, count = STDERR_TAIL_LINES) => text.trim().split("\n").slice(-count).join("\n");

const isHealthy = async (fetchFn, url) => {
  try {
    return (await fetchFn(`${url}${HEALTH_PATH}`)).ok;
  } catch {
    return false;
  }
};

/**
 * Waits until the server answers its health check. Fails as soon as the process exits (a busy port, a
 * broken build) instead of waiting for the timeout, with the end of its error output.
 */
export async function waitUntilServed({
  child,
  url,
  label,
  stderr = () => "",
  fetchFn = fetch,
  attempts = START_ATTEMPTS,
  intervalMs = START_INTERVAL_MS,
}) {
  for (let i = 0; i < attempts; i++) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`${label} server exited while starting:\n${tailLines(stderr())}`);
    }
    if (await isHealthy(fetchFn, url)) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`${label} did not start at ${url}`);
}

/** Stops a server started by `startServer` together with every process of its group (`next-server`). */
export function stopServer(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (error.code !== PROCESS_NOT_FOUND) throw error;
  }
}

/** Fails when the page at `url` does not come from the build in `mainUiDir`. */
async function assertServesBuild({ url, mainUiDir, label, fetchFn }) {
  const buildId = readBuildId(mainUiDir);
  const html = await (await fetchFn(`${url}/`)).text();
  if (!servesBuild(html, buildId)) {
    throw new Error(
      `${label} at ${url} does not serve the build ${buildId} of ${mainUiDir}: another server answers on that port.`
    );
  }
}

/**
 * Serves the production build of `mainUiDir` on `port` and checks it is that build that answers.
 *
 * @returns {Promise<{ child: import("node:child_process").ChildProcess, url: string }>}
 */
export async function startServer({ mainUiDir, port, label, env, log, fetchFn = fetch }) {
  if (await isPortInUse(port)) {
    throw new Error(portInUseMessage(label, port));
  }
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: mainUiDir,
    env,
    detached: true,
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const url = `http://localhost:${port}`;
  try {
    await waitUntilServed({ child, url, label, stderr: () => stderr, fetchFn });
    await assertServesBuild({ url, mainUiDir, label, fetchFn });
  } catch (error) {
    stopServer(child);
    throw error;
  }
  log(`${label} served at ${url}`);
  return { child, url };
}
