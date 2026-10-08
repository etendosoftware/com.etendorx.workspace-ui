// Performance benchmark: runs fixed user flows and records time, request count, bytes, server wait
// and main-thread CPU (long tasks).
// Usage: BASE_URL=https://demo.etendo.cloud LABEL=demo-before RUNS=3 node perf/bench.mjs
// Slow machine: CPU_THROTTLE=4 (Chrome CPU slowdown factor). PROFILE=1 saves a .cpuprofile per step.
// Compare two runs: node perf/compare.mjs perf/results/a.json perf/results/b.json
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const USER = process.env.ETENDO_USER || "admin";
const PASS = process.env.ETENDO_PASS || "admin";
const RUNS = Number(process.env.RUNS || 3);
const LABEL = process.env.LABEL || new URL(BASE).hostname;
const HEADLESS = process.env.HEADED !== "1";
const WINDOWS = (process.env.WINDOWS || "Sales Order,Sales Invoice,Goods Shipment,Purchase Order").split(",");
const CPU_THROTTLE = Number(process.env.CPU_THROTTLE || 1);
const PROFILE = process.env.PROFILE === "1";
const QUIET_MS = 1000; // flow is "settled" when no API request is in flight for this long
const RESULTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "results");
const TIMEOUT = 120000;
// FLAVOR=classic drives Etendo Classic (SmartClient) at BASE_URL=http://host/etendo with the same steps
const FLAVOR = process.env.FLAVOR || "react";
const CLASSIC_TAB_IDS = {
  "Sales Order": "186",
  "Sales Invoice": "263",
  "Goods Shipment": "257",
  "Purchase Order": "294",
};
const FILTER_BUTTON_ID = "D73C2AD100854463B3F697F3D36CDE3E"; // AD toolbar button with action FILTER (implicit filter toggle)

// Static assets never count as API, wherever they live (Classic serves them under /etendo/web/)
const isStatic = (p) =>
  /\.(js|css|png|gif|svg|jpe?g|ico|woff2?|ttf|map)$/i.test(p) || p.includes("/web/") || p.startsWith("/_next/");
const isApi = (url) => {
  const p = new URL(url).pathname;
  if (url.includes("_rsc=")) return true;
  return !isStatic(p) && (p.startsWith("/api/") || p.startsWith("/sws/") || p.startsWith("/etendo/"));
};
// Groups URLs by endpoint so per-endpoint numbers are comparable across runs
const endpointOf = (url) =>
  new URL(url).pathname.replace(/\/[0-9A-F]{32}(?=\/|$)/gi, "/:id").replace(/\/\d+(?=\/|$)/g, "/:n");

