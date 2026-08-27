# Window Selection for Performance Measurement

> **Status:** working draft. Not versioned in the repo yet.
> **Companion to:** [`01-guia-de-medicion.md`](./01-guia-de-medicion.md) — this document
> answers *which window* to run a measurement pass on, and why.
>
> **Selection made on 2026-08-27:** **Sales Invoice** (primary), with **Sales Order** and
> **Product** as mandatory contrasts. Rationale in §5 and §6.

---

## 1. Why this needs its own analysis

The measurement points P2, P3 and P4 all say "open a window". But the instance has **386
active windows** (323 reachable from the menu), and they differ by two orders of magnitude
in every dimension that drives performance:

- Header-tab field count ranges from **7 to 88**
- Combo/selector count per header tab ranges from **0 to 23**
- Tab count per window ranges from **1 to 27**
- Backing-table row count ranges from **0 to 12,227**

Measuring the wrong window produces a number that is technically correct and practically
useless. Measuring only *one* window produces a number you cannot interpret: if form mode
takes 3 s, you cannot tell whether that is because the tab has 88 fields, because 18 of them
are combos, or because the framework costs 3 s regardless.

The goal is a **small set of windows chosen so that each one isolates a different variable**.

---

## 2. Method

All figures come from the Application Dictionary of the local `etendodev` database, queried
on **2026-08-27**. The SQL is in §8 so it can be re-run against any instance — in particular
against a real customer database, where the answers will differ.

Four dimensions were measured:

| Dimension | Why it matters | Affects |
|-----------|----------------|---------|
| **Header-tab fields and combos** | Every combo/selector may trigger its own datasource request when the form opens | P3 — form mode |
| **FIC workload** (auxiliary inputs, table columns, logic expressions) | What form initialization has to compute server-side, and what the client has to evaluate per render | P3 — form mode |
| **Tab count** | Drives the size of the `/meta/window/{id}` payload, which has no ETag (§5.4) | P2 cold |
| **Backing-table rows** | Drives grid fetch and render cost | P2 — grid mode |

"Combos" counts fields whose reference is `Table` (18), `TableDir` (19), `Search` (30) or
`OBUISEL_Selector` — the ones that resolve their options through a datasource call.
`List` (17) references are counted separately: they come embedded in the metadata and do
**not** cost a request.

> **Careful with window names.** They are not unique. There are two active windows named
> "Sales Invoice": one on `C_Invoice` (88 fields) and one on `OBFBPS_InvoicesPicker`
> (10 fields). Always disambiguate by backing table — a query grouped by name alone silently
> merges them.

---

## 3. What the data says

### 3.1 Most complex windows overall (all tabs)

| Window | Tabs | Fields | Combos | Lists | Buttons |
|--------|-----:|-------:|-------:|------:|--------:|
| Product | 27 | 273 | 80 | 24 | 11 |
| Sales Invoice | 17 | 248 | 72 | 23 | 19 |
| Financial Account | 12 | 229 | 78 | 23 | 29 |
| Purchase Invoice | 15 | 219 | 69 | 15 | 18 |
| SII Monitor | 11 | 171 | 35 | 28 | 14 |
| Windows, Tabs, and Fields | 14 | 155 | 30 | 3 | 3 |
| Sales Order | 12 | 152 | 59 | 9 | 14 |
| Business Partner | 17 | 142 | 45 | 9 | 3 |

### 3.2 Header-tab complexity — what P3 actually measures

P3 opens the form of **one tab**, not the whole window.

| Window | Table | Header fields | Combos | Lists | Buttons | Tabs |
|--------|-------|--------------:|-------:|------:|--------:|-----:|
| **Sales Invoice** | `C_Invoice` | **88** | 18 | 10 | 17 | 16 |
| **Product** | `M_Product` | 77 | 11 | 13 | 11 | **27** |
| Purchase Invoice | `C_Invoice` | 65 | 16 | 4 | 15 | 14 |
| Business Partner General View | `C_BPartner` | 56 | 17 | 1 | 1 | 9 |
| **Sales Order** | `C_Order` | 50 | **23** | 2 | 11 | 12 |
| Purchase Order | `C_Order` | 37 | 16 | 1 | 9 | 9 |
| Goods Shipment | `M_InOut` | 33 | 13 | 1 | 10 | 6 |
| Payment In | `FIN_Payment` | 26 | 11 | 1 | — | 6 |
| Accounting Transaction Details | `Fact_Acct` | 24 | 16 | 0 | 0 | **1** |
| **Business Partner** | `C_BPartner` | 23 | 4 | 1 | — | 17 |
| Alert | `AD_AlertRule` | 7 | 3 | 0 | — | 4 |

