# Performance Measurement Pass — Template

Template for recording **one measurement pass** over **one Etendo window**.

**How to use:**

1. Copy this file as `results-<window>-<yyyy-mm-dd>-cpu<1x|4x>.md`
   — e.g. `results-sales-order-2026-08-27-cpu1x.md`
2. Fill section 1 **before** measuring. A pass without context is not comparable.
3. Run the pass twice: once with CPU throttling off, once with 4x.
   **One file per throttling setting** — do not mix both in the same file.

Reference: [`01-guia-de-medicion.md`](./01-guia-de-medicion.md).
A `—` means the field does not apply. Leave blank what you did not measure;
never guess a number.

---

## 1. Context

| Field | Value |
|-------|-------|
| Date | |
| Measured by | |
| UI commit / version | |
| UI build | production (`node dist`) / other: |
| `DEBUG_MODE` | unset·false / true *(true invalidates the pass)* |
| Window under test | *e.g.* Sales Order |
| Window ID | |
| Main tab entity | *e.g.* `Order` |
| Row count | `SELECT count(*) FROM <table>` = |
| CPU throttling | none (1x) / 4x |
| Network throttling | none / other: |
| Browser | Chrome ___ · incognito · no extensions |
| Machine | CPU / RAM |
| Backend location | same machine as browser / separate host: |
| Runs per point (n) | 10 |

> **If the browser, Next, Tomcat and PostgreSQL all run on this machine**, C2/C3 are
> optimistic (loopback) and C1 is pessimistic — the JVM and PostgreSQL compete for the same
> cores while the browser renders. See §9.1.2 of the guide. **P4 is the only point immune
> to this.**

---

## 2. Setup checklist

- [ ] Production build is the one being served on `:3000`
- [ ] Machine idle: no builds, no Gradle, no IDE indexing
- [ ] Chrome in incognito, no extensions
- [ ] DevTools → Network: cleared, filtered to `Fetch/XHR`
- [ ] DevTools → Performance → gear icon → CPU set as declared in section 1
- [ ] Etendo Classic reachable on `:8080` for the comparison column

Cold-cache reset — run in the DevTools console before **every** cold measurement:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith("etendo_metadata_"))
  .forEach(k => localStorage.removeItem(k));
```

---

## 3. Measurement helper

Paste the snippet from §6.2 of the guide, then paste this accumulator on top of it. It
collects runs and prints p50/max so you do not have to transcribe 10 runs by hand.

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

For **P1 only**, LCP needs its own observer, pasted *before* the page loads:

```js
new PerformanceObserver(l => {
  const e = l.getEntries().at(-1);
  console.log("LCP", Math.round(e.startTime));
}).observe({ type: "largest-contentful-paint", buffered: true });
```

---

## 4. Results — main matrix

### P1 — Login → Home rendered · cache: always cold

Submit login, stop when the Home dashboard is fully rendered.

```text
wall clock ............ p50: ______ ms    max: ______ ms
LCP ................... ______ ms                      (target < 2500)
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms

JS transferred on first load (gzip): ______ KB         (target < 500)
```

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

```text
wall clock ............ p50: ______ ms    max: ______ ms
C1  blocking .......... ______ ms   tasks: ____   worst: ______ ms
C1  TBT ............... ______ ms                      (target < 200)
C2+C3 network union ... ______ ms   requests: ____   KB: ______
C2+C3 slowest request . ______ ms
C3  (curl, §6.4) ...... ______ ms
INP approx ............ ______ ms                      (target < 200)
Classic equivalent .... ______ ms

Field count on this tab: ______    Combo/selector fields: ______
```

The field counts are needed to interpret the request count in §5.

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

The 2–3 heaviest endpoints per point. **Group repeated calls into one row**: 20 combo calls
to `/api/datasource` are one row with `times=20`, not 20 rows.

Source: the second `console.table` printed by `__perf.stop()`, plus `curl` (§6.4).

`C2` = *ms client* − *ms C3*.

> ⚠️ If the request was retried (§5.9 of the guide), this subtraction is inflated and **not
> interpretable**. Cross-check against the Tomcat access log, or wait for `Server-Timing`
> (§8.1).

| Point | Endpoint | Times | ms client | ms C3 | C2 | KB |
|-------|----------|-------|-----------|-------|----|----|
| P2 cold | `POST /api/erp/meta/window/{id}` | | | | | |
| P2 | `POST /api/datasource` (grid) | | | | | |
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
| `C3` | [`02-profiling-c3-backend.md`](./02-profiling-c3-backend.md) |
| `serialization` | Compare C2 against payload KB; suspect `route.ts` steps 5–7 (§2.1) |
| `chaining` | DevTools waterfall: which request waits for which |
| `fan-out` | §5 first — request count matters more than per-request latency |

---

## 7. Notes and anomalies

Anything that would make someone else read these numbers differently: discarded runs, console
errors, a run that hit a session/CSRF retry, unusual machine load, a window that behaved
differently than expected.

-
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