// Records every network request of a page through CDP (wire bytes + server wait time)
async function attachRecorder(page) {
  // Long tasks (>50ms) of the main thread, with absolute timestamps so they survive reloads
  await page.addInitScript(() => {
    window.__lt = [];
    window.__ltEnd = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const start = performance.timeOrigin + e.startTime;
          window.__lt.push([start, e.duration]);
          window.__ltEnd = Math.max(window.__ltEnd, start + e.duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {}
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  if (CPU_THROTTLE > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  const reqs = new Map();
  cdp.on("Network.requestWillBeSent", (e) => {
    reqs.set(e.requestId, {
      url: e.request.url,
      method: e.request.method,
      type: e.type,
      start: e.timestamp,
      inflight: true,
    });
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = reqs.get(e.requestId);
    if (!r) return;
    r.status = e.response.status;
    const t = e.response.timing;
    if (t) r.waitMs = t.receiveHeadersEnd - t.sendEnd; // server processing + 1 RTT
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = reqs.get(e.requestId);
    if (!r) return;
    r.bytes = e.encodedDataLength;
    r.end = e.timestamp;
    r.inflight = false;
  });
  cdp.on("Network.loadingFailed", (e) => {
    const r = reqs.get(e.requestId);
    if (r) Object.assign(r, { inflight: false, failed: true, end: e.timestamp });
  });
  return {
    reqs,
    cdp,
    mark: () => [...reqs.keys()].length,
    // Network quiet = no API in flight for QUIET_MS; CPU quiet = additionally no long task for QUIET_MS.
    // page.evaluate itself waits while the main thread is blocked, so a frozen UI delays cpuQuiet.
    async settle() {
      const start = Date.now();
      let netQuietSince = Date.now();
      let netQuiet = null;
      for (;;) {
        await page.waitForTimeout(100);
        const now = Date.now();
        if (now - start > TIMEOUT) throw new Error("settle timeout");
        if ([...reqs.values()].some((r) => r.inflight && isApi(r.url))) netQuietSince = now;
        if (netQuiet === null && now - netQuietSince >= QUIET_MS) netQuiet = netQuietSince;
        const ltEnd = await page.evaluate(() => window.__ltEnd || 0).catch(() => 0);
        const cpuQuietSince = Math.max(netQuietSince, ltEnd);
        if (netQuiet !== null && Date.now() - cpuQuietSince >= QUIET_MS) return { netQuiet, cpuQuiet: cpuQuietSince };
      }
    },
    longTasks: (since) => page.evaluate((t) => window.__lt.filter(([s]) => s >= t), since).catch(() => []),
  };
}

function summarize(list) {
  const api = list.filter((r) => isApi(r.url));
  const sum = (xs, k) => Math.round(xs.reduce((a, r) => a + (r[k] || 0), 0));
  const byEndpoint = {};
  for (const r of api) {
    const k = `${r.method} ${endpointOf(r.url)}`;
    byEndpoint[k] ??= { count: 0, bytes: 0, waitMs: 0, durMs: 0 };
    const e = byEndpoint[k];
    e.count++;
    e.bytes += r.bytes || 0;
    e.waitMs += Math.round(r.waitMs || 0);
    e.durMs += Math.round(((r.end || r.start) - r.start) * 1000);
  }
  return {
    requests: list.length,
    apiRequests: api.length,
    bytes: sum(list, "bytes"),
    apiBytes: sum(api, "bytes"),
    apiWaitMs: sum(api, "waitMs"),
    failed: list.filter((r) => r.failed || r.status >= 400).length,
    byEndpoint,
  };
}

// Measures one step: wall time until `ready` resolves (visible), until network is quiet (settled)
// and until the main thread is idle too (interactive), plus long-task CPU inside the step
async function step(rec, name, action, ready, profileName) {
  const from = rec.mark();
  if (PROFILE) {
    await rec.cdp.send("Profiler.enable");
    await rec.cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
    await rec.cdp.send("Profiler.start");
  }
  const t0 = Date.now();
  await action();
  await ready();
  const visibleMs = Date.now() - t0;
  const { netQuiet, cpuQuiet } = await rec.settle();
  if (PROFILE) {
    const { profile } = await rec.cdp.send("Profiler.stop");
    const dir = path.join(RESULTS_DIR, "profiles", LABEL);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${profileName || name}.cpuprofile`), JSON.stringify(profile));
  }
  const lts = await rec.longTasks(t0);
  const list = [...rec.reqs.values()].slice(from);
  return {
    name,
    visibleMs,
    settledMs: Math.max(netQuiet - t0, visibleMs),
    interactiveMs: Math.round(Math.max(cpuQuiet - t0, visibleMs)),
    longTasks: lts.length,
    longTaskMs: Math.round(lts.reduce((a, [, d]) => a + d, 0)),
    blockingMs: Math.round(lts.reduce((a, [, d]) => a + Math.max(0, d - 50), 0)), // TBT-style
    maxLongTaskMs: Math.round(Math.max(0, ...lts.map(([, d]) => d))),
    ...summarize(list),
  };
}

// In the page: whether the visible grid row at `index` is selected (its checkbox is checked)
const rowIsSelected = (index) => {
  const rows = [...document.querySelectorAll("table tbody tr")].filter((tr) => tr.offsetParent !== null);
  return !!rows[index]?.querySelector('input[type="checkbox"]')?.checked;
};

// "3 / 100" or "3 of 100" -> 3
const recordPosition = (text) => Number.parseInt(text, 10);

const gridReady = (page) => () =>
  page
    .getByText(/Showing \d+ records?/)
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: TIMEOUT });

async function login(page, rec, tag) {
  return step(
    rec,
    "login",
    async () => {
      await page.goto(`${BASE}/`);
      await page.getByLabel("Username").fill(USER);
      await page.getByRole("textbox", { name: "Password" }).fill(PASS);
      await page.getByRole("button", { name: "Log In" }).click();
    },
    () => page.getByRole("button", { name: "Add widget" }).waitFor({ timeout: TIMEOUT }),
    `${tag}-login`
  );
}

async function openFromMenu(page, name) {
  const search = page.getByRole("textbox", { name: "Search" });
  if (!(await search.isVisible().catch(() => false))) await page.getByRole("button").first().click();
  await search.fill(name);
  const items = page.getByText(name, { exact: true }).filter({ visible: true });
  await items.first().waitFor({ timeout: TIMEOUT });
  await items.last().click();
}

// One full pass for a window: cold open from menu, warm reload, unfiltered grid, open first record,
// type into a form field
async function windowFlow(browser, winName, run) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const rec = await attachRecorder(page);
  const tag = `${winName.replace(/\s+/g, "")}-run${run}`;
  const steps = [];
  try {
    steps.push(await login(page, rec, tag));
    steps.push(await step(rec, "open-cold", () => openFromMenu(page, winName), gridReady(page), `${tag}-open-cold`));
    steps.push(await step(rec, "reload-warm", () => page.reload(), gridReady(page), `${tag}-reload-warm`));
    // Implicit filters often leave the grid empty; drop them so the datasource returns a full page
    steps.push(
      await step(
        rec,
        "load-unfiltered",
        () => page.getByTestId(`IconButton__${FILTER_BUTTON_ID}`).filter({ visible: true }).first().click(),
        () =>
          page
            .getByText(/Showing [1-9]\d* records?/)
            .filter({ visible: true })
            .first()
            .waitFor({ timeout: TIMEOUT }),
        `${tag}-load-unfiltered`
      )
    );
    // Keyboard navigation: select the second row, then 5 ArrowDown 100 ms apart. Measures what every
    // selection change costs (child tabs, toolbar, session sync) when moving fast over the grid.
    const navStart = page.locator("table tbody tr").filter({ visible: true }).nth(1).locator("td").nth(3);
    if (await navStart.isVisible().catch(() => false)) {
      await navStart.click();
      await rec.settle();
      steps.push(
        await step(
          rec,
          "arrow-nav-5",
          async () => {
            for (let i = 0; i < 5; i++) {
              await page.keyboard.press("ArrowDown");
              await page.waitForTimeout(100);
            }
          },
          () => page.waitForFunction(rowIsSelected, 6, { timeout: TIMEOUT, polling: 100 }),
          `${tag}-arrow-nav-5`
        )
      );
    }
    const firstCell = page.locator("table tbody tr td").filter({ visible: true }).nth(3);
    if (await firstCell.isVisible().catch(() => false)) {
      steps.push(
        await step(
          rec,
          "open-record",
          () => firstCell.dblclick(),
          () => page.waitForURL(/ri_\d+=/, { timeout: TIMEOUT }),
          `${tag}-open-record`
        )
      );
      // Record navigation from the form: 5 Next clicks as fast as the button allows.
      const next = page.getByTestId("next-record-button").filter({ visible: true }).first();
      if (await next.isEnabled().catch(() => false)) {
        const position = page.getByTestId("record-position-indicator").filter({ visible: true }).first();
        const startAt = recordPosition(await position.innerText());
        steps.push(
          await step(
            rec,
            "form-next-5",
            async () => {
              for (let i = 0; i < 5; i++) {
                await next.click({ timeout: TIMEOUT });
                await page.waitForTimeout(100);
              }
            },
            () =>
              page.waitForFunction(
                ({ expected }) => {
                  const el = [...document.querySelectorAll('[data-testid="record-position-indicator"]')].find(
                    (e) => e.offsetParent !== null
                  );
                  return Number.parseInt(el?.textContent ?? "", 10) === expected;
                },
                { expected: startAt + 5 },
                { timeout: TIMEOUT, polling: 100 }
              ),
            `${tag}-form-next-5`
          )
        );
      }
      // Typing latency: 10 keystrokes into the Description field (exists in all benchmarked headers).
      // The text is never saved: the context is discarded without pressing Save.
      const field = page.locator('textarea[name="description"]').filter({ visible: true }).first();
      if (await field.isVisible().catch(() => false)) {
        steps.push(
          await step(
            rec,
            "type-10-chars",
            async () => {
              // React textarea takes programmatic focus; a click can be intercepted by overlapping chrome
              await field.focus();
              await page.keyboard.type("perf-check");
            },
            async () =>
              page.waitForFunction((el) => el.value.includes("perf-check"), await field.elementHandle(), {
                timeout: TIMEOUT,
                polling: 100,
              }),
            `${tag}-type-10-chars`
          )
        );
      }
    }
  } catch (e) {
    steps.push({ name: "error", error: String(e.message || e).slice(0, 300) });
  } finally {
    await ctx.close();
  }
  return steps;
}

const METRICS = [
  "visibleMs",
  "settledMs",
  "interactiveMs",
  "longTasks",
  "longTaskMs",
  "blockingMs",
  "maxLongTaskMs",
  "requests",
  "apiRequests",
  "bytes",
  "apiBytes",
  "apiWaitMs",
  "failed",
];

// Classic: the root view of the selected window tab, read inside the page
const classicGridReady = (page, needRows) => () =>
  page.waitForFunction(
    (rows) => {
      const t = window.OB && OB.MainView && OB.MainView.TabSet.getSelectedTab();
      const g = t?.pane?.view?.viewGrid;
      if (!g || !g.data || !g.data.lengthIsKnown || !g.data.lengthIsKnown() || g.fetchingData) return false;
      return !rows || g.getTotalRows() > 0;
    },
    needRows,
    { timeout: TIMEOUT, polling: 100 }
  );
const classicAppReady = (page) =>
  page.waitForFunction(() => window.OB && OB.MainView && OB.Utilities && OB.Utilities.openDirectTab, null, {
    timeout: TIMEOUT,
  });

async function classicWindowFlow(browser, winName, run) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const rec = await attachRecorder(page);
  const tag = `${winName.replace(/\s+/g, "")}-run${run}`;
  const tabId = CLASSIC_TAB_IDS[winName];
  const open = () => page.evaluate((id) => OB.Utilities.openDirectTab(id), tabId);
  const steps = [];
  try {
    steps.push(
      await step(
        rec,
        "login",
        async () => {
          await page.goto(`${BASE}/security/Login`);
          await page.fill("#user", USER);
          await page.fill("#password", PASS);
          await page.click("#buttonOK");
        },
        () => classicAppReady(page),
        `${tag}-login`
      )
    );
    steps.push(await step(rec, "open-cold", open, classicGridReady(page, false), `${tag}-open-cold`));
    steps.push(
      await step(
        rec,
        "reload-warm",
        async () => {
          await page.reload();
          await classicAppReady(page);
          await open();
        },
        classicGridReady(page, false),
        `${tag}-reload-warm`
      )
    );
    steps.push(
      await step(
        rec,
        "load-unfiltered",
        () => page.evaluate(() => OB.MainView.TabSet.getSelectedTab().pane.view.viewGrid.clearFilter()),
        classicGridReady(page, true),
        `${tag}-load-unfiltered`
      )
    );
    const firstCell = page.locator('td[class^="OBGridCell"]').filter({ visible: true }).nth(2);
    if (await firstCell.isVisible().catch(() => false)) {
      steps.push(
        await step(
          rec,
          "open-record",
          () => firstCell.dblclick(),
          () =>
            page.waitForFunction(
              () => {
                const v = OB.MainView.TabSet.getSelectedTab().pane.view;
                return v.isShowingForm && v.viewForm && v.viewForm.isVisible() && !v.viewForm.isLoading;
              },
              null,
              { timeout: TIMEOUT, polling: 100 }
            ),
          `${tag}-open-record`
        )
      );
      // Same typing step as the React flow; the record is never saved (context discarded)
      const field = page.locator('textarea[name="description"]').filter({ visible: true }).first();
      if (await field.isVisible().catch(() => false)) {
        steps.push(
          await step(
            rec,
            "type-10-chars",
            async () => {
              await field.click({ timeout: TIMEOUT });
              await page.keyboard.type("perf-check");
            },
            async () =>
              page.waitForFunction((el) => el.value.includes("perf-check"), await field.elementHandle(), {
                timeout: TIMEOUT,
                polling: 100,
              }),
            `${tag}-type-10-chars`
          )
        );
      }
    }
  } catch (e) {
    steps.push({ name: "error", error: String(e.message || e).slice(0, 300) });
  } finally {
    await ctx.close();
  }
  return steps;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const raw = {};
  for (let run = 1; run <= RUNS; run++) {
    for (const w of WINDOWS) {
      process.stdout.write(`run ${run}/${RUNS} ${w}... `);
      const steps = await (FLAVOR === "classic" ? classicWindowFlow : windowFlow)(browser, w, run);
      for (const s of steps) {
        const key = `${w} / ${s.name}`;
        raw[key] ??= [];
        raw[key].push(s);
      }
      console.log(steps.map((s) => `${s.name}=${s.settledMs ?? "ERR"}ms`).join(" "));
    }
  }
  await browser.close();

  // Median per flow step; endpoint breakdown taken from the median-time run
  const flows = {};
  for (const [k, runs] of Object.entries(raw)) {
    const ok = runs.filter((r) => !r.error);
    if (!ok.length) {
      flows[k] = { error: runs[0].error };
      continue;
    }
    const m = {};
    for (const f of METRICS) m[f] = median(ok.map((r) => r[f]));
    const rep = ok.find((r) => r.settledMs === m.settledMs) || ok[0];
    flows[k] = { ...m, runs: ok.length, byEndpoint: rep.byEndpoint };
  }
  const ok = Object.values(flows).filter((f) => !f.error);
  const totals = {};
  for (const f of METRICS) totals[f] = ok.reduce((a, x) => a + (x[f] || 0), 0);

  const out = {
    label: LABEL,
    flavor: FLAVOR,
    base: BASE,
    date: new Date().toISOString(),
    runs: RUNS,
    cpuThrottle: CPU_THROTTLE,
    windows: WINDOWS,
    totals,
    flows,
    raw,
  };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${LABEL}-${out.date.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));

  const kb = (b) => `${(b / 1024).toFixed(0)}KB`;
  console.log(`\n${LABEL} (${BASE}) median of ${RUNS} runs, CPU throttle ${CPU_THROTTLE}x`);
  console.table(
    Object.fromEntries(
      Object.entries(flows).map(([k, f]) => [
        k,
        f.error
          ? { error: f.error.slice(0, 60) }
          : {
              visible: f.visibleMs,
              interactive: f.interactiveMs,
              blocking: f.blockingMs,
              maxTask: f.maxLongTaskMs,
              api: f.apiRequests,
              apiKB: kb(f.apiBytes),
              waitMs: f.apiWaitMs,
            },
      ])
    )
  );
  console.log("TOTAL", { ...totals, apiBytes: kb(totals.apiBytes), bytes: kb(totals.bytes) });
  console.log("saved", file);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
