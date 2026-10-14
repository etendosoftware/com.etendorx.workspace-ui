import { test } from "node:test";
import assert from "node:assert/strict";
import { busyPct, busyRounds, cpuTimes, EXTRA_LOAD_PCT } from "../machine.mjs";

const core = (idle, busy) => ({ times: { user: busy, nice: 0, sys: 0, idle, irq: 0 } });

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
