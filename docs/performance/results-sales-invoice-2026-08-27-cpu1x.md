# Performance Measurement Pass — Sales Invoice · 2026-08-27 · CPU 1x

Instance of [`metrics-template.md`](./metrics-template.md).
Window selected in [`03-window-selection.md`](./03-window-selection.md) §6 as the
**primary window**: the one with the observed slowdown when opening a record in form mode.

Reference: [`01-guia-de-medicion.md`](./01-guia-de-medicion.md).

> **Status: in progress.** Only fields already known are filled. Everything else is blank on
> purpose — a guessed number is worse than a missing one.
> A `—` means the field does not apply. Never guess a number.

---

## 1. Context

| Field | Value |
|-------|-------|
| Date | 2026-08-27 |
| Measured by | Luciano Palacio |
| UI version | 0.14.2 |
| Working tree | clean — no modified tracked files |
| UI build | production (`node dist`) / dev — **to confirm at measurement time** |
| `DEBUG_MODE` | `false` |
| Node | v24.11.1 |
| Window under test | Sales Invoice |
| Window ID | `167` |
| Header tab ID | `263` — "Header" |
| Main tab entity | `Invoice` (table `C_Invoice`) |
| Row count | **786** visible · 2537 total in `c_invoice` |
| Tab where-clause | `C_Invoice.IsSOTrx='Y'` — this is why 786 ≠ 2537 |
| Child tabs | 10 direct children of the header tab |
| CPU throttling | **none (1x)** |
| Network throttling | none |
| Browser | Chrome ___ · incognito · no extensions |
| Machine | Intel Core i5-13420H · 12 threads · 15 GB RAM · Linux 7.0.0-30 |
| Backend location | same machine as browser — Tomcat `localhost:8080/etendodev`, PostgreSQL `localhost:5432/etendodev` |
| Runs per point (n) | |

> **Everything runs on this machine**, so C2/C3 are optimistic (loopback) and C1 is
> pessimistic — the JVM and PostgreSQL compete for the same 12 threads while the browser
> renders. See §9.1.2 of the guide. **P4 is the only point immune to this.**

---

## 2. Setup checklist

- [ ] Production build is the one being served on `:3000`
- [ ] Machine idle: no builds, no Gradle, no IDE indexing
- [ ] Chrome in incognito, no extensions
- [ ] DevTools → Network: cleared, filtered to `Fetch/XHR`
- [ ] DevTools → Performance → gear icon → CPU throttling **off (1x)**
- [ ] Etendo Classic reachable on `:8080/etendodev` for the comparison column
- [ ] Same record used for every P3 run — write its document number in §7

Cold-cache reset — run in the DevTools console before **every** cold measurement:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith("etendo_metadata_"))
  .forEach(k => localStorage.removeItem(k));
```

---

## 3. Measurement helper

Paste the snippet from §6.2 of the guide, then this accumulator on top of it.

```js
window.__runs = [];
window.__reset = () => { __runs.length = 0; };
window.__summary = () => {
  const fields = ["wall", "redUnion", "requests", "kb", "reqMasLenta",
                  "bloqueo", "tbt", "longTasks", "peorTask", "peorInteraccion"];
  const p50 = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const out = {};
  for (const k of fields) {
    const v = __runs.map(r => r[k]);
    out[k] = { p50: p50(v), max: Math.max(...v), n: v.length };
  }
  console.table(out);
  return out;
};
```

Loop for each point:

```js
__reset()                    // once per point
__perf.start()               // then perform the action in the UI
__runs.push(__perf.stop())   // repeat 10 times
__summary()                  // read p50 / max off the table
```

Paste it **once per session**. Logging in does not navigate or reload — `login()` only writes
the token to the store and the app re-renders ([`contexts/user.tsx:233`](../../packages/MainUI/contexts/user.tsx))
— so the console context survives the whole pass.

### LCP — what it can and cannot tell us here

LCP is a **page-load** metric. It stops updating at the first user interaction, and since
login triggers no navigation, **Home never produces an LCP of its own**. An observer left
running across the login would report the *login screen's* LCP.

So LCP is measured on its own, as the cost of the first paint of the app shell:

```js
// Paste on a FRESH load of the login page, before typing anything.
new PerformanceObserver(l => {
  const e = l.getEntries().at(-1);
  console.log("LCP (login screen)", Math.round(e.startTime));
}).observe({ type: "largest-contentful-paint", buffered: true });
```

`buffered: true` also delivers entries recorded before the observer existed, so pasting right
after the page settles still works — as long as you have not clicked or typed yet.

For **Home rendered** there is no Web Vital to lean on: the number is `wall` from
`__perf`, bracketing the submit click, with `bloqueo` next to it.

---

## 4. Results — main matrix

### P1 — Login → Home rendered · cache: always cold

Submit login, stop when the Home dashboard is fully rendered.

```text
wall clock ............ p50: ______ ms    max: ______ ms
LCP (login screen) .... ______ ms                      (target < 2500)
                                     ^ NOT Home — see §3. Measured once, on a fresh load.
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms

JS transferred on first load (gzip): ______ KB         (target < 500)
```

> P1 is window-independent. Measure it once; the same numbers apply to the Sales Order
> and Product passes.

### P2 — Window, grid mode · cache: COLD

Click the menu item, stop when the first row with real data is painted.
Run the cold-cache reset (§2) before **every** run.

```text
wall clock ............ p50: ______ ms    max: ______ ms
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms
```

### P2 — Window, grid mode · cache: WARM

Same action, metadata already in `localStorage` — just re-open the window without
resetting. Target < 1000 ms.

```text
wall clock ............ p50: ______ ms    max: ______ ms
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms
```

### P3 — Window, form mode (EDIT) · cache: warm

Click an existing row, stop when the form is interactive — form initialization resolved,
combos populated. Target < 1500 ms.

**This is the point the whole analysis exists for.** It is the action that felt slow
compared to Sales Order and Product. The number here is the baseline everything else is
measured against.

```text
wall clock ............ p50: ______ ms    max: ______ ms
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms
```

Dictionary counts for this tab — **not measured, do not overwrite**:

| Fact | Value | Layer it loads |
|------|-------|----------------|
| Displayed fields | 88 | C1 |
| Fields total (incl. hidden) | 118 | — |
| Combo/selector fields (ref 18/19/30/OBUISEL) | 18 | C2+C3 |
| Columns in `C_Invoice` | 164 | C3 |
| Auxiliary inputs | 13 | C3 |
| Display logic expressions | 71 | C1 |
| Read-only logic expressions | 45 | C1 |

**The two open candidates** (§5.3 of the window-selection doc), one per layer:

- **Auxiliary inputs — C3.** 13 SQL expressions evaluated server-side by the FIC on every
  call, against 6 for Sales Order and 4 for Product.
- **Logic expressions — C1.** 116 display + read-only expressions evaluated client-side,
  against 50 for Sales Order and 65 for Product.

`bloqueo` vs `redUnion` in the block above decides between them in one shot. Callouts are
**not** a candidate: they only run in `NEW` and `CHANGE`, never in `EDIT`
(`FormInitializationComponent.java:834`).

### P4 — Grid ↔ form round trip · cache: warm

Switch grid → form → grid on an already-loaded record. Should be **pure C1**.
Target < 300 ms and **0 requests**. The only point not contaminated by the backend
sharing the machine.

```text
wall clock ............ p50: ______ ms    max: ______ ms   (target < 300)
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
                                     ^ if this is not 0, that is a finding
INP approx ............ ______ ms                      (target < 200)
C3 .................... —
Classic equivalent .... —
```

Repeat with **5 windows open simultaneously** (§5.7 of the guide):

```text
wall clock ............ p50: ______ ms    max: ______ ms
C1  blocking .......... ______ ms
JS heap ............... ______ MB      (DevTools → Memory → heap snapshot)
```

---

## 5. Results — dominant endpoints

The 2–3 heaviest endpoints per point. **Group repeated calls into one row**: 18 combo calls
to `/api/datasource` are one row with `times=18`, not 18 rows.

Source: the second `console.table` printed by `__perf.stop()`, plus `curl` (§6.4).

`C2` = *ms client* − *ms C3*.

> ⚠️ If the request was retried (§5.9 of the guide), this subtraction is inflated and **not
> interpretable**. Cross-check against the Tomcat access log, or wait for `Server-Timing`
> (§8.1).

| Point | Endpoint | Times | ms client | ms C3 | C2 | KB |
|-------|----------|-------|-----------|-------|----|----|
| P2 cold | `POST /api/erp/meta/window/167` | | | | | |
| P2 | `POST /api/datasource` (grid, `Invoice`) | | | | | |
| P3 | `POST /api/erp/org.openbravo.client.kernel` (FIC) | | | | | |
| P3 | `POST /api/datasource` (combos) | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

Reference for C2 — **engineering judgement, not a standard**: a pure forwarding proxy should
sit at 5–30 ms. Well above that points to payload serialization (§2.1) or retries (§5.9).

---

## 6. Diagnosis

Apply the rule from §2.4 of the guide:

| Observation | Diagnosis | Where to look |
|-------------|-----------|---------------|
| `network union ≈ wall clock` | network-bound | split C2 vs C3 |
| `blocking ≈ wall clock` | C1-bound | React DevTools Profiler |
| `network + blocking << wall clock` | chained waits | read the waterfall |

Dominant layer must be one of: `C1` · `C2` · `C3` · `serialization` · `chaining` · `fan-out`

| Point | Dominant layer | Evidence (a number, not an impression) | Next step |
|-------|----------------|----------------------------------------|-----------|
| P1 | | | |
| P2 cold | | | |
| P2 warm | | | |
| P3 | | | |
| P4 | | | |

Typical next steps by dominant layer:

| Dominant layer | Next step |
|----------------|-----------|
| `C1` | React DevTools Profiler on that scenario: which component re-renders and why |
| `C2` | Check payload size and retries; implement `Server-Timing` (§8.1) |
| `C3` | [`02-profiling-c3-backend.md`](./02-profiling-c3-backend.md) — and enable the FIC DEBUG logger first, it is free |
| `serialization` | Compare C2 against payload KB; suspect `route.ts` steps 5–7 (§2.1) |
| `chaining` | DevTools waterfall: which request waits for which |
| `fan-out` | §5 first — request count matters more than per-request latency |

---

## 7. Notes and anomalies

Anything that would make someone else read these numbers differently: discarded runs, console
errors, a run that hit a session/CSRF retry, unusual machine load, a window that behaved
differently than expected.

- P3 record used (document no.):
-
-
-

---

## 8. Headline

Write the conclusion as a single sentence per problematic point, in the shape described in
§1.1 of the guide: **number → breakdown → budget → verdict**.

**If you cannot write it, the pass is not finished.**

Expected shape:

> "Opening a record in form mode takes 3.2 s (p50, warm cache). Of that: 1.1 s with requests
> in flight across 14 calls — slowest the FIC at 620 ms — and 1.8 s of blocked main thread in
> 3 long tasks, the worst at 780 ms. The blocking budget is 200 ms TBT: we are 7x over. The
> bottleneck is rendering, not the backend."

-
-
-
