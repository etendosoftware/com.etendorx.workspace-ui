// Render counter: which React components render during one form Next (or one grid ArrowDown), and why. No app changes: it installs
// a stub React DevTools hook and walks the fiber tree on every commit.
// Run it against `next dev` (production builds minify component names):
//   cd packages/MainUI && npx next dev -p 3400
//   BASE_URL=http://localhost:3400 node perf/render-count.mjs
// Env: ACTION (next | arrow), WINDOW (default Sales Invoice), TOP (components listed, default 40), WATCH (comma list of components
// counted per commit), CAUSE (comma list of components whose render causes are printed per commit:
// changed props, changed state hooks by index, changed contexts).
import { chromium } from "@playwright/test";

const BASE = (process.env.BASE_URL || "http://localhost:3400").replace(/\/$/, "");
const WINDOW = process.env.WINDOW || "Sales Invoice";
const TOP = Number(process.env.TOP ?? 40);
const WATCH = process.env.WATCH || "FormViewComponent,BaseSelectorComp,MRT_TableBodyRow";
const CAUSE = process.env.CAUSE || "";
const ACTION = process.env.ACTION || "next"; // "next": one form Next; "arrow": one ArrowDown in the grid
const USER = process.env.ETENDO_USER || "admin";
const PASS = process.env.ETENDO_PASS || "admin";
const FILTER_BUTTON_ID = "D73C2AD100854463B3F697F3D36CDE3E"; // implicit filter toggle, as in bench.mjs
const TIMEOUT = 120_000;

/** Runs in the page before React loads. */
function installHook() {
  let commit = 0;
  // A fiber rendered in this commit has PerformedWork (flag 1) and was not in the previous commit's tree:
  // a re-rendered fiber is the alternate object, while a skipped subtree keeps the same (stale-flag) fibers.
  const lastVisit = new WeakMap();
  const rc = { on: false, watch: [], cause: [], counts: {}, commits: [] };
  window.__RC = rc;
  const nameOf = (type) =>
    (typeof type !== "string" &&
      type &&
      (type.displayName ||
        type.name ||
        type.render?.displayName ||
        type.render?.name ||
        type.type?.displayName ||
        type.type?.name)) ||
    null;
  const preview = (v) => {
    if (v === null || typeof v !== "object") return String(v).slice(0, 40);
    if (Array.isArray(v)) return `Array(${v.length})`;
    const keys = Object.keys(v);
    return `{${keys.slice(0, 6).join(",")}${keys.length > 6 ? ",…" : ""}}`;
  };
  const causes = (fiber) => {
    const prev = fiber.alternate;
    if (!prev) return ["mount"];
    const why = [];
    if (prev.memoizedProps !== fiber.memoizedProps) {
      const a = prev.memoizedProps || {};
      const b = fiber.memoizedProps || {};
      const changed = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !Object.is(a[k], b[k]));
      why.push(`props:${changed.join("|") || "(same values)"}`);
    }
    // State hooks (useState/useReducer/useSyncExternalStore) are the ones with a queue.
    for (
      let h = fiber.memoizedState, p = prev.memoizedState, i = 0;
      h && p && "next" in h;
      h = h.next, p = p.next, i++
    ) {
      if (h.queue && !Object.is(h.memoizedState, p.memoizedState)) why.push(`state#${i}=${preview(h.memoizedState)}`);
    }
    for (let c = fiber.dependencies?.firstContext, p = prev.dependencies?.firstContext; c; c = c.next, p = p?.next) {
      if (!p || !Object.is(c.memoizedValue, p.memoizedValue)) {
        why.push(`ctx:${c.context.displayName || preview(c.memoizedValue)}`);
      }
    }
    return why;
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(),
    supportsFiber: true,
    isDisabled: false,
    checkDCE() {},
    inject(renderer) {
      const id = this.renderers.size + 1;
      this.renderers.set(id, renderer);
      return id;
    },
    onScheduleFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onCommitFiberRoot(_id, root) {
      commit++;
      const entry = { t: Math.round(performance.now()) };
      const stack = [root.current];
      while (stack.length) {
        const fiber = stack.pop();
        if (rc.on && fiber.flags & 1 && lastVisit.get(fiber) !== commit - 1) {
          const name = nameOf(fiber.type);
          if (name) {
            rc.counts[name] = (rc.counts[name] || 0) + 1;
            if (rc.watch.includes(name)) entry[name] = (entry[name] || 0) + 1;
            if (rc.cause.includes(name)) {
              entry[`why:${name}`] = entry[`why:${name}`] || [];
              entry[`why:${name}`].push(causes(fiber).join(" "));
            }
          }
        }
        lastVisit.set(fiber, commit);
        if (fiber.sibling) stack.push(fiber.sibling);
        if (fiber.child) stack.push(fiber.child);
      }
      if (rc.on && Object.keys(entry).length > 1) rc.commits.push(entry);
    },
  };
}

