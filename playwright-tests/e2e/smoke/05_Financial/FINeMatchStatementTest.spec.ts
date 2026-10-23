import type { Locator, Page } from "@playwright/test";
import { ApiData } from "../../support/api/ApiData";
import { App, MATCH_ROW_ACTION, SECOND_NESTED_LEVEL } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import * as data from "../../support/registry/data";
import { DATASOURCE } from "../../support/registry/datasources";
import { TABS } from "../../support/registry/windows";

/**
 * Match Statement (ETP-5877): the matching algorithm prompt, the row buttons of the Match column
 * (Search, Add, Clear) and "Unmatch Selected", on a bank statement of Spain Bank the spec creates.
 *
 * The tests run in order on the same statement: each one starts from the state the previous one
 * left (Search matches the line Clear then unmatches). Spain Bank is used by this spec only.
 */

const ACCOUNT = data.FINANCIAL_ACCOUNT.SPAIN_BANK;
const ONE_DAY_MS = 86_400_000;
const MATCH_COLUMN = "Match";
/** Text of the "Matched Document" cell of a matched line. */
const MATCHED_DOCUMENT = "Transaction";
const BP_WITHDRAWAL = { value: "BPW", name: "BP Withdrawal" };
const ALGORITHM_PROMPT = "Do you want the algorithm to be run against unmatched bank statement lines?";
const UNTRANSLATED_MESSAGE = "APRM_";
const ALGORITHM_RESULT = /The automatic matching algorithm has matched \d+ transaction\(s\)/;
const UNMATCHED_RESULT = /1 record\(s\) were properly unmatched/;
const SEARCH_TITLE = "Match to a not cleared transaction";
const ADD_TITLE = "Add new transaction";
const PROCESS = "Process";
const BUSINESS_PARTNER = "Business Partner";
/** Column of the Business Partner search popup of Add Transaction. */
const COMMERCIAL_NAME = "Commercial Name";
const PAYMENT = "Payment";
const ADD_PAYMENT_TITLE = "Add Payment";
const DEPOSIT_TO = "Deposit To";
const RECEIVED_FROM = "Received From";
const ACTION_REGARDING_DOCUMENT = "Action Regarding Document";
const PROCESS_MADE_PAYMENT = "Process Made Payment(s)";

/**
 * A bank statement line and a transaction that matches it: same G/L item, date and amount. A pair
 * `withoutGLItem` is a line alone, with no G/L item, so Add Transaction offers its Payment field.
 */
interface MatchPair {
  reference: string;
  amount: number;
  withoutGLItem?: boolean;
}

/** Day after `isoDate` ("2026-10-23" → "2026-10-24"). */
function nextDay(isoDate: string): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + ONE_DAY_MS).toISOString().slice(0, 10);
}

/**
 * Date of the new statement lines. Classic only processes a statement whose lines are later than
 * every line of the processed statements of the account: the day after the last one, or today.
 */
async function nextStatementDate(api: ApiData): Promise<string> {
  const [last] = await api.fetch(DATASOURCE.BANK_STATEMENT_LINE, {
    criteria: [
      { fieldName: "bankStatement.account.id", operator: "equals", value: ACCOUNT.id },
      { fieldName: "bankStatement.processed", operator: "equals", value: true },
    ],
    sortBy: "-transactionDate",
    limit: 1,
  });
  const today = new Date().toISOString().slice(0, 10);
  const after = last ? nextDay(String(last.transactionDate).slice(0, 10)) : today;
  return after > today ? after : today;
}

