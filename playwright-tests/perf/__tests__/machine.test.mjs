import { test } from "node:test";
import assert from "node:assert/strict";
import {
  busyPct,
  busyRounds,
  cgroupThrottledMs,
  cpuTimes,
  EXTRA_LOAD_PCT,
  IDLE_MAX_BUSY_PCT,
  noiseWarnings,
  THROTTLED_WARN_MS,
  throttledBetween,
  throttledRounds,
  throttleSummary,
} from "../machine.mjs";

const core = (idle, busy) => ({ times: { user: busy, nice: 0, sys: 0, idle, irq: 0 } });
const round = (label, busy, throttledMs) => ({ label, busyPct: busy, throttledMs });

test("cpuTimes adds idle and total time of every core", () => {
  assert.deepEqual(cpuTimes([core(100, 50), core(200, 30)]), { idle: 300, total: 380 });
});

test("busyPct is the share of non-idle time between two samples", () => {
  assert.equal(busyPct({ idle: 0, total: 0 }, { idle: 750, total: 1000 }), 25);
  assert.equal(busyPct({ idle: 100, total: 100 }, { idle: 100, total: 100 }), 0);
});

test("busyRounds flags the rounds much busier than the quietest one", () => {
  const rounds = [
    { label: "base 1", busyPct: 30 },
    { label: "head 1", busyPct: 30 + EXTRA_LOAD_PCT },
    { label: "base 2", busyPct: 30 + EXTRA_LOAD_PCT + 1 },
  ];
  assert.deepEqual(busyRounds(rounds), ["base 2"]);
  assert.deepEqual(busyRounds([]), []);
});

test("cgroupThrottledMs reads the cgroup v2 throttled time, null outside a container", () => {
  const stat = "usage_usec 9000000\nnr_throttled 12\nthrottled_usec 2500600\n";
  assert.equal(
    cgroupThrottledMs(() => stat),
    2501
  );
  assert.equal(
    cgroupThrottledMs(() => "usage_usec 1\n"),
    null
  );
  assert.equal(
    cgroupThrottledMs(() => {
      throw new Error("ENOENT");
    }),
    null
  );
});

test("throttledBetween is the difference of two samples, null without a cgroup", () => {
  assert.equal(throttledBetween(100, 350), 250);
  assert.equal(throttledBetween(null, 350), null);
  assert.equal(throttledBetween(100, null), null);
});

test("throttledRounds and throttleSummary report the container quota per round", () => {
  const rounds = [round("base 1", 30, 0), round("head 1", 30, THROTTLED_WARN_MS + 1)];
  assert.deepEqual(throttledRounds(rounds), ["head 1"]);
  assert.equal(
    throttleSummary(rounds),
    ` · container CPU quota throttled base 1 0 ms, head 1 ${THROTTLED_WARN_MS + 1} ms`
  );
  assert.equal(throttleSummary([round("base 1", 30, null)]), "");
});

test("noiseWarnings explains each reason a run is less reliable", () => {
  assert.deepEqual(noiseWarnings({ idleBusyPct: 0, load: [round("base 1", 30, null)] }), []);
  const warnings = noiseWarnings({
    idleBusyPct: IDLE_MAX_BUSY_PCT + 1,
    load: [round("base 1", 10, 0), round("head 1", 10 + EXTRA_LOAD_PCT + 1, THROTTLED_WARN_MS + 1)],
  });
  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /already \d+% busy/);
  assert.match(warnings[1], /round\(s\) head 1/);
  assert.match(warnings[2], /CPU quota of the container held back round\(s\) head 1/);
});
