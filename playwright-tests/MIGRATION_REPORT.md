# Technical Report: Cypress → Playwright Migration (SALaOrderToInvoiceTest)

**Date:** 2026-03-19
**Branch:** `hotfix/ETP-3526`
**Test file:** `e2e/smoke/01_Sales/SALaOrderToInvoiceTest.spec.ts`

---

## Objective

Migrate the smoke test `SALaOrderToInvoiceTest.cy.js` from Cypress to Playwright as a proof of concept to evaluate the feasibility of migrating the full test suite.

---

## Status at Close

| Step | Description | Status |
|---|---|---|
| 1–2 | Login, role/org/warehouse selection, navigate to Sales Order | ✅ Working |
| 3 | Fill Sales Order header (Business Partner, Transaction Document, Invoice Terms) | ✅ Working |
| 4 | Add order lines (Product, Quantity) | ✅ Working |
| 5 | Process Order (Book) | ✅ Working |
| 6 | Create Goods Shipment with Business Partner | ✅ Working |
| **7** | **Add Lines From Sales Order (legacy iframe + Locator popup)** | ❌ Blocked |
| 8–12 | Process Shipment, Create Invoice, Add Lines, Complete, Post | ⚠️ Not verified |

---

## Primary Blocker: Step 7 — Locator Popup

### Context

The "Create Lines From" form in the Goods Shipment window (Openbravo Classic) contains a required **Locator** field (warehouse bin). This field is populated by opening an Openbravo selector popup (`Locator.html`). Without a valid locator, the form's client-side validation blocks submission and the process never completes.

### Architecture

The popup involves three cross-origin layers:

```
localhost:3000  (Next.js React — main app)
  └── iframe: localhost:3000/meta/legacy/...  (proxied to localhost:8080)
        └── popup window: localhost:8080/etendo/.../Locator.html
```

The Openbravo popup is designed to call `window.opener.document.getElementById('paramM_Locator_ID').value = id` after the user selects a row. This **fails silently due to cross-origin restrictions** (`localhost:3000` vs `localhost:8080`), even with `--disable-web-security` and `--disable-site-isolation-trials` flags set.

### Attempted Solutions

| Approach | Result |
|---|---|
| Playwright CDP `frame.evaluate()` to set locator field directly | Field remains empty — DOM IDs not found or overwritten by Openbravo JS |
| `Promise.all([waitForNavigation, evaluate(form.submit())])` to submit `Command=SEARCH` in popup | Popup opens but `tr[onclick]` count is 0 after navigation |
| `waitForLoadState("networkidle")` after `form.submit()` as alternative wait strategy | Same result: 0 rows in the results grid |
| Diagnostic throw before OK click | Confirmed popup opens (`popupWasNull=false`) but locator ID is never transferred to the frame (`locatorId: ""`) |

### Most Likely Root Cause (Unconfirmed)

The Locator popup POST request (`Command=SEARCH`) likely requires additional context parameters (warehouse ID, organization ID, window context) that are not included when `form.submit()` is triggered programmatically. Without these filters, the search returns 0 results, `locatorFromPopup` is null, the field stays empty, and Openbravo's client-side validation blocks the OK button from submitting.

---

## Structural Challenges

### 1. Hybrid Legacy Architecture
Etendo combines modern React components with Openbravo Classic iframes. Playwright handles React well, but cross-origin iframes present restrictions that Cypress handled more permissively via `chromeWebSecurity: false` at the browser level.

### 2. Fragile Selectors in Openbravo Classic
Openbravo Classic iframes use HTML tables, inline event handlers (`onclick="opener_select(...)"`), and dynamic IDs that are difficult to target reliably with Playwright locators.

### 3. Underestimated Complexity
The test covers 12 steps involving 3 nested iframes, 2 external popup windows, and server-side validation. The initial estimate did not account for the cross-origin popup interaction complexity.

---

## Recommendations

1. **Use Playwright Codegen for Step 7**: Record the full flow manually with `npx playwright codegen --viewport-size=1280,720 http://localhost:3000` to capture the exact selectors Playwright sees in the Locator popup — particularly the row click that triggers field population.

2. **Direct API Approach**: Use `page.context().request.get()` to fetch the locator ID directly from the Openbravo JSON REST API before interacting with the popup, bypassing the cross-origin dependency entirely.
   ```
   GET /etendo/org.openbravo.service.json.jsonrest/M_Locator?_startRow=0&_endRow=5
   ```

3. **Reassess Migration Scope**: For tests heavily dependent on Openbravo Classic (cross-origin iframes + legacy popups), Cypress remains more suitable. Playwright is the better choice for flows contained within the modern React UI.

4. **Incremental Migration Strategy**: Prioritize tests that are 100% within the new React UI before migrating flows with significant legacy iframe interaction.
