# Pick and Execute — Manual Testing Matrix

## Context

The branch `feature/ETP-3751` (epic `epic/ETP-3931`) delivers full WorkspaceUI support for
**Pick and Execute** (P&E) windows, including the naming subset known as **Pick and Edit**
(same model, different label).

This document is the **single source of truth** for QA and development to verify each
individual P&E window. The implementation behind these windows is documented in
[`README.md`](./README.md); this file is purely the test catalogue.

> **Naming clarification (taken from the user description):**
>
> 1. There is no model-level difference between *Pick and Execute* and *Pick and Edit*.
>    Both are obuiapp_process rows with `uipattern = 'OBUIAPP_PickAndExecute'` whose
>    grid window has `windowtype = 'OBUIAPP_PickAndExecute'`. The subset called
>    "Pick and Edit" is identified purely by the **process name** containing the
>    literal substring `Pick and Edit`.
> 2. There are also `ad_process` rows with `uipattern = 'Pick and Execute'`
>    ("Report and Process" subtype) — **the current environment ships zero real
>    examples of this kind, so they are out of scope.**
> 3. Almost every P&E grid is reached **through a parent Defined Process** that
>    declares a `WindowReference` parameter pointing at the grid window. A small
>    handful (currently 3 grids) are reachable **directly from the main menu**.

## Data source

All entries were extracted from the live `etendodev` database (PostgreSQL on
`localhost:5432`, schema `public`), tables:

- `obuiapp_process` (parent processes with `uipattern = 'OBUIAPP_PickAndExecute'`)
- `obuiapp_parameter` (rows with `ad_reference_id = 'FF80818132D8F0F30132D9BC395D0038'`
  — the *Window Reference* reference, the actual link to a P&E grid)
