// How busy the machine is while perf:compare measures, from the CPU time counters of the OS (all processes).
// Every round runs the same browser, servers and backend work, so a round much busier than the quietest one
// had something else running at the same time (a browser, an IDE build...) and its timings are less reliable.
import fs from "node:fs";
import os from "node:os";

/** Above this share of CPU in use before starting, the machine is already busy. */
export const IDLE_MAX_BUSY_PCT = 25;
/** A round this many points busier than the quietest round of the run had extra load. */
export const EXTRA_LOAD_PCT = 15;

/**
 * A round whose container was held back this long by its CPU quota (cgroup throttling) had less CPU than
 * the others. Provisional: calibrated with the runs of the automatic PR check (ETP-6295).
 */
export const THROTTLED_WARN_MS = 2000;
/** CPU statistics of the cgroup the process runs in (cgroup v2), present inside a container. */
const CGROUP_CPU_STAT = "/sys/fs/cgroup/cpu.stat";

/** Idle and total CPU time of all cores, in ms. */
export const cpuTimes = (cpus = os.cpus()) =>
  cpus.reduce(
    (acc, { times }) => {
      const total = times.user + times.nice + times.sys + times.idle + times.irq;
      return { idle: acc.idle + times.idle, total: acc.total + total };
    },
    { idle: 0, total: 0 }
  );

/** Share of CPU in use between two `cpuTimes` samples, 0-100. */
export function busyPct(start, end) {
  const total = end.total - start.total;
  if (total <= 0) return 0;
  return Math.round(100 * (1 - (end.idle - start.idle) / total));
}

/** CPU in use over the next `ms`, while nothing of perf:compare runs. */
export async function sampleBusyPct(ms = 3000) {
  const start = cpuTimes();
  await new Promise((resolve) => setTimeout(resolve, ms));
  return busyPct(start, cpuTimes());
}

/** Labels of the rounds busier than the quietest round by more than EXTRA_LOAD_PCT. */
export function busyRounds(rounds) {
  if (rounds.length === 0) return [];
  const quietest = Math.min(...rounds.map((r) => r.busyPct));
  return rounds.filter((r) => r.busyPct - quietest > EXTRA_LOAD_PCT).map((r) => r.label);
}

/**
 * Total time the CPU quota of this container held it back, in ms, or null outside a container (no cgroup v2
 * statistics). Every round runs the same work, so a round throttled much more had less CPU than the others.
 */
export function cgroupThrottledMs(readFile = (file) => fs.readFileSync(file, "utf8")) {
  try {
    const usec = /^throttled_usec (\d+)$/m.exec(readFile(CGROUP_CPU_STAT));
    return usec ? Math.round(Number(usec[1]) / 1000) : null;
  } catch {
    return null;
  }
}

/** Throttled ms between two `cgroupThrottledMs` samples, or null when there is no cgroup. */
export function throttledBetween(start, end) {
  if (start === null || end === null) return null;
  return end - start;
}

/** " · container CPU quota throttled <round> <ms>, …" for the report, or "" outside a container. */
export function throttleSummary(load) {
  if (!load.some((round) => typeof round.throttledMs === "number")) return "";
  return ` · container CPU quota throttled ${load.map((round) => `${round.label} ${round.throttledMs ?? 0} ms`).join(", ")}`;
}

/** Labels of the rounds the container quota throttled for more than THROTTLED_WARN_MS. */
export const throttledRounds = (rounds) =>
  rounds.filter((r) => (r.throttledMs ?? 0) > THROTTLED_WARN_MS).map((r) => r.label);

/**
 * Why the timings of a run are less reliable, one sentence each; empty when the machine stayed quiet.
 *
 * @param {{ idleBusyPct: number, load: { label: string, busyPct: number, throttledMs?: number | null }[] }} machine
 */
export function noiseWarnings({ idleBusyPct, load }) {
  const warnings = [];
  if (idleBusyPct > IDLE_MAX_BUSY_PCT) {
    warnings.push(
      `The machine was already ${idleBusyPct}% busy before starting: timings are less reliable. Close other programs and run it again.`
    );
  }
  const busy = busyRounds(load);
  if (busy.length) {
    warnings.push(
      `Other programs were using the CPU during round(s) ${busy.join(", ")}: their timings are less reliable.`
    );
  }
  const throttled = throttledRounds(load);
  if (throttled.length) {
    warnings.push(
      `The CPU quota of the container held back round(s) ${throttled.join(", ")} for more than ${THROTTLED_WARN_MS / 1000} s: their timings are less reliable.`
    );
  }
  return warnings;
}