const visible = (locator) => locator.filter({ visible: true }).first();

async function main() {
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await context.addInitScript(installHook);
  const page = await context.newPage();

  await page.goto(`${BASE}/`);
  await page.getByLabel("Username").fill(USER);
  await page.getByRole("textbox", { name: "Password" }).fill(PASS);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.getByRole("button", { name: "Add widget" }).waitFor({ timeout: TIMEOUT });

  const search = page.getByRole("textbox", { name: "Search" });
  if (!(await search.isVisible().catch(() => false))) await page.getByRole("button").first().click();
  await search.fill(WINDOW);
  const items = page.getByText(WINDOW, { exact: true }).filter({ visible: true });
  await items.first().waitFor({ timeout: TIMEOUT });
  await items.last().click();
  await visible(page.getByText(/Showing \d+ records?/)).waitFor({ timeout: TIMEOUT });
  await visible(page.getByTestId(`IconButton__${FILTER_BUTTON_ID}`))
    .click()
    .catch(() => {});
  await visible(page.getByText(/Showing [1-9]\d* records?/)).waitFor({ timeout: TIMEOUT });
  const startCounting = () =>
    page.evaluate(
      ([watch, cause]) => Object.assign(window.__RC, { on: true, watch, cause, counts: {}, commits: [] }),
      [WATCH.split(","), CAUSE.split(",").filter(Boolean)]
    );

  if (ACTION === "arrow") {
    // One ArrowDown in the grid, from the second row
    await visible(page.locator("table tbody tr").nth(1).locator("td").nth(3)).click();
    await page.waitForTimeout(3000); // selection side effects settle (400 ms) and their fetches end
    await startCounting();
    await page.keyboard.press("ArrowDown");
  } else {
    await visible(page.locator("table tbody tr td").nth(3)).dblclick();
    await page.waitForURL(/ri_\d+=/, { timeout: TIMEOUT });

    const position = Number.parseInt(await visible(page.getByTestId("record-position-indicator")).innerText(), 10);
    await page.waitForFunction(
      () => {
        const button = [...document.querySelectorAll('[data-testid="next-record-button"]')].find((e) => e.offsetParent);
        return button && !button.disabled;
      },
      null,
      { timeout: TIMEOUT }
    );
    await page.waitForTimeout(2000); // let the opened record settle before counting

    await startCounting();
    await visible(page.getByTestId("next-record-button")).click({ timeout: TIMEOUT });
    await page.waitForFunction(
      (target) => {
        const el = [...document.querySelectorAll('[data-testid="record-position-indicator"]')].find(
          (e) => e.offsetParent
        );
        return Number.parseInt(el?.textContent ?? "", 10) === target;
      },
      position + 1,
      { timeout: TIMEOUT }
    );
  }
  await page.waitForTimeout(3000); // trailing commits (settled fetches, debounces)
  const rc = await page.evaluate(() => {
    window.__RC.on = false;
    return window.__RC;
  });
  await browser.close();

  const counts = Object.entries(rc.counts).sort((a, b) => b[1] - a[1]);
  console.log(
    `${WINDOW}, ${ACTION === "arrow" ? "one grid ArrowDown" : "one form Next"}: ${rc.commits.length} commits, ${counts.reduce((s, [, c]) => s + c, 0)} renders`
  );
  for (const [name, count] of counts.slice(0, TOP)) console.log(String(count).padStart(7), name);
  console.log(`\nPer commit (${WATCH}${CAUSE ? `; causes of ${CAUSE}` : ""}):`);
  for (const { t, ...rest } of rc.commits) {
    const watched = Object.entries(rest).filter(([k]) => !k.startsWith("why:"));
    if (!watched.length) continue;
    console.log(`${String(t).padStart(7)} ms  ${watched.map(([k, v]) => `${k} ${v}`).join(", ")}`);
    for (const [k, list] of Object.entries(rest).filter(([key]) => key.startsWith("why:"))) {
      const grouped = new Map();
      for (const why of list) grouped.set(why, (grouped.get(why) || 0) + 1);
      for (const [why, n] of grouped) console.log(`            ${k.slice(4)} ×${n}: ${why}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
