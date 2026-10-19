// How busy the machine is while perf:compare measures, from the CPU time counters of the OS (all processes).
// Every round runs the same browser, servers and backend work, so a round much busier than the quietest one
// had something else running at the same time (a browser, an IDE build...) and its timings are less reliable.
import os from "node:os";

/** Above this share of CPU in use before starting, the machine is already busy. */
export const IDLE_MAX_BUSY_PCT = 25;
/** A round this many points busier than the quietest round of the run had extra load. */
export const EXTRA_LOAD_PCT = 15;

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