### 3.3 FIC workload — the deeper cut

The metadata that form initialization has to process, beyond raw field count.

| Window | Fields | Cols in table | Aux inputs | Callouts | Display logic | Read-only logic | Logic total |
|--------|-------:|--------------:|-----------:|---------:|--------------:|----------------:|------------:|
| **Sales Invoice** `C_Invoice` | 88 | **164** | **13** | 11 | **71** | **45** | **116** |
| **Product** `M_Product` | 77 | 125 | 4 | 2 | 59 | 6 | 65 |
| **Sales Order** `C_Order` | 50 | 121 | 6 | 7 | 30 | 20 | 50 |
| Business Partner `C_BPartner` | 23 | — | — | 2 | — | — | — |

- **Aux inputs** are SQL expressions the FIC evaluates server-side on every call → **C3**.
- **Cols in table** matters because the FIC iterates *all* columns, not just displayed fields.
- **Display + read-only logic** are expressions the new UI parses and evaluates
  **client-side** on render (`hooks/useDisplayLogic.ts`) → **C1**.
- **Callouts** only run in `NEW` and `CHANGE` mode — see §5.2.

### 3.4 Data volume

Row counts verified with `count(*)`:

| Table | Rows | Windows on it |
|-------|-----:|---------------|
| `fact_acct` | 12,227 | Accounting Transaction Details |
| `c_invoice` | 2,537 | Sales Invoice, Purchase Invoice |
| `fin_payment` | 2,344 | Payment In, Payment Out |
| `m_inout` | 1,506 | Goods Shipment, Goods Receipt |
| `c_order` | 1,464 | Sales Order, Purchase Order, Return from Customer |
| `m_product` | 80 | Product |
| `c_bpartner` | 62 | Business Partner |

---

## 4. What we cannot answer from this instance

**There is no usage data.** Verified: `etmeta_user_favorite` = 0 rows, `etmeta_savedview` = 0,
`ad_session` = 2, and no recent-views table exists. So **"most used" cannot be derived from
data here** — only "most complex" and "most data".

Two further caveats:

1. **The demo dataset is skewed relative to a real deployment.** It has 2,537 invoices but
   only **80 products** and **62 business partners**. In production those proportions
   typically invert. Grid measurements on Product and Business Partner here are therefore
   *not* representative of production grid cost.

2. **`pg_class.reltuples` is a stale estimate.** It reported 2 rows for `ad_user`, where
   `count(*)` returns 40. Always verify with `count(*)` for the windows actually selected.

---

## 5. Preliminary observation — 2026-08-27

An informal check was run: open a random record in form mode on Sales Invoice, Sales Order
and Product. The result was clear and repeatable by eye:

**Sales Invoice is noticeably slower than the other two. Sales Order and Product feel
comparable to each other.**

This is not evidence — one run, no numbers, cache state uncontrolled. But it is enough to
**eliminate hypotheses**, which is what makes it worth recording.

### 5.1 What the observation rules out

| Hypothesis | Sales Invoice | Sales Order | Product | Fits? |
|------------|--------------:|------------:|--------:|-------|
| Combo fan-out drives form-open cost | 18 | **23** | 11 | **No** — Sales Order has the most and is fast |
| Field count drives form-open cost | 88 | 50 | **77** | **No** — Product nearly matches SI and is fast |
| Child tabs load on record open | 10 | 5 | **20** | **No** — Product has twice as many and is fast |

The Product data point is the strongest: if cost scaled with field count, Product (77) should
behave like Sales Invoice (88), not like Sales Order (50).

### 5.2 What it does *not* explain: callouts

Callouts looked like the answer — Sales Invoice has **11** distinct header callouts against
Sales Order's 7 and Product's 2. **It is not.**

In `FormInitializationComponent.java:834`, callouts are only queued when `mode` is `NEW` or
`CHANGE`. Opening an existing record is `EDIT`, so `calloutsToCall` stays empty and
`executeCallouts` returns immediately.

> Callouts *do* matter for the **NEW** variant of P3. Worth knowing there: **6 of the 11
> callouts on `C_Invoice` come from the SII module** (`SiiAuthorizationCallout`,
> `SiiAutoinvoiceCallout`, `SiiAutoSetSIIKEYByDefault`, `SiiDescriptionCallout`,
> `SiiInvoiceOrganizationCallout`). A finding there would be **instance-specific, not core
> Etendo**, and would not generalize to a customer without SII installed.

### 5.3 What remains: two candidates, one per layer

Both reproduce the observed pattern (Sales Invoice far above, Product ≈ Sales Order), but
they live in different layers:

| Candidate | Layer | Sales Invoice | Sales Order | Product |
|-----------|-------|--------------:|------------:|--------:|
| Auxiliary inputs — SQL evaluated inside the FIC call | **C3** | **13** | 6 | 4 |
| Display + read-only logic expressions — parsed and evaluated client-side per render | **C1** | **116** | 50 | 65 |

Static analysis cannot decide between them. **The measurement can, in one shot:** run P3 on
Sales Invoice and compare `bloqueo` against `redUnion`.

- `bloqueo` dominates → it is the logic expressions, in the client (C1).
- `redUnion` dominates, concentrated in the FIC request → it is the auxiliary inputs (C3).

### 5.4 A free tool for the C3 branch

The FIC **already instruments itself** and logs a per-phase breakdown at DEBUG level
(`FormInitializationComponent.java:318`): total elapsed plus 10 phase deltas — validation
dependencies, auxiliary inputs, column values, callouts, and so on.

Enable it with one line in `erp/config/log4j2-web.xml`:

```xml
<Logger name="org.openbravo.client.application.window.FormInitializationComponent" level="debug"/>
```

If the diagnosis points to C3, this gives the exact phase without writing any instrumentation.
Revert to default when done.

---

## 6. Selected windows — 2026-08-27

### The trio

| Role | Window | Table | What it contributes |
|------|--------|-------|---------------------|
| **Primary** | **Sales Invoice** | `C_Invoice` | Where the problem is observable. Full pass. |
| **Contrast** | **Sales Order** | `C_Order` | Most combos in the dictionary (23), yet fast |
| **Contrast** | **Product** | `M_Product` | Nearly as many fields (77), yet fast |

**Sales Invoice — primary.** Run the full pass: P1–P4, cold and warm, both throttling
settings.

| Property | Value |
|----------|-------|
| Header table | `C_Invoice` (2,537 rows) |
| Tabs | 16 (10 direct children) |
| Header fields | **88 — the highest in the instance** |
| Combos | 18 |
| Aux inputs | **13** |
| Logic expressions | **116** |
| Buttons | 17 |

Chosen because it is where a real, reproducible slowdown was observed (§5), and because it is
a core transactional window a real user opens daily. The earlier structural pick was Sales
Order, on the assumption that combo fan-out dominated; the observation weakened that
hypothesis, so the empirical signal takes precedence.

**Sales Order and Product — mandatory contrasts.** Run **P2 warm and P3** on each, no
throttling.

They are not optional extras. Without them, "Sales Invoice takes 3 s" is a number that cannot
be attributed. With them, three hypotheses are already eliminated before the first
measurement, and the remaining two are separated by one comparison. **The trio is the
experiment; the primary window alone is just a number.**

Both should also confirm the observation with actual numbers — replacing the informal check
of §5 with measured p50/max.

### Optional extensions

Only if a specific question comes up:

| Window | Isolates | Why |
|--------|----------|-----|
| **Accounting Transaction Details** (`Fact_Acct`) | Row volume | 12,227 rows, 1 tab, 24 fields. The only genuinely large grid in the instance, with minimal metadata noise. Best candidate for the "grid in edit mode" case where row virtualization is disabled (§5.6) |
| **Business Partner** (`C_BPartner`) | Framework floor | 23 fields, 4 combos, 62 rows. Whatever it still costs is overhead no window-level optimization removes. Defines the reachable target |
| **Alert** (`AD_AlertRule`) | Absolute floor | 7 fields, 3 combos, 20 rows. Use if Business Partner still looks slow |
| **Financial Account** | Process modals | 8 process buttons, the most in the instance |

---

## 7. How to use this with the results template

Copy [`metrics-template.md`](./metrics-template.md) once per window and throttling setting:

```
results-sales-invoice-2026-08-27-cpu1x.md    <- primary, full pass
results-sales-invoice-2026-08-27-cpu4x.md    <- primary, full pass
results-sales-order-2026-08-27-cpu1x.md      <- contrast, P2 warm + P3
results-product-2026-08-27-cpu1x.md          <- contrast, P2 warm + P3
```

Leave the points you did not measure blank. A blank cell means "not measured"; it never means
zero. Record the verified `count(*)` in the Context section — not the `reltuples` estimate.

When the three files are filled, the first question to answer is the one from §5.3: for
Sales Invoice's P3, does `bloqueo` or `redUnion` dominate?

---

## 8. Queries

Re-run against any instance, especially a real customer database.

**Header-tab complexity** — the ranking that drives P3:

