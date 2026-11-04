# Toolbar Print and Email

_Last updated: 2026-10-29 (ETP-6008)_

The toolbar **Print** (`PRINT_RECORD`) and **Email** (`SEND_MAIL`) buttons appear in the same tabs as in the classic UI and follow its enable rules. Printing uses the document print service for PrintController documents (orders, invoices, shipments, payments). Any other print process is delegated to the classic print page.

## Behavior

### Visibility

| Button | Shown when | Classic source |
|--------|-----------|----------------|
| Print | The tab has a print process (`AD_Tab.AD_Process_ID`) | `OBViewTab.getIconButtons` |
| Email | The print URL of that process contains `orders`, `invoices` or `payments` | `OBViewTab.PrintButton.hasEmail` |

The backend works out both rules from the tab configuration and sends them as `tab.printConfig`. The client never inspects the process name, so translated names do not change which buttons appear.

| Tab (examples) | Print | Email |
|----------------|-------|-------|
| Sales/Purchase Order, Sales Quotation, Sales/Purchase Invoice, Payment In/Out | ✔ | ✔ |
| Goods Shipment, Goods Receipt | ✔ | ✘ |
| Business Partner, Remittance, Tax Payment (Header and Tax Register Header) | ✔ | ✘ |
| Product and any tab without print process | ✘ | ✘ |

### Enable rules

These are the same rules as the classic `BUTTON_PROPERTIES.print` and `BUTTON_PROPERTIES.email.updateState` in `ob-toolbar.js`.

Both buttons are disabled when any of these is true:
- No record is selected. An empty grid falls under this case.
- The form shows a new record.
- A selected grid row is not saved yet.
- A document is being processed.

Print is also disabled when more than one record is selected in the Business Partner tab (`220`). Its print process is a statistics sheet of a single partner (classic Issue 0023270).

### Printing

`printConfig.legacy` decides the path:

- **`legacy: false`** applies to PrintController documents, whose print URL is `.../print.html`. The PDF of the selected records is downloaded from `/sws/com.etendoerp.etendorx.print`. This path is unchanged.
- **`legacy: true`** applies to any other print process (`RptC_Bpartner`, `RptC_Remittance`, `JR_ReportTaxPayment`, …). The classic `businessUtility/PrinterReports.html` page opens in its own browser window through the `/meta/legacy` forward, with the same parameters `OB.ToolbarUtils.print` sends:
  - `inppdfpath`
  - `inphiddenkey`
  - `inphiddenvalue` (selected ids)
  - `inpdirectprint`
  - `inpButtonType=printButton`
  - `inpTabId`
  - `inpwindowId`

  `PrinterReports` stores the ids in session and loads the print process, which is served directly by Classic. If the browser blocks the window, a toast offers to open it again.

The Email button keeps its existing flow: the email modal and `/meta/email/*`.

## Decisions

- **The backend computes the flags.** It reuses `OBViewTab.getPrintUrl(tab)`, so the URL, and with it the Email rule, is exactly the classic one. The previous client rule ("process name contains `Print`", case-sensitive) hid Print in Business Partner, Remittance and Tax Payment, and would hide it almost everywhere with translated names.
- **Hybrid printing.** The document print service only generates PDFs for PrintController documents and Jasper template processes. It fails for HTML report pages such as the Business Partner sheet or the Tax Payment filter. Delegating only those processes to Classic gives them classic behavior without changing the PDF download that already works for orders, invoices, shipments and payments.
- **Same window for the print process.** Outside the classic MDI layout, `PrinterReports` opens the process in a second window on load, which browsers block because there is no user gesture, and then closes itself. The metadata module injects a shim into that page only (`LegacyProcessServlet.PRINTER_REPORTS_SHIM_SCRIPT`) so the process loads in the same window.

## Differences with the classic UI

- PrintController documents (orders, invoices, shipments, payments) download the PDF directly instead of opening the classic print options page (template, archive).
- The classic print page opens in a separate browser window instead of a classic popup inside the application.

## Configuration

No new configuration is needed. Visibility follows `AD_Tab.AD_Process_ID` and the default model-object mapping of that process. The toolbar buttons themselves are the existing `ETMETA_TOOLBAR_BUTTON` records "Print Record" and "Send Email". Keyboard shortcuts `ToolBar_Print` and `ToolBar_Email` are documented in [keyboard shortcuts](../keyboard-shortcuts/README.md). For the classic page forward, see [manual processes](../../process/legacy/manual-processes.md).

## Main files

| Layer | File |
|-------|------|
| Backend | `com.etendoerp.metadata/src/com/etendoerp/metadata/builders/TabPrintConfig.java` — builds `printConfig` |
| Backend | `com.etendoerp.metadata/src/com/etendoerp/metadata/builders/TabBuilder.java` — emits `printConfig` per tab |
| Backend | `com.etendoerp.metadata/src/com/etendoerp/metadata/http/LegacyProcessServlet.java` — `PrinterReports` shim |
| Types | `packages/api-client/src/api/types.ts` — `TabPrintConfig`, `Tab.printConfig` |
| Client | `packages/MainUI/utils/toolbar/utils.tsx` — visibility and enable rules |
| Client | `packages/MainUI/utils/toolbar/print.ts` — enable rules, classic print URL and popup |
| Client | `packages/MainUI/hooks/Toolbar/useLegacyPrint.ts` — classic print action |
| Client | `packages/MainUI/components/window/Tab.tsx` — `handlePrintRecord` chooses the print path |