/** Creates a processed statement with a line per pair, and a processed transaction per pair. */
async function createStatement(app: App, statementName: string, pairs: MatchPair[]): Promise<void> {
  const api = new ApiData(app.page);
  const date = await nextStatementDate(api);
  const statement = await api.add(DATASOURCE.BANK_STATEMENT, {
    organization: data.ORGANIZATION_ID.SPAIN,
    account: ACCOUNT.id,
    documentType: data.DOCUMENT_TYPE.BANK_STATEMENT_FILE.id,
    documentNo: statementName,
    name: statementName,
    importdate: date,
    transactionDate: date,
  });
  for (const [index, pair] of pairs.entries()) {
    const shared = {
      organization: data.ORGANIZATION_ID.SPAIN,
      transactionDate: date,
      ...(pair.withoutGLItem ? {} : { gLItem: data.GL_ITEM.SALARIES.id }),
    };
    await api.add(DATASOURCE.BANK_STATEMENT_LINE, {
      ...shared,
      bankStatement: statement.id,
      lineNo: (index + 1) * 10,
      referenceNo: pair.reference,
      dramount: pair.amount,
      cramount: 0,
    });
    if (pair.withoutGLItem) continue;
    await api.add(DATASOURCE.FINANCIAL_ACCOUNT_TRANSACTION, {
      ...shared,
      account: ACCOUNT.id,
      transactionType: BP_WITHDRAWAL.value,
      lineNo: (index + 1) * 10,
      dateAcct: date,
      currency: data.CURRENCY_ID.EUR,
      paymentAmount: pair.amount,
      depositAmount: 0,
      description: pair.reference,
    });
  }
  await processRecord(app, TABS.FINANCIAL_ACCOUNT_BANK_STATEMENT, "Imported Bank Statements", "Name", statementName);
  for (const pair of pairs.filter((candidate) => !candidate.withoutGLItem)) {
    await processRecord(app, TABS.FINANCIAL_ACCOUNT_TRANSACTION, "Transaction", "Description", pair.reference);
  }
}

/** Runs the legacy "Process" of the record of a child tab of the account with `value` in `column`. */
async function processRecord(app: App, tabId: string, tabName: string, column: string, value: string): Promise<void> {
  await app.tabs.open(tabName);
  const tab = app.page.getByTestId(`Tab__${tabId}`);
  await app.grid.filter(column, value, tab);
  await app.grid.setRowSelected(app.grid.rowWithCell(value, tab), true);
  await app.toolbar.inTab(tabId).process(PROCESS);
  await app.processModal.waitForLegacy();
  await app.processModal.confirm();
  await app.processModal.expectSuccess();
  await app.processModal.finishLegacy();
}

async function openAccount(app: App): Promise<void> {
  await app.sidebar.navigateTo("financialAccount");
  await app.grid.filter("Name", ACCOUNT.name);
  await app.grid.selectRow(ACCOUNT.name);
}

/** Opens Match Statement from the account; it opens asking whether to run the matching algorithm. */
async function openMatchStatement(app: App): Promise<void> {
  await openAccount(app);
  await app.toolbar.process("Match Statement");
  await app.processModal.expectTitle("Match Statement");
}

/**
 * The statement line of `pair`, matched or not: the Match column opens filtered on unmatched
 * lines, so its filter is removed. Lines are found by their amount, unique to the run.
 */
async function showLine(app: App, pair: MatchPair): Promise<Locator> {
  const modal = app.matchStatement.modal;
  await app.grid.clearFilter(MATCH_COLUMN, modal);
  await app.grid.filter("Amount", String(-pair.amount), modal);
  const row = app.grid.rowWithCell(String(-pair.amount), modal);
  await row.waitFor({ state: "visible" });
  return row;
}

/** Opens Match Statement without running the algorithm and shows the line of `pair`. */
async function openOnLine(app: App, pair: MatchPair): Promise<Locator> {
  await openMatchStatement(app);
  await app.matchStatement.answerAlgorithmPrompt(false);
  return showLine(app, pair);
}

