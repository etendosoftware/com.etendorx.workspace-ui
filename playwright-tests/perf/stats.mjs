// Statistics for comparing benchmark runs of two builds measured on the same machine (perf:compare).
// Deterministic metrics (requests, bytes) are compared directly; timing metrics only count as a
// regression when the change is larger than the noise of the machine (bootstrap interval).

export const METRICS = ["settledMs", "blockingMs", "apiRequests", "apiBytes"];
const TIMING_THRESHOLD_PCT = 10;
const BYTES_THRESHOLD_PCT = 5;
// Below these, a consistent change on a short step is still too small to matter to a user
const MIN_ABSOLUTE_MS = { settledMs: 100, blockingMs: 50 };

export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Seeded PRNG (mulberry32) so a report is reproducible from the same samples
const rng = (seed) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const resample = (values, random) => values.map(() => values[Math.floor(random() * values.length)]);

/** 95% bootstrap interval of median(head) - median(base). */
export function bootstrapMedianDiff(base, head, iterations = 2000, seed = 1) {
  const random = rng(seed);
  const diffs = [];
  for (let i = 0; i < iterations; i++) {
    diffs.push(median(resample(head, random)) - median(resample(base, random)));
  }
  diffs.sort((a, b) => a - b);
  return [diffs[Math.floor(iterations * 0.025)], diffs[Math.ceil(iterations * 0.975) - 1]];
}

export function compareMetric(metric, base, head) {
  const baseMedian = median(base);
  const headMedian = median(head);
  const changePct = baseMedian === 0 ? (headMedian === 0 ? 0 : 100) : ((headMedian - baseMedian) / baseMedian) * 100;
  let regression;
  if (metric === "apiRequests") {
    regression = headMedian > baseMedian;
  } else if (metric === "apiBytes") {
    regression = changePct > BYTES_THRESHOLD_PCT;
  } else {
    const [low] = bootstrapMedianDiff(base, head);
    const minAbsolute = MIN_ABSOLUTE_MS[metric] ?? 0;
    regression = changePct > TIMING_THRESHOLD_PCT && low > 0 && headMedian - baseMedian >= minAbsolute;
  }
  return { metric, base: baseMedian, head: headMedian, changePct, regression };
}

const succeeded = (run, flow) => run.flows?.[flow] && !run.flows[flow].error;

/**
 * Compares bench.mjs results of the base and the head (one file per round). Only the flows that succeeded
 * in every round of both sides are compared; totals add those flows up per round.
 */
export function compareRuns(baseRuns, headRuns) {
  const allFlows = new Set([...baseRuns, ...headRuns].flatMap((run) => Object.keys(run.flows ?? {})));
  const flows = [...allFlows].filter((flow) => [...baseRuns, ...headRuns].every((run) => succeeded(run, flow)));
  const skipped = [...allFlows].filter((flow) => !flows.includes(flow));
  const values = (runs, flow, metric) => runs.map((run) => run.flows[flow][metric] ?? 0);

  const rows = flows.map((flow) => ({
    flow,
    metrics: Object.fromEntries(
      METRICS.map((metric) => [
        metric,
        compareMetric(metric, values(baseRuns, flow, metric), values(headRuns, flow, metric)),
      ])
    ),
  }));
  const totalPerRound = (runs, metric) =>
    runs.map((run) => flows.reduce((sum, flow) => sum + (run.flows[flow][metric] ?? 0), 0));
  const totals = Object.fromEntries(
    METRICS.map((metric) => [
      metric,
      compareMetric(metric, totalPerRound(baseRuns, metric), totalPerRound(headRuns, metric)),
    ])
  );
  const regressions = rows.flatMap((row) =>
    Object.values(row.metrics)
      .filter((m) => m.regression)
      .map((m) => ({ flow: row.flow, ...m }))
  );
  return { rows, totals, regressions, skipped };
}