- `obuiapp_ref_window` (resolves the parameter's reference value to an `ad_window`)
- `ad_window` (windows with `windowtype = 'OBUIAPP_PickAndExecute'`)
- `ad_tab` (root tab of each window — flags `em_obuiapp_can_add`, `em_obuiapp_show_select`)
- `ad_menu` (entries with `em_obuiapp_process_id` pointing at the parent process)
- `ad_field` + `ad_column` (`em_obuiapp_process_id`) — locates the button that triggers
  each parent process from its source window.

## Totals

| Subtype | Mappings | Distinct windows | Notes |
|---|---|---|---|
| Menu-accessible (P&E grid loaded from menu) | 3 | 3 | Direct entry — no record context |
| `PickExecute` (process name does NOT contain "Pick and Edit") | 47 | 46 | Triggered from a button inside a parent window |
| `PickEdit` (process name DOES contain "Pick and Edit") | 14 | 11 | Same mechanics, separate section to track naming |
| **TOTAL distinct (parent, parameter) pairs** | **64** | **61** | A few windows are reused by two parents (e.g. `Reservation Pick and Edit`, `Modify Payment Plan`) |

Three menu-accessible P&E grids — Log Management, Not Posted Documents, Etendo Payment
Execution — are *also* listed in their parent-process row inside the data tables, so
they appear once in Section 1 and (deliberately) once again in Section 2.

## Column legend

| Column | Meaning |
|---|---|
| **Window ID** | `ad_window.ad_window_id` — pass this to `/meta/window/{id}` to get the grid metadata. |
| **Window Name** | `ad_window.name`. The label the user sees in the grid title/breadcrumb. |
| **Parent Process** | `obuiapp_process.value` (search value) and `name`. The process whose handler runs when the user presses *Done*. |
| **Parameter Name** | `obuiapp_parameter.name`. When a parent has multiple grids (Add Payment has four), this disambiguates which grid is being tested. |
| **Parent Window** | The ERP window in which the button that opens the P&E modal is displayed. Multiple parent windows are separated by `/`. `Menu` means the grid is reached directly from the main menu (no parent record context). Use this column as the entry point when navigating the UI to manually test each process. |
| **Triggered From** | `Window › Tab › Field` of the button that opens the modal. `MENU` means the grid is reachable directly from the main menu without any record context. Multiple triggers are listed separated by `||`. |
| **Multi** | `obuiapp_process.ismultirecord`. `Y` = multi-record process (executes once with the full selection), `N` = single-record (one record per Done). Drives the modal's `allowMultipleRecords` predicate. |
| **+** | `ad_tab.em_obuiapp_can_add` (`Y` enables the *Create row* "+" button — local-only rows). |
| **Sel** | `ad_tab.em_obuiapp_show_select`. `Y` shows checkbox column for explicit selection. `N` is the "always-list" pattern: every row is implicitly selected, no checkbox, often paired with `+` so the user only adds/edits/removes. |
| **Classname** | The Java action handler that consumes the structured payload from *Done*. Useful for log correlation and backend debugging. |
| **Notes** | What's particular about this grid (editable columns, payscripts, dimension defaults, post-create read-only fields…). Empty when nothing unusual. |

---

## Section 1 — P&E grids reachable from the main menu

Open from the **main menu** (left nav). No prior record selection — the modal opens
empty, the grid loads its full dataset, and *Done* fires the handler against the
selected rows.

| # | Menu Tree Path | Window ID | Window Name | Parent Process (value) | Parent Process (name) | Parameter | Multi | + | Sel | Classname | Notes |
|---|----------------|-----------|-------------|------------------------|-----------------------|-----------|:-----:|:-:|:---:|-----------|-------|
| 1 | General Setup › Application › **Log Management** | `DCA855BFACF94A8CAB1F66E825D9076B` | **Log Management** | `LogManagement` | Log Management | Loggers | Y | N | Y | `org.openbravo.client.application.logmanagement.LogManagementActionHandler` | Lists every active logger with its current level. Multi-record. Test changing levels in batch + verify log-output reflects the change at runtime. |
| 2 | Financial Management › Accounting › Transactions › **Not Posted Documents** | `35A7B3ED3AD441F5897AE1174AD49DD1` | **NotPostedDocument** | `NotPostedDocuments` | Not Posted Documents | Not Posted Documents | N | N | Y | `com.etendoerp.bulk.posting.actionHandler.NotPostedDocuments` | Cross-organization view of unposted documents (invoices/orders/etc.). Verify org/role filtering and the *Post* action chains correctly. |
| 3 | Financial Management › Receivables and Payables › Transactions › **Payment Execution** | `7E46E38381D04706AC72429B9E615056` | **Etendo Payment Pick** | `Etendo Payment Execution` | Etendo Payment Execution | Payment Pick | N | N | Y | `com.etendoerp.advpaymentmngt.actionHandler.PaymentExecutionActionHandler` | Lists payments ready for execution (`Status = 'RPAE'`). Verify the grid honors the user's accessible financial accounts. |

### How to manually verify Section 1 is exhaustive (no SQL)

The list of three menu entries above must remain stable as the data model evolves.
Use the following procedure — entirely through the Application Dictionary UI — to
confirm the count and identify any new entries that may appear in future releases.

**Why a multi-step walk is required.** None of the surface fields on the `Menu`
record are sufficient on their own to identify a Pick-and-Execute grid entry:

- The `Windows` field on the menu record is dead data: it only renders editable
  when `Action = Window`. The `Log Management` entry has it filled from a
  historical configuration; the other two menu entries have it `NULL`. Filtering
  by it produces a **false negative**.
- The `Action` field discriminates the dispatcher (`Window` / `Form` /
  `Process Definition` / `URL`), not the content of the process. Multiple
  Action types can end up opening a P&E window.
- The `UI Pattern` field of the Process Definition does **not** determine whether
  the modal shows a P&E grid. In the current environment, 13 Process Definitions
  with `UI Pattern = Action` have a `Window Reference` parameter that loads a P&E
  window (e.g. `Create Invoices From Orders`, `Manage Variants`, `Offer Add Product`,
  `Adjust Quotation`). Only the second-level chain identifies the grid.

The authoritative signal lives **two levels below the Menu record**, in the
`Window Type` of the AD_Window referenced by one of the Process Definition's
`Window Reference` parameters. The full walk is:

```
Menu record
  └─ (Action = Process Definition)
     └─ Process Definition field
        └─ open Process Definition
           └─ sub-tab "Parameter"
              └─ for each parameter where Reference = "Window Reference":
                 └─ Reference Search Key field
                    └─ open the sub-reference
                       └─ sub-tab "Window Reference"
                          └─ Window field
                             └─ open the AD_Window
                                └─ Window Type must equal "Pick and Execute"
```

**Step-by-step procedure**

1. Open **General Setup › Application › Application Dictionary › Menu**.
2. In the Menu grid, filter the column **Action** to **Process Definition**.
   This eliminates `Window`, `Form`, `URL`, and `Report` dispatcher rows that
   cannot open a P&E grid.
3. For each remaining row, take note of the **Process Definition** field
   (it contains the `obuiapp_process_id` of the target process). Open that
   Process Definition record (single-click navigates if the field is rendered
   as a link, otherwise copy the ID and open it manually via
   **General Setup › Application › Process Definition**).
4. On the Process Definition window, switch to the sub-tab **Parameter**.
5. Inspect every row in the Parameter grid. If **none** of the parameters has
   `Reference = "Window Reference"`, the Process Definition is a handler-only
   action (no grid) — discard it. If **at least one** parameter has
   `Reference = "Window Reference"`, continue to step 6 for that parameter.
6. On the parameter row, open the **Reference Search Key** field — it points to
   a sub-reference of type `Window Reference`. Open that sub-reference.
7. On the sub-reference, open the sub-tab **Window Reference** and read the
   **Window** field. Open that AD_Window record.
8. On the AD_Window, verify the field **Window Type** equals **"Pick and
   Execute"**. If it does, the original Menu entry from step 1 is confirmed as
   a menu-accessible P&E grid and belongs in Section 1. If `Window Type` is
   anything else (`Standard`, `Single Record`, etc.) the parameter is using a
   classic selector and the Menu entry does NOT belong in Section 1.

**Expected result in the current environment.** Walking the procedure end to end
must yield exactly three Menu records that pass step 8: *Log Management*,
*Not Posted Documents*, and *Payment Execution*. Any other count indicates
either a new P&E grid was added (legitimate addition to Section 1) or a
configuration drift (parameter pointing to a wrong window type — file as a
defect).

**Disregarded shortcuts and why they fail**

| Shortcut tried | Why it produces the wrong answer |
|---|---|
| Filter Menu by `Windows ≠ NULL` | Catches only `Log Management` because of legacy data on that single row; the other two have `Windows = NULL`. |
| Filter Menu by `Action = Window` | Returns zero P&E menu entries — all three use `Action = Process Definition`. |
| Filter Process Definition by `UI Pattern = "Standard (Parameters defined in Dictionary)"` | Misses 13 P&E grids whose parent Process Definition has `UI Pattern = "Action"`. |
| Inspect only the first parameter of each Process Definition | Misses multi-grid processes (e.g. *Add Payment* has 4 grids, *Add Invoices* has 2). |

The walk above is the only path that uses fields that the runtime actually
consults at dispatch time.

---

## Section 2 — Pick and Execute (process name does NOT contain "Pick and Edit")

Reached by clicking a **button** in another window (Sales Invoice, Goods Receipt, etc.).
The opening record is the parent ERP entity (an invoice, an order, a financial
account…), which is what gives the P&E grid its filter context.

| # | Window ID | Window Name | Parent Process (value) | Parent Process (name) | Parameter | Multi | + | Sel | Parent Window | Triggered From | Classname | Notes |
|---|-----------|-------------|------------------------|-----------------------|-----------|:-----:|:-:|:---:|---------------|----------------|-----------|-------|
| 1 | `4F17014B2315479387029F24A031CB82` | Credit In | `OBFBPS_AddCreditPayments` | Add Credit Payments | Credit In | N | N | Y | Business Partner Settlement | Business Partner Settlement › Header › Add Credit Payments | `org.openbravo.financial.bpsettlement.process.AddCreditPaymentsActionHandler` | One of two grids in this modal (the other is *Credit Out*). Test toggling between them via parameter selector. |
| 2 | `D49B24EBDCF74FC4977310DD1E0D2552` | Credit Out | `OBFBPS_AddCreditPayments` | Add Credit Payments | Credit Out | N | N | Y | Business Partner Settlement | Business Partner Settlement › Header › Add Credit Payments | (same as above) | Pair with row 1. |
| 3 | `C50EAE310F9849419F99A774628A3280` | Purchase Invoice | `OBFBPS_AddInvoices` | Add Invoices | Purchase Invoice | N | N | Y | Business Partner Settlement | Business Partner Settlement › Header › Add Not Paid Invoices | `org.openbravo.financial.bpsettlement.process.AddInvoicesActionHandler` | Two-grid modal (purchase + sales). Verify the parameter switch keeps both grids' state. |
| 4 | `A2902D950C9942888E8775E5060286B8` | Sales Invoice | `OBFBPS_AddInvoices` | Add Invoices | Sales Invoice | N | N | Y | Business Partner Settlement | Business Partner Settlement › Header › Add Not Paid Invoices | (same as above) | Pair with row 3. |
| 5 | `A73B5E3D037A49CC8ACCE8B844FF7D14` | Add Multiple Payments P&E | `Add Multiple Payments` | Add Multiple Payments | Payment | N | N | Y | Financial Account | Financial Account › Account › Add Multiple Payments | `org.openbravo.advpaymentmngt.actionHandler.AddMultiplePaymentsHandler` | Mandatory selection (`mandatory = Y`). *Done* must reject empty selection. |
| 6 | `6358D6DEB2104161B9769D107FEA54DF` | **Order/Invoice (Add Payment)** | `AddPayment` | Add Payment | Order/Invoice | Y | N | Y | Sales Invoice / Sales Order / Purchase Invoice / Purchase Order / Payment In / Payment Out | Sales Invoice/Sales Order/Purchase Invoice/Purchase Order/Payment In/Payment Out › Header › Add Payment | `org.openbravo.advpaymentmngt.actionHandler.AddPaymentActionHandler` | One of FOUR grids in the Add Payment modal. Editable column **Amount** with payscript validation (mutual exclusion against the GL Item grid). |
| 7 | `15F44BBCA40148458AAA6A2DB4FEF334` | Invoice P&E Settlement | `AddPayment` | Add Payment | Invoices for compensation | Y | N | Y | Sales Invoice / Sales Order / Purchase Invoice / Purchase Order / Payment In / Payment Out | (same as row 6) | (same) | Compensation grid. Visible only when the order/invoice has a settlement context. |
| 8 | `17BE11F1C49547048F9D29E6C95BB67E` | **APRM GL Item** | `AddPayment` | Add Payment | GL Item | Y | **Y** | **N** | Sales Invoice / Sales Order / Purchase Invoice / Purchase Order / Payment In / Payment Out | (same as row 6) | (same) | Local-only grid — no checkbox column, "+" enabled. User adds rows with GL Item + Amount. Mutually exclusive with the Order/Invoice grid via the `glitem` field-interaction declared in `AddPaymentRulesClean.js`. |
| 9 | `81BAC97FE7754C669254C9CF4FA20292` | Credit To Use | `AddPayment` | Add Payment | Credit To Use | Y | N | Y | Sales Invoice / Sales Order / Purchase Invoice / Purchase Order / Payment In / Payment Out | (same as row 6) | (same) | Fourth grid. Lists outstanding customer credit. Validate that the BP's available credit is the only thing shown. |
| 10 | `A4BC3EDFD2424618840A981321C9EC1B` | Add Products | `AddProductsToChValue` | Add Products | Add products window | N | N | Y | Product Characteristic | Product Characteristic › Value › Add Products | `org.openbravo.materialmgmt.actionhandler.AddProductsToChValue` | Adds products to a characteristic value. |
| 11 | `290C3109187B47D6907B1C39604095F1` | Quotation Lines P&E | `EQUOT_AdjustQuotation` | Adjust Quotation | Lines | N | N | Y | Sales Quotation | Sales Quotation › Header › Adjust | `com.etendoerp.quotation.process.Adjustment` | Pick lines from a quotation and apply adjustments. |
| 12 | `B54E3CE0A4E546DAB266E347C18E975E` | Advanced Box Referenced Inventory P&E | `ReferencedInventoryBoxHandler` | Box | Stock | N | N | Y | Referenced Inventory | Referenced Inventory › Referenced Inventory › Box | `org.openbravo.common.actionhandler.ReferencedInventoryBoxHandler` | Mandatory selection. Boxes stock into a referenced inventory. |
| 13 | `DEC8FF77173645D4979A70A6BDF059D3` | Cash VAT pending to be settled P&E | `Cash VAT Manual Settlement P&E` | Cash VAT Manual Settlement P&E | Cash VAT amounts pending to be settled | N | N | Y | Manual Cash VAT Settlement | Manual Cash VAT Settlement › Header › Pick Lines & Complete | `org.openbravo.module.cashvat.handler.CashVATManualSettlementHandler` | Mandatory selection. Test the Reactivate counterpart (`Reaactivate Cash VAT Manual Settlement`). |
| 14 | `A839712F8D5E4929BB2D057BAA55A2A3` | Copy from Orders P&E | `CopyFromOrders` | Copy from Orders | Pick/Edit Lines | N | N | Y | Sales Order / Purchase Order / Sales Quotation / Lead / Return from Customer / Return to Vendor | Sales Order/Purchase Order/Sales Quotation/Lead › Header › Copy from Orders <br/> Return from Customer/Return to Vendor › Header › Copy from Order | `org.openbravo.common.actionhandler.CopyFromOrdersActionHandler` | Six trigger windows — test from every one to verify the implicit filter (BP, doc type) is set correctly per source window. |
| 15 | `887A554CDD0D4DAA90324FCD34320930` | Services Modify Tax | `Copy Modify Tax Configuration` | Copy Service Modify Tax Configuration | Services Modify Tax | N | N | Y | Product | Product › Product › Copy Service Modify Tax Configuration | `org.openbravo.common.actionhandler.ServicesModifyTaxCopyConfiguration` | Mandatory. Service-product tax replication. |
| 16 | `08F1EBD83E814D66B8AAC006919EC688` | Manage Entity Mappings Pick and Execute | `CreateEntityMappings` | Create Entity Mappings | Pick/Edit Lines | N | N | Y | Projections and Mappings | Projections and Mappings › Projected Entities › Create Projection Fields | `com.etendoerp.etendorx.actionhandler.ManageEntityMappings` | Etendo RX integration. |
| 17 | `662326D726DE45508FA18D69AB3DA35D` | Create Invoices From Orders | `DJOBS_CreateInvoicesFromOrders` | Create Invoices from Orders | Orders | Y | N | Y | Menu | (Menu: *Create Invoices From Orders*) | `com.smf.jobs.defaults.invoices.CreateFromOrder` | Reached from a menu entry whose `obuiapp_process.uipattern = 'A'` (Action), so it is **not** in Section 1, but the grid behavior is identical. |
| 18 | `D0E067F649AC457D9EA2CDAC2E8571D7` | Create Invoice Lines From Order Lines | `Create Invoice Lines From Order Lines` | Create Lines From Order | Pick/Edit Lines | N | N | Y | Sales Invoice / Purchase Invoice | Sales Invoice/Purchase Invoice › Header › Create Lines From Order | `org.openbravo.common.actionhandler.createlinesfromprocess.CreateInvoiceLinesFromOrderLines` | Most common create-lines flow. |
| 19 | `8B9CF762EE354984931CC76DBA410A38` | Create Lines From Order | `ETAWIM_CreateLinesFromOrder` | Create Lines From Order | Pick/Edit Lines | N | N | Y | Inbound Receipt | Inbound Receipt › Inbound Receipts › Create Lines From Order | `com.etendoerp.advanced.warehouse.management.actionhandler.CreateLinesFromOrder` | Advanced warehouse management variant. |
| 20 | `E4524BA1D1354AAD8B31C290672D8417` | Create Invoice Lines From Shipment/Receipt lines | `Create Invoice Lines From InOut Lines` | Create Lines From Shipment/Receipt | Pick/Edit Lines | N | N | Y | Sales Invoice / Purchase Invoice | Sales Invoice/Purchase Invoice › Header › Create Lines From Shipment/Receipt | `org.openbravo.common.actionhandler.createlinesfromprocess.CreateInvoiceLinesFromInOutLines` | Verify both directions (shipment and receipt). |
| 21 | `F9DCC907B7B3450DBC930D77853296DA` | Quotation Lines View | `equot_multiorder_from_quotation` | Create Order From Quotation | Lines | N | N | Y | Sales Quotation / Sales Order / Purchase Order / Lead | Sales Quotation/Sales Order/Purchase Order/Lead › Header › Create Order | `com.etendoerp.quotation.process.ConvertQuotationIntoMultiOrder` | Multi-order generation from a quotation. |
| 22 | `F7253C7B9B8F47518C29248F899C72CE` | Create Purchase Order Lines | `POrderCreateLines` | Create Purchase Order Lines | Pick/Edit Lines | N | N | Y | Purchase Order | Purchase Order › Header › Create Lines | `org.openbravo.common.actionhandler.OrderCreatePOLines` | Mandatory selection. |
| 23 | `2DD49FF2E6624217BE6CF53405E60671` | Edit Picking List Pick Execute | `EditPickingListItem` | Edit Picking List Item | Pick/Edit Lines | N | N | Y | Warehouse Picking List | Warehouse Picking List › Movement Line › Edit Item | `org.openbravo.warehouse.pickinglist.EditPickingListItemHandler` | Note the *Pick Execute* in the window name vs *Pick and Edit* in the process name. |
| 24 | `7E46E38381D04706AC72429B9E615056` | Etendo Payment Pick | `Etendo Payment Execution` | Etendo Payment Execution | Payment Pick | N | N | Y | Menu | **MENU** + (no field button) | `com.etendoerp.advpaymentmngt.actionHandler.PaymentExecutionActionHandler` | Also listed in Section 1 row 3. |
| 25 | `5BF18A01DB3F4DBBBE1B8A4A6134ACD1` | Find Transactions to Match | `FindTransactionsToMatch` | Find Transactions to Match | Find Transactions to Match P&E | N | N | Y | Financial Account | Financial Account › Account › `EM_Aprm_Findtransactionspd` | `org.openbravo.advpaymentmngt.actionHandler.FindTransactionsToMatchActionHandler` | Mandatory selection. APRM matching flow. |
| 26 | `D8821E7D70B04033B048E16021CCC851` | Pick Partners | `ETRA_InsertPartnersInRappel` | Insert Business Partner In Rappel Configuration | Pick Partners | N | N | Y | Rappel Configurations | Rappel Configurations › Rappels › Add Partners | `com.etendoerp.rappels.advanced.ad_process.InsertPartnersInRappel` | Rappels module — bulk add BPs. |
| 27 | `60173F48A4A340218431E3172826E387` | Pick Product Categories | `ETRA_InsertProductCatsInRappel` | Insert Product Category In Rappel Configuration | Pick Product Categories | N | N | Y | Rappel Configurations | Rappel Configurations › Rappels › Add Product Categories | `com.etendoerp.rappels.advanced.ad_process.InsertProductCatsInRappel` | Rappels module — categories. |
| 28 | `F5A40773D9EA4D8AA1761402881F05B0` | Pick Products | `ETRA_InsertProductsInRappel` | Insert Product In Rappel Configuration | Pick Products | N | N | Y | Rappel Configurations | Rappel Configurations › Rappels › Add Products | `com.etendoerp.rappels.advanced.ad_process.InsertProductsInRappel` | Rappels module — products. |
| 29 | `FA6EAC526981450A84E0C1043C3487C8` | System Info P&E | `InstanceManagementAction` | InstanceManagementAction | System Info | Y | N | Y | Menu | (Menu: *Instance Activation*) | `org.openbravo.erpCommon.instancemanagement.InstanceManagementAction` | Multi-record. Sister process to Section 1 — reached from a menu entry whose `uipattern = 'A'`. |
| 30 | `1BABEC23FDC043DDADB8AE5D648CFD88` | LCCosts to Match from Invoice Line | `LCMatchFromInvoice` | LC Cost Match from Invoice | LC Costs | N | N | Y | Purchase Invoice | Purchase Invoice › Lines › Match LC Costs | `org.openbravo.costing.LCCostMatchFromInvoiceHandler` | Landed Cost matching. |
| 31 | `DCA855BFACF94A8CAB1F66E825D9076B` | Log Management | `LogManagement` | Log Management | Loggers | Y | N | Y | Menu | **MENU** | `org.openbravo.client.application.logmanagement.LogManagementActionHandler` | Also listed in Section 1 row 1. |
| 32 | `F00A1A57E3894121A8FC1957497423F7` | Manage Variants Pick and Execute | `ManageVariants` | Manage Variants | Pick/Edit Lines | N | N | Y | Product | Product › Product › Manage Variants | `org.openbravo.materialmgmt.actionhandler.ManageVariants` | Product variant manager — note process name says "Manage Variants" (not Edit) but the window includes *Pick and Execute*. |
| 33 | `E34AE40786684EBB81E9F8A55BE33DCE` | Match Statement P&E | `Match Statement` | Match Statement | Match Statement | N | N | Y | Financial Account | Financial Account › Account › Match Statement <br/> Financial Account › Account › Match Transactions Force | `org.openbravo.advpaymentmngt.actionHandler.MatchStatementActionHandler` | Two trigger fields (regular vs Force). Verify both paths. |
| 34 | `C57DED2495184380AFBAAA3CA720C3DA` | Modify Payment In Plan | `APR_ModifyPaymentPlan` | Modify Payment In Plan | Modify Payment Plan | N | **Y** | **N** | Sales Invoice | Sales Invoice › Payment Plan/Payment Plan (old) › Modify Payment Plan | `org.openbravo.advpaymentmngt.actionHandler.ModifyPaymentPlanActionHandler` | Local-only grid + checkbox hidden. Editable plan rows. |
| 35 | `56A33CA0C8124B8B9E1353382F073DE6` | Modify Payment Plan (ETABAM In) | `ETABAM_ModifyPaymentInPlan` | Modify Payment In Plan | Pick/Edit Lines | N | **Y** | **N** | Sales Invoice | Sales Invoice › Payment Plan › Modify Payment Plan | `com.etendoerp.advanced.bank.account.management.actionHandler.ModifyPaymentPlanActionHandler` | Shared window with row 37 — same `ad_window_id` reused by the ETABAM Out parent. |
| 36 | `EDBED920F400435DA5E7CB625301DCBE` | Modify Payment Out Plan | `Modify Payment Out Plan` | Modify Payment Out Plan | Modify Payment Plan | N | **Y** | **N** | Purchase Invoice | Purchase Invoice › Payment Plan/Payment Plan (old) › Modify Payment Plan | `org.openbravo.advpaymentmngt.actionHandler.ModifyPaymentPlanActionHandler` | OUT variant of row 34. |
| 37 | `56A33CA0C8124B8B9E1353382F073DE6` | Modify Payment Plan (ETABAM Out) | `ETABAM_ModifyPaymentOutPlan` | Modify Payment Out Plan | Pick/Edit Lines | N | **Y** | **N** | Purchase Invoice | Purchase Invoice › Payment Plan › Modify Payment Plan | (same as row 35) | Same window as row 35 — confirms window reuse across parents. |
| 38 | `35A7B3ED3AD441F5897AE1174AD49DD1` | NotPostedDocument | `NotPostedDocuments` | Not Posted Documents | Not Posted Documents | N | N | Y | Menu | **MENU** | `com.etendoerp.bulk.posting.actionHandler.NotPostedDocuments` | Also listed in Section 1 row 2. |
| 39 | `716C2AFF1F3B4F10BD6CF86D0226298D` | Offer Organization Selector | `OfferAddOrg` | Offer Add Org | Add Organizations | Y | N | Y | Discounts and Promotions | Discounts and Promotions › Discounts and Promotions › Add Organizations | `com.smf.jobs.defaults.offerPick.OfferAddOrg` | Mandatory. Multi-record. |
| 40 | `2A769D19EDBD4CAAADB529DBF25B0838` | Offer Product Category Selector | `OfferAddProductCategory` | Offer Add Product Category | Add Product Categories | Y | N | Y | Discounts and Promotions | Discounts and Promotions › Discounts and Promotions › Add Product Categories | `com.smf.jobs.defaults.offerPick.OfferAddProductCategory` | Mandatory. Multi-record. |
| 41 | `6A543E875D8A4A23920B00CE3113739F` | Offer Product Selector | `OfferAddProduct` | Offer Add Product | Add Products | Y | N | Y | Discounts and Promotions | Discounts and Promotions › Discounts and Promotions › Add Products | `com.smf.jobs.defaults.offerPick.OfferAddProduct` | Mandatory. Multi-record. |
| 42 | `559FFB30EDC7497AB5C82A68950F35AF` | PickEditGoodsShipment | `OBWPACK_PickGS` | Pick Goods Shipments | Pick/Edit Lines | N | N | Y | Packing | Packing › Packing › Pick Shipments | `org.openbravo.warehouse.packing.PickEditGSActionHandler` | Note window name vs process name mismatch. |
| 43 | `B37CF8CFDC9B49CD91E81A05FB25429F` | Picking Select Sales Order | `OBWPL_SelectSOrders` | Picking Select Sales Orders | Pick/Edit Lines | N | N | Y | Warehouse Picking List | Warehouse Picking List › Header › Sales Orders | `org.openbravo.warehouse.pickinglist.SelectOrdersHandler` | |
| 44 | `C481C8B80A1F4C18ABD7C1903649BD2D` | Product Category Tax | `Relate Product Category and new tax to a` | Relate Product Category and new tax to a Service Product | Relate Product Category New Tax | N | N | Y | Product | Product › Product › Modify Tax for Product Category | `org.openbravo.common.actionhandler.RelateProductCatTaxToServiceProduct` | Mandatory. Note the truncated 40-char `value` field. |
| 45 | `D622DE7A8CB84A59880505589719B38A` | Services Related Product Categories | `Relate Product Cat to a Service Product` | Relate Product Cat to a Service Product | Services Related Product Cat | N | N | Y | Product | Product › Product › Relate Prod Categories | `org.openbravo.common.actionhandler.RelateProductCatToServiceProduct` | Mandatory. |
| 46 | `9E9D6221FAF348C3A9B7DA5FCF17F3E0` | Services Related Products | `Relate Products to a Service Product` | Relate Products to a Service Product | Services Related Products | N | N | Y | Product | Product › Product › Relate Products | `org.openbravo.common.actionhandler.RelateProductsToServiceProduct` | Mandatory. |
| 47 | `91E1B67DDDFC4970AE4EF8AD632D2DAD` | Payment Invoice View | `RemovePaymentFromInvoice` | Remove Payments from Invoice | Payments | Y | N | Y | Sales Invoice / Purchase Invoice | Sales Invoice/Purchase Invoice › Header › Remove Payment | `com.etendoerp.payment.removal.handler.RemovePaymentFromInvoice` | Multi-record. Verify the inverse "remove" wipes only the selected payments. |
| 48 | `EB35B1E707A1420FA467C02643C973BD` | Payment Order View | `RemovePaymentFromOrder` | Remove Payments from Order | Payments | Y | N | Y | Sales Order / Purchase Order | Sales Order/Purchase Order › Header › Remove Payment | `com.etendoerp.payment.removal.handler.RemovePaymentFromOrder` | Multi-record. |
| 49 | `0BC917670A8D4D4689FF38BDCBE2B325` | Remittance Pending Payments View | `REM_SelectInvoicesAndOrders` | Select Invoices and Orders | Pending Payments | N | N | Y | Remittance | Remittance › Remittance › Select Invoices and Orders | `org.openbravo.module.remittance.ad_actionbutton.REMSelectInvoicesAndOrders` | Remittance module. |
| 50 | `396E76B84F574F8F850D1F4606AD06E3` | Unbox Referenced Inventory P&E | `ReferencedInventoryUnBoxHandler` | UnBox | Stock | N | N | Y | Referenced Inventory | Referenced Inventory › Referenced Inventory › Unbox | `org.openbravo.common.actionhandler.ReferencedInventoryUnBoxHandler` | Mandatory. Inverse of row 12 (Box). |
| 51 | `120499D7491844CFB322AFDAAC10B7F4` | Accounts with VAT Regularization | `ETVATR_VATRegularization` | VAT Regularization | Accounts | Y | N | **N** | Menu | (no field button — opens from `ETVATR_VATRegularization` parent) | `com.etendoerp.vat.regularization.process.VATRegularization` | Multi-record, **no checkbox column** (always-list pattern). |

---

## Section 3 — Pick and Edit (process name contains "Pick and Edit")

Behaviorally identical to Section 2. Listed separately to track naming consistency
and to validate that the UI renders the same component regardless of label.

| # | Window ID | Window Name | Parent Process (value) | Parent Process (name) | Parameter | Multi | + | Sel | Parent Window | Triggered From | Classname | Notes |
|---|-----------|-------------|------------------------|-----------------------|-----------|:-----:|:-:|:---:|---------------|----------------|-----------|-------|
| 1 | `D636C2D5C8B94735A2C532267C4E68B0` | Doubtful Debts Pick and Edit | `Doubtful Debt Pick and Edit` | Doubtful Debt Pick and Edit | Pick/Edit Lines | N | N | Y | Doubtful Debt Run | Doubtful Debt Run › Doubtful Debt Run › Select Doubtful Debt | `org.openbravo.advpaymentmngt.actionHandler.DoubtFulDebtPickEditLines` | |
| 2 | `6AA84F4BDAA44477808F0E7A86AB4961` | Prereservation Pick and Edit | `ManagePrereservation` | Manage Prereservation Pick and Edit | Pick/Edit Lines | N | N | Y | Goods Receipt / Goods Shipment / Packing / Purchase Order / Sales Order / Sales Order for Picking | Goods Receipt/Goods Shipment/Packing/Purchase Order/Sales Order/Sales Order for Picking › Lines › Manage Prereservation | `org.openbravo.common.actionhandler.ManagePrereservationActionHandler` | Six trigger windows. |
| 3 | `442FA34D72E5423B8DDBD65DBF0ED4B6` | Reservation Pick and Edit (Manage) | `ManageReservation` | Manage Reservation Pick and Edit | Manage Stock | N | N | Y | Purchase Order / Sales Order / Stock Reservation | Purchase Order/Sales Order › Lines › Manage Reservation <br/> Stock Reservation › Reservation › Manage Stock | `org.openbravo.common.actionhandler.ManageReservationActionHandler` | Shared window with row 4 (Manage Stock Reservation Pick and Edit). |
| 4 | `442FA34D72E5423B8DDBD65DBF0ED4B6` | Reservation Pick and Edit (Stock) | `ManageStockReservation` | Manage Stock Reservation Pick and Edit | Pick/Edit Lines | N | N | Y | Stock Reservation | (no trigger field — same window as row 3, different parent) | (same as row 3) | Same `ad_window_id` reused. Test both parents fire the right classname despite sharing the window. |
| 5 | `C5D0C6D541254921B9848A9A1362EE68` | Payment Proposal Pick and Edit Lines | `APRM_PaymentProposalPickEdit` | Payment Proposal Pick and Edit Lines | Select Expected Payments | N | N | Y | Payment Proposal | Payment Proposal › Header › Select Expected Payments | `org.openbravo.advpaymentmngt.actionHandler.PaymentProposalPickEditLines` | |
| 6 | `5336ACB5F0CF46F3AB3D147C273AF01F` | PickingList Pick and Edit | `OBWPL_PickEdit` | PickingList Pick And Edit | Pick/Edit Lines | N | N | Y | Goods Shipment / Warehouse Picking List | Goods Shipment/Warehouse Picking List › Lines › Edit Lines | `org.openbravo.warehouse.pickinglist.actionhandler.EditActionHandler` | |
| 7 | `B8863C537CBE4F31A75A98CBF8EC842E` | Reserved Goods Movement | `ReservedGoodMovement` | Reserved Good Movement Pick and Edit | Pick/Edit Lines | N | N | Y | Stock Reservation | Stock Reservation › Reservation › Goods Movement | `org.openbravo.common.actionhandler.ReservedGoodMovementActionHandler` | Window name doesn't include "Pick and Edit", but the process does. |
| 8 | `60703FC84BF6494B8A59DDFEAB48A4F6` | RFC/RTV HQL Pick / Edit Lines | `RFCHQLPickAndEditLines` | RFC/RTV HQL Pick and Edit Lines | Pick/Edit Lines | N | N | Y | Sales Order / Sales Order for Picking / Sales Quotation / Lead / Purchase Order / Return from Customer / Return to Vendor | Sales Order/Sales Order for Picking/Sales Quotation/Lead/Purchase Order › Header › RM_PickFromShipment <br/> Return from Customer/Return to Vendor › Header › Pick/Edit Lines | `org.openbravo.common.actionhandler.SRMOPickEditLines` | One of two grids in this modal (paired with row 9). |
| 9 | `8DB776A77D374882B73DE6EC6A78D800` | RFC HQL Pick / Edit Orphan Lines | `RFCHQLPickAndEditLines` | RFC/RTV HQL Pick and Edit Lines | Orphan Lines | N | N | Y | Sales Order / Sales Order for Picking / Sales Quotation / Lead / Purchase Order / Return from Customer / Return to Vendor | (same as row 8) | (same as row 8) | Orphan-lines variant. Pair with row 8. |
| 10 | `95719E62321748BE854604C5364518D6` | RM Receipt Pick and Edit | `RMReceiptPickEditLines` | RM Receipt Pick and Edit Lines | Pick/Edit Lines | N | N | Y | Goods Receipt / Goods Shipment / Return Material Receipt / Return to Vendor Shipment / Packing | Goods Receipt/Goods Shipment/Return Material Receipt/Return to Vendor Shipment › Header › Receive Materials <br/> Packing › Goods Shipment › Pick/Edit Lines | `org.openbravo.common.actionhandler.RMInOutPickEditLines` | Test against every trigger window. |
| 11 | `3596042B422E4F049F9E4AAED238C219` | RM Shipment Pick and Edit | `RMShipmentPickEditLines` | RM Shipment Pick and Edit Lines | Pick/Edit Lines | N | N | Y | Goods Receipt / Goods Shipment / Return Material Receipt / Packing / Return to Vendor Shipment | Goods Receipt/Goods Shipment/Return Material Receipt › Header › Send Materials <br/> Packing › Goods Shipment › Pick/Edit Lines <br/> Return to Vendor Shipment › Header › Pick/Edit Lines | `org.openbravo.common.actionhandler.RMShipmentPickEditLines` | Counterpart of row 10. |
| 12 | `B554A91F90934152BAE1B568428F16E6` | Select Payments | `Select Payments Pick and Edit` | Select Payments Pick and Edit | Pick/Edit Lines | N | N | Y | Remittance | Remittance › Remittance › Select Payments | `org.openbravo.module.remittance.process.SelectPaymentsPickEditLines` | Mandatory. Note window name doesn't include "Pick and Edit". |
| 13 | `8F104213DDF44D62B75D133C956F74CF` | Service Order Line Pick and Edit | `ServiceOrderLineRelationPickEdit` | Service Order Line Relation Pick and Edit | Pick/Edit Lines | N | N | Y | Sales Order / Return from Customer | Sales Order/Return from Customer › Lines › Select Order Line | `org.openbravo.common.actionhandler.ServiceOrderLineRelate` | |

---

## What to verify on each window

For every entry above, run the following checklist. Tick **PASS** only when *all*
items succeed; anything else is a regression to file against `feature/ETP-3751`.

### 1 — Open / initial load (Section §8.1 of `README.md`)

- The button or menu entry opens the modal without a JS error.
- The grid shows a **single transition**: spinner → fully loaded rows. No empty
  flash, no double re-render, no "amount default" appearing on a second pass.
- The window title matches **Window Name** above.
- If `Sel = N`, no checkbox column is rendered. If `+ = Y`, a "+" button is
  rendered at the top-right of the grid.

### 2 — Implicit filter & dataset (§8.14)

- Rows are scoped to the parent record context (e.g., the invoice's BP).
- Column visibility honors `displayLogic` (server-side evaluation: §3.3 +
  §8.5 of `README.md`).
- Mandatory parameters (column **Mandatory** = `Y` in the data) — *Done* must
  reject empty selections.

### 3 — Selection model (§8.2 + §8.13)

- If `Sel = Y` and `Multi = Y`: select multiple rows; the *Done* payload must
  include all of them.
- If `Sel = Y` and `Multi = N`: single-row constraint; selecting a second row
  must deselect the first.
- If `Sel = N` and `+ = Y`: every locally-added row is implicitly part of the
  payload, no checkbox needed.
- Toggling a row's checkbox **must not** trigger a refetch of the datasource
  (verify with DevTools Network panel — the `OBPickAndExecuteDataSource` request
  should not re-fire).

### 4 — Editable cells (§8.8 + §8.10)

For windows where the grid has editable columns (most notably **APRM GL Item**,
**Order/Invoice (Add Payment)**, **Modify Payment Plan**):

- Type characters into an editable cell. **No refetch** must fire on each
  keystroke (§8.13).
- Payscript validations apply the red border without showing the text below
  the input (§8.5).
- Mutual-exclusion pairs (e.g., GL Item ↔ Order/Invoice in Add Payment):
  editing one side clears the other (§8.10).

### 5 — Local rows (`+ = Y`, §8.11)

- Pressing "+" appends a new row with `_locallyAdded = true`.
- After saving (Done), confirm rows are persisted in the right entity and the
  read-only post-create columns honor §8.11's `_locallyAdded` flag.

### 6 — Mandatory-field validation (§8.12)

- Submit with a required cell empty → Done is blocked, the offending cell is
  highlighted.
- Submit with a required cell missing on a row that has `obSelected = true` →
  same behavior.

### 7 — Execution (§10)

- The handler classname in column **Classname** receives the payload exactly
  once (verify backend logs).
- `responseActions[]` are processed in order (refresh window, show success
  message, navigate, etc.).
- A success response closes the modal without orphaning state in the parent
  tab.

### 8 — Reactivate / inverse pairs

Some entries have an inverse counterpart:

| Forward | Reverse |
|---|---|
| `Cash VAT Manual Settlement P&E` | `Reaactivate Cash VAT Manual Settlement` (Action, not P&E grid) |
| `ReferencedInventoryBoxHandler` (Box) | `ReferencedInventoryUnBoxHandler` (UnBox) |
| `Add Multiple Payments` / `AddPayment` | `RemovePaymentFromInvoice` / `RemovePaymentFromOrder` |
| `RMReceiptPickEditLines` | `RMShipmentPickEditLines` |

Verify the inverse leaves the data in the original state (round-trip test).

---

## Known reuse cases (the same window from different parents)

| Window ID | Window Name | Parents | Why |
|---|---|---|---|
| `442FA34D72E5423B8DDBD65DBF0ED4B6` | Reservation Pick and Edit | `ManageReservation` + `ManageStockReservation` | Two separate Defined Processes share the exact same grid. Validate that the handler classname (same Java class, different parent value) correctly distinguishes the entry point. |
| `56A33CA0C8124B8B9E1353382F073DE6` | Modify Payment Plan | `ETABAM_ModifyPaymentInPlan` + `ETABAM_ModifyPaymentOutPlan` | ETABAM module reuses one window for both IN and OUT payment plans. Test direction is selected via the parent process value, not the grid. |

If the implementation does **not** correctly disambiguate which parent invoked the
grid, the Java handler will run with the wrong context — file as a regression.

---

## Where to look next

- Implementation walkthrough: [`README.md`](./README.md).
- Cell-rendering architecture details: [`README.md §8.5`](./README.md#85-cell-rendering-architecture).
- Datasource refetch isolation (mandatory for §3 + §4 above): [`README.md §8.13`](./README.md#813-datasource-refetch-isolation).
- Reactive payscript / mutual exclusion (§4): [`README.md §8.10`](./README.md#810-declarative-field-interactions).

If a P&E window is added or removed in the model after this document is written,
re-run the SQL snippets at the top of this file to refresh the matrix — the
section assignment is deterministic based on the process name and the `ad_menu`
join.
