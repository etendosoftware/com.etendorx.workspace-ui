// Statistics for comparing benchmark runs of two builds measured on the same machine (perf:compare).
// Every metric only counts as a regression when the change is larger than the noise of the machine
// (bootstrap interval). Requests and bytes are usually identical in every round, so any consistent extra
// request still shows up; on timing-dependent steps (keys 100 ms apart) they vary even in the base.

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
  const [low] = bootstrapMedianDiff(base, head);
  const aboveNoise = low > 0;
  let regression;
  if (metric === "apiRequests") {
    regression = headMedian > baseMedian && aboveNoise;
  } else if (metric === "apiBytes") {
    regression = changePct > BYTES_THRESHOLD_PCT && aboveNoise;
  } else {
    const minAbsolute = MIN_ABSOLUTE_MS[metric] ?? 0;
    regression = changePct > TIMING_THRESHOLD_PCT && aboveNoise && headMedian - baseMedian >= minAbsolute;
  }
  return { metric, base: baseMedian, head: headMedian, changePct, regression };
}

const hasFlow = (run, flow) => Boolean(run.flows?.[flow]);
const succeeded = (run, flow) => !run.flows[flow].error;
// Extra rounds only measure some windows, so each flow uses the rounds that measured it
const runsWith = (runs, flow) => runs.filter((run) => hasFlow(run, flow));
const comparable = (baseRuns, headRuns, flow) => {
  const measured = [...runsWith(baseRuns, flow), ...runsWith(headRuns, flow)];
  return (
    runsWith(baseRuns, flow).length > 0 &&
    runsWith(headRuns, flow).length > 0 &&
    measured.every((run) => succeeded(run, flow))
  );
};

/**
 * Compares bench.mjs results of the base and the head (one file per round). Only the flows that succeeded
 * in every round that measured them, on both sides, are compared; totals add those flows up per round, over
 * the rounds that measured all of them. `unstable` lists the flows whose requests vary between the base
 * rounds: their request and byte counts depend on timing.
 */
export function compareRuns(baseRuns, headRuns) {
  const allFlows = new Set([...baseRuns, ...headRuns].flatMap((run) => Object.keys(run.flows ?? {})));
  const flows = [...allFlows].filter((flow) => comparable(baseRuns, headRuns, flow));
  const skipped = [...allFlows].filter((flow) => !flows.includes(flow));
  const values = (runs, flow, metric) => runsWith(runs, flow).map((run) => run.flows[flow][metric] ?? 0);
  const unstable = flows.filter((flow) => new Set(values(baseRuns, flow, "apiRequests")).size > 1);

  const rows = flows.map((flow) => ({
    flow,
    metrics: Object.fromEntries(
      METRICS.map((metric) => [
        metric,
        compareMetric(metric, values(baseRuns, flow, metric), values(headRuns, flow, metric)),
      ])
    ),
  }));
  const complete = (runs) => runs.filter((run) => flows.every((flow) => hasFlow(run, flow)));
  const totalPerRound = (runs, metric) =>
    complete(runs).map((run) => flows.reduce((sum, flow) => sum + (run.flows[flow][metric] ?? 0), 0));
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
  return { rows, totals, regressions, skipped, unstable };
}

/** Windows that have a regression in some step ("Sales Order / open-record" -> "Sales Order"), once each. */
export const windowsToRemeasure = (regressions) => [...new Set(regressions.map((r) => r.flow.split(" / ")[0]))];
