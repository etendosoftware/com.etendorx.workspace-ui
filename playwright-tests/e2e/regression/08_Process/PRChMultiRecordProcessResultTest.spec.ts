import type { Request } from "@playwright/test";
import type { ApiData, RecordValues, SavedRecord } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { overrideField } from "../../support/processOverrides";
import { DATASOURCE } from "../../support/registry/datasources";
import { WINDOW_IDS } from "../../support/registry/windows";
import { runAndWaitForResponse } from "../../support/wait";

/** The display logic of the button without its `InvoiceProcessButton` preference, which the bare core lacks. */
const SHOWN_UNLESS_CLOSED_OR_VOIDED =
  "OB.Utilities.getValue(currentValues,'documentStatus') !== 'CL' && OB.Utilities.getValue(currentValues,'documentStatus') !== 'VO'";
/**
 * Menu entry of the button: its list value, as in Classic. With several records selected only multi-record
 * processes stay in the menu, so the classic "Complete" (DocAction) never competes with it.
 */
const COMPLETE = "Complete";
const COMBINED_WARNING = "1 registers successfully processed and 2 registers failed";
const DRAFT = "DR";
const COMPLETED = "CO";
/** The execution of the Bulk Completion handler; `ProcessInvoicesDefaults` only loads the document actions. */
const isExecution = (url: string) => url.includes("ProcessInvoices") && !url.includes("ProcessInvoicesDefaults");
/** Header fields copied from the sample invoice: document type, business partner, prices and payment. */
const HEADER_FIELDS = [
  "organization",
  "documentType",
  "transactionDocument",
  "businessPartner",
  "partnerAddress",
  "priceList",
  "currency",
  "paymentTerms",
  "paymentMethod",
  "salesTransaction",
];
/** Line fields copied from the first line of the sample invoice: product, unit, prices and tax. */
const LINE_FIELDS = ["organization", "product", "uOM", "unitPrice", "listPrice", "standardPrice", "tax"];

let drafts: SavedRecord[] = [];

// Removed while the page is still open, also when the test failed or timed out. A completed invoice cannot
// be deleted: it stays, with its unique number, like the documents of the sales flows.
test.afterEach(async ({ api }) => {
  for (const draft of drafts) {
    await api.remove(DATASOURCE.SALES_INVOICE, draft.id);
  }
  drafts = [];
});

/** The first record whose `field` equals `value`. */
async function fetchOne(
  api: ApiData,
  target: (typeof DATASOURCE)[keyof typeof DATASOURCE],
  field: string,
  value: string
): Promise<RecordValues> {
  const [record] = await api.fetch(target, { criteria: [{ fieldName: field, operator: "equals", value }], limit: 1 });
  expect(record, `no ${target.entity} with ${field} = ${value}`).toBeDefined();
  return record;
}

/** The values of `fields` in `record`. */
const pick = (record: RecordValues, fields: string[]): RecordValues =>
  Object.fromEntries(fields.map((field) => [field, record[field]]));

/**
 * Multi-record processes run once for the whole selection, as in Classic: the handler answers with one
 * combined message, and a partial failure is a warning, never a success. The core ships the multi-record
 * "Process Invoices" of com.smf.jobs.defaults but attaches it to no window (the Bulk Completion button of
 * Sales Invoice comes from a module CI does not install), so the spec wires the "Process Invoices" button
 * of the Sales Invoice header to it, with the metadata the backend serves for that process. The handler,
 * its request and its answer are real: it completes one invoice with a line and fails on two without lines.
 */
test.describe("Multi-record process - one combined result @regression @process", () => {
  test("runs Process Invoices in one request and reports a partial failure as a warning", async ({
    app,
    api,
    data,
    page,
  }) => {
    // `processAction: undefined` drops the classic process from the served JSON: the button runs the definition
    const override = await overrideField(page, WINDOW_IDS.SALES_INVOICE, data.FIELD.SALES_INVOICE_PROCESS_INVOICES, {
      processAction: undefined,
      processDefinition: await api.processMetadata(data.PROCESS.PROCESS_INVOICES),
      displayLogicExpression: SHOWN_UNLESS_CLOSED_OR_VOIDED,
    });

    // Two invoices without lines (completing them fails) and one with a line (completing it succeeds)
    const sample = await fetchOne(
      api,
      DATASOURCE.SALES_INVOICE,
      "documentNo",
      data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING
    );
    const sampleLine = await fetchOne(api, DATASOURCE.SALES_INVOICE_LINE, "invoice", String(sample.id));
    const today = new Date().toISOString().slice(0, 10);
    const addInvoice = (documentNo: string) =>
      api.add(DATASOURCE.SALES_INVOICE, {
        ...pick(sample, HEADER_FIELDS),
        documentNo,
        invoiceDate: today,
        accountingDate: today,
      });
    const [noLinesA, noLinesB, withLine] = [
      await addInvoice(data.uniqueValue("PRCh")),
      await addInvoice(data.uniqueValue("PRCh")),
      await addInvoice(data.uniqueValue("PRCh")),
    ];
    drafts = [noLinesA, noLinesB];
    await api.add(DATASOURCE.SALES_INVOICE_LINE, {
      ...pick(sampleLine, LINE_FIELDS),
      invoice: withLine.id,
      lineNo: 10,
      invoicedQuantity: 1,
      lineNetAmount: sampleLine.unitPrice,
    });
    const invoices = [noLinesA, noLinesB, withLine];
    const documentNumbers = invoices.map((invoice) => String(invoice.documentNo));

    await app.sidebar.navigateTo("salesInvoice");
    expect(override.applied, "the Process Invoices field was not found in the window metadata").toBeGreaterThan(0);
    await app.grid.filter("Document No.", documentNumbers.map((documentNo) => `==${documentNo}`).join(" or "));
    for (const documentNo of documentNumbers) {
      await app.grid.setRowSelected(app.grid.rowWithCell(documentNo), true);
    }

    const executions: Request[] = [];
    const recordExecution = (request: Request) => {
      if (request.method() === "POST" && isExecution(request.url())) {
        executions.push(request);
      }
    };
    page.on("request", recordExecution);
    await app.toolbar.process(COMPLETE);
    const response = await runAndWaitForResponse(
      page,
      (candidate) => isExecution(candidate.url()),
      () => app.processModal.execute()
    );
    await app.toast.expectWarning(COMBINED_WARNING);
    page.off("request", recordExecution);

    expect(executions, "the process must run once for the whole selection").toHaveLength(1);
    expect(executions[0].postDataJSON().recordIds).toEqual(invoices.map((invoice) => invoice.id));
    const message = (await response.json()).responseActions?.[0]?.showMsgInProcessView;
    expect(message?.msgType).toBe("warning");
    expect(message?.msgText).toContain(COMBINED_WARNING);

    const statusOf = async (invoice: SavedRecord) =>
      (await fetchOne(api, DATASOURCE.SALES_INVOICE, "id", invoice.id)).documentStatus;
    expect(await statusOf(withLine)).toBe(COMPLETED);
    expect(await statusOf(noLinesA)).toBe(DRAFT);
    expect(await statusOf(noLinesB)).toBe(DRAFT);
  });
});