```sql
WITH hdr AS (
  SELECT w.ad_window_id, w.name AS win, t.ad_tab_id, LOWER(tb.tablename) AS tbl,
         ROW_NUMBER() OVER (PARTITION BY w.ad_window_id ORDER BY t.seqno) rn
  FROM ad_window w
  JOIN ad_tab   t  ON t.ad_window_id = w.ad_window_id AND t.isactive = 'Y' AND t.tablevel = 0
  JOIN ad_table tb ON tb.ad_table_id = t.ad_table_id
  WHERE w.isactive = 'Y'
)
SELECT h.win || ' [' || h.tbl || ']' AS window,
       (SELECT count(*) FROM ad_tab x
         WHERE x.ad_window_id = h.ad_window_id AND x.isactive = 'Y')            AS tabs,
       count(f.ad_field_id)                                                     AS hdr_fields,
       count(f.ad_field_id) FILTER (
         WHERE c.ad_reference_id IN ('18','19','30',
               '95E2A8B50A254B2AAE6774B8C2F28120'))                             AS combos,
       count(f.ad_field_id) FILTER (WHERE c.ad_reference_id = '17')             AS lists,
       count(f.ad_field_id) FILTER (WHERE c.ad_reference_id = '28')             AS buttons
FROM hdr h
JOIN ad_field  f ON f.ad_tab_id = h.ad_tab_id AND f.isactive = 'Y' AND f.isdisplayed = 'Y'
JOIN ad_column c ON c.ad_column_id = f.ad_column_id
WHERE h.rn = 1
GROUP BY h.win, h.tbl, h.ad_window_id
ORDER BY combos DESC, hdr_fields DESC
LIMIT 25;
```

**FIC workload** — what §3.3 is built from:

```sql
WITH hdr AS (
  SELECT w.name AS win, t.ad_tab_id, t.ad_table_id, LOWER(tb.tablename) AS tbl,
         w.ad_window_id,
         ROW_NUMBER() OVER (PARTITION BY w.ad_window_id ORDER BY t.seqno) rn
  FROM ad_window w
  JOIN ad_tab   t  ON t.ad_window_id = w.ad_window_id AND t.isactive = 'Y' AND t.tablevel = 0
  JOIN ad_table tb ON tb.ad_table_id = t.ad_table_id
  WHERE w.isactive = 'Y'
)
SELECT h.win || ' [' || h.tbl || ']' AS window,
       count(f.ad_field_id)                                                  AS fields,
       (SELECT count(*) FROM ad_column cc
         WHERE cc.ad_table_id = h.ad_table_id AND cc.isactive = 'Y')         AS cols_in_table,
       (SELECT count(*) FROM ad_auxiliarinput a
         WHERE a.ad_tab_id = h.ad_tab_id AND a.isactive = 'Y')               AS aux_inputs,
       count(DISTINCT c.ad_callout_id)                                       AS callouts,
       count(f.ad_field_id) FILTER (WHERE f.displaylogic  IS NOT NULL)       AS display_logic,
       count(f.ad_field_id) FILTER (WHERE c.readonlylogic IS NOT NULL)       AS readonly_logic
FROM hdr h
JOIN ad_field  f ON f.ad_tab_id = h.ad_tab_id AND f.isactive = 'Y' AND f.isdisplayed = 'Y'
JOIN ad_column c ON c.ad_column_id = f.ad_column_id
WHERE h.rn = 1
GROUP BY h.win, h.tbl, h.ad_tab_id, h.ad_table_id, h.ad_window_id
ORDER BY aux_inputs DESC, fields DESC
LIMIT 25;
```

**Data volume per header table** — approximate; confirm with `count(*)`:

```sql
WITH hdr AS (
  SELECT DISTINCT w.name AS win, LOWER(tb.tablename) AS tbl
  FROM ad_window w
  JOIN ad_tab   t  ON t.ad_window_id = w.ad_window_id AND t.isactive = 'Y' AND t.tablevel = 0
  JOIN ad_table tb ON tb.ad_table_id = t.ad_table_id
  WHERE w.isactive = 'Y'
)
SELECT h.win, h.tbl, c.reltuples::bigint AS approx_rows
FROM hdr h
JOIN pg_class c ON c.relname = h.tbl AND c.relkind = 'r'
WHERE c.reltuples > 100
ORDER BY c.reltuples DESC
LIMIT 25;
```

**Usage data**, if the instance has any:

```sql
SELECT 'favorites'   AS src, count(*) FROM etmeta_user_favorite
UNION ALL SELECT 'saved views', count(*) FROM etmeta_savedview
UNION ALL SELECT 'sessions',    count(*) FROM ad_session;
```

On a customer instance with real activity, `etmeta_user_favorite` grouped by window is the
closest thing to a usage signal available, and should override the structural ranking for the
primary pick.