/** A matched line shows its transaction and only Clear; an unmatched one only Search and Add. */
async function expectMatched(app: App, row: Locator, matched: boolean): Promise<void> {
  const { matchStatement } = app;
  if (matched) {
    await expect(row).toContainText(MATCHED_DOCUMENT);
  } else {
    await expect(row).not.toContainText(MATCHED_DOCUMENT);
  }
  await expect(matchStatement.rowButton(row, MATCH_ROW_ACTION.SEARCH)).toBeEnabled({ enabled: !matched });
  await expect(matchStatement.rowButton(row, MATCH_ROW_ACTION.ADD)).toBeEnabled({ enabled: !matched });
  await expect(matchStatement.rowButton(row, MATCH_ROW_ACTION.CLEAR)).toBeEnabled({ enabled: matched });
}

async function login(page: Page): Promise<App> {
  const app = new App(page);
  await app.auth.login();
  await app.auth.selectRoleOrgWarehouse({});
  return app;
}

test.describe.configure({ mode: "serial" });

test.describe("Financial Account - Match Statement @smoke", () => {
  const statementName = data.uniqueValue("FINe");
  /** Amounts unique to the run (lines are found by amount), below 1000 so they show without a group separator. */
  const baseAmount = 100 + Math.round(Date.now() % 80_000) / 100;
  /** Matched by the algorithm (happy path), then unmatched with "Unmatch Selected". */
  const algorithmLine: MatchPair = { reference: data.uniqueValue("FINe-A"), amount: baseAmount };
  /** Matched and unmatched with the row buttons. */
  const rowButtonsLine: MatchPair = { reference: data.uniqueValue("FINe-B"), amount: baseAmount + 1 };
  /** Opens Add Transaction with its Payment field, to create the payment from its "+". */
  const paymentLine: MatchPair = { reference: data.uniqueValue("FINe-C"), amount: baseAmount + 2, withoutGLItem: true };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const app = await login(page);
    await openAccount(app);
    await createStatement(app, statementName, [algorithmLine, rowButtonsLine, paymentLine]);
    await page.close();
  });

  test("Cancel in the algorithm prompt keeps the lines unmatched; Search, Add and Clear are in the Match column", async ({
    app,
  }) => {
    const { matchStatement } = app;
    const row = await openOnLine(app, rowButtonsLine);

    // The algorithm did not run: the line stays unmatched although a transaction matches it
    await expectMatched(app, row, false);

    // The row buttons render in the Match column, not in an extra (empty) actions column
    await expect(matchStatement.modal.getByRole("columnheader", { name: "Actions", exact: true })).toHaveCount(0);
    const matchColumn = await matchStatement.columnIndexOf(app.grid.columnHeader(MATCH_COLUMN, matchStatement.modal));
    expect(matchColumn).not.toBeNull();
    for (const action of Object.values(MATCH_ROW_ACTION)) {
      expect(await matchStatement.columnIndexOf(matchStatement.rowButton(row, action))).toBe(matchColumn);
    }
  });

  test("Search matches the line with the transaction picked in Find Transactions", async ({ app }) => {
    const { matchStatement } = app;
    const row = await openOnLine(app, rowButtonsLine);

    await matchStatement.openFromRow(row, MATCH_ROW_ACTION.SEARCH);
    await expect(matchStatement.nestedTitle).toHaveText(SEARCH_TITLE);
    await app.grid.filter("Description", rowButtonsLine.reference, matchStatement.nestedModal);
    await app.grid.setRowSelected(app.grid.rowWithCell(rowButtonsLine.reference, matchStatement.nestedModal), true);
    await matchStatement.executeNested();

    await expectMatched(app, row, true);
  });

  test("Clear unmatches the line", async ({ app }) => {
    const { matchStatement } = app;
    const row = await openOnLine(app, rowButtonsLine);
    await expectMatched(app, row, true);

    await matchStatement.rowButton(row, MATCH_ROW_ACTION.CLEAR).click();

    await expectMatched(app, row, false);
  });

  test("Add opens Add Transaction with the data of the line", async ({ app }) => {
    const { matchStatement } = app;
    const row = await openOnLine(app, rowButtonsLine);

    await matchStatement.openFromRow(row, MATCH_ROW_ACTION.ADD);
    await expect(matchStatement.nestedTitle).toHaveText(ADD_TITLE);
    await app.field.expectToContain("Transaction Type", BP_WITHDRAWAL.name);
    await app.field.expectToContain("G/L Item", data.GL_ITEM.SALARIES.name);
    await expect(app.field.input("Withdrawal Amount")).toHaveValue(rowButtonsLine.amount.toFixed(2));

    // Closing it creates nothing: the line stays unmatched
    await matchStatement.closeNested();
    await expectMatched(app, row, false);
  });

  test("The magnifying glass of an Add Transaction selector picks the record filtered in its popup", async ({
    app,
    data,
  }) => {
    const { matchStatement } = app;
    const vendor = data.BUSINESS_PARTNER.VENDOR_A.name;
    await matchStatement.openFromRow(await openOnLine(app, paymentLine), MATCH_ROW_ACTION.ADD);

    const businessPartner = app.selectorModal(data.PROCESS_PARAMETER.ADD_TRANSACTION_BUSINESS_PARTNER);
    await businessPartner.open();
    await businessPartner.filter(COMMERCIAL_NAME, vendor);
    await businessPartner.pick(vendor);

    await expect(businessPartner.dialog).toBeHidden();
    await app.field.expectToContain(BUSINESS_PARTNER, vendor);
    await matchStatement.closeNested();
  });

  test("The + of Payment creates the payment in Add Payment, which comes back to Add Transaction", async ({
    app,
    data,
  }) => {
    const { matchStatement } = app;
    const vendor = data.BUSINESS_PARTNER.VENDOR_A;
    const row = await openOnLine(app, paymentLine);
    await matchStatement.openFromRow(row, MATCH_ROW_ACTION.ADD);

    const payment = app.selectorModal(data.PROCESS_PARAMETER.ADD_TRANSACTION_PAYMENT);
    await expect(payment.searchButton).toBeVisible();
    await payment.addButton.click();

    // Add Payment opens on top with the data of the transaction: a payment made from the account
    await expect(matchStatement.secondNestedTitle).toHaveText(ADD_PAYMENT_TITLE);
    await app.field.expectToContain(DEPOSIT_TO, ACCOUNT.name);
    await app.field.selectById(RECEIVED_FROM, vendor.id, { search: vendor.name });
    await app.field.select(ACTION_REGARDING_DOCUMENT, PROCESS_MADE_PAYMENT);
    await matchStatement.executeNested(SECOND_NESTED_LEVEL);

    // The created payment is the Payment of the transaction, which then matches the line
    await app.field.expectToContain(PAYMENT, vendor.name);
    await matchStatement.executeNested();
    await expectMatched(app, row, true);
  });

  test("Confirm in the algorithm prompt runs the matching algorithm", async ({ app }) => {
    const { matchStatement } = app;
    await openMatchStatement(app);

    await expect(matchStatement.algorithmPrompt).toContainText(ALGORITHM_PROMPT);
    await expect(matchStatement.algorithmPrompt).not.toContainText(UNTRANSLATED_MESSAGE);
    await matchStatement.answerAlgorithmPrompt(true);

    await expect(app.processModal.messageBar).toContainText(ALGORITHM_RESULT);
    await expectMatched(app, await showLine(app, algorithmLine), true);
  });

  test("Unmatch Selected unmatches the selected matched lines", async ({ app }) => {
    const { matchStatement } = app;
    const row = await openOnLine(app, algorithmLine);
    await expectMatched(app, row, true);
    await expect(matchStatement.unmatchSelectedButton).toBeHidden();

    await app.grid.setRowSelected(row, true);
    await matchStatement.unmatchSelectedButton.click();

    await expect(app.processModal.messageBar).toContainText(UNMATCHED_RESULT);
    await expect(matchStatement.unmatchSelectedButton).toBeHidden();
    await expectMatched(app, row, false);
  });
});
