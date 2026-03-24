const closeProcessModal = () => {
  cy.get("body").then(($b) => {
    const retryBtn = $b.find("button:contains('Retry')");
    if (retryBtn.length > 0) {
      const closeBtn = $b.find("button:contains('Close')");
      if (closeBtn.length > 0) {
        cy.contains("button", "Close").click({ force: true });
        return;
      }
    }
    const closeX = $b.find("svg.lucide-x").closest("button");
    if (closeX.length > 0) {
      cy.wrap(closeX.first()).click({ force: true });
      return;
    }
    const closeButton = $b.find("button:contains('Close')");
    if (closeButton.length > 0) {
      cy.contains("button", "Close").click({ force: true });
      return;
    }
    cy.get("body").type("{esc}");
  });
};

const openSelectExpectedPaymentsWithRetry = (retries = 3) => {
  cy.contains("button", "Available Process").click();
  cy.wait(500);

  cy.intercept("POST", "**/api/datasource**").as(`selectPaymentsData_${retries}`);

  cy.contains("div.cursor-pointer", "Select Expected Payments").should("be.visible").click();

  cy.wait(`@selectPaymentsData_${retries}`, { timeout: 30000 });

  cy.wait(2000);

  cy.get("body").then(($body) => {
    const bodyText = $body.text();
    const hasError = bodyText.includes("errors.missingData") || bodyText.includes("missingData");
    const dataRows = $body.find("tbody.MuiTableBody-root tr.MuiTableRow-root td").length;
    const hasData = dataRows > 0;

    if (hasError || !hasData) {
      if (retries <= 0) {
        throw new Error("Select Expected Payments failed after retries: errors.missingData or no data rows");
      }

      cy.log(`Select Expected Payments: error=${hasError}, dataRows=${dataRows}. Retrying (${retries} left)...`);

      closeProcessModal();

      cy.wait(2000);

      cy.get("tbody.MuiTableBody-root", { timeout: 5000 }).should("not.exist");

      cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
      cy.wait(3000);

      openSelectExpectedPaymentsWithRetry(retries - 1);
    } else {
      cy.log(`Select Expected Payments loaded successfully with ${dataRows} data cells`);
    }
  });
};

describe("Financial - Payment Proposal from two Purchase Invoices", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("Hydration failed")) return false;
      if (err.message.includes("ResizeObserver loop")) return false;
      return true;
    });
  });

  it("Creates two Purchase Invoices, completes them, then creates a Payment Proposal linking both", () => {
    cy.loginToEtendo("admin", "admin", { useSession: false });

    cy.selectRoleOrgWarehouse();

    // =========================
    // Block 1: Create Purchase Invoice A (Vendor A)
    // =========================
    cy.get(".h-14 > div > .transition > svg").click();
    cy.wait(500);

    cy.typeInGlobalSearch("purch");
    cy.wait(500);
    cy.get('[data-testid="MenuTitle__206"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    cy.contains("Main Section").should("be.visible");

    // Business Partner: Vendor A
    cy.get('[aria-describedby="Business Partner-help"]')
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Vendor A", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Vendor A$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait(500);

    // Save header
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();

    // Lines tab
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    // Product: Raw Material A
    cy.get('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    cy.wait(500);

    cy.intercept("POST", /FormInitializationComponent/).as("productFormInitA");
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]').scrollIntoView().click({ force: true });
    cy.wait("@productFormInitA", { timeout: 60000 });

    // Invoiced Quantity: 11.2
    cy.get('[data-testid="TextInput__3374"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__3374"]').type("11,2", { force: true });
    cy.wait(500);

    // Save line
    cy.intercept("POST", "**/api/datasource**").as("saveLineA");
    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait("@saveLineA", { timeout: 30000 });
    cy.closeToastIfPresent();

    // Complete Invoice A
    cy.openProcessMenu(4, "Complete");
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();

    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    // Verify Invoice A completed
    cy.contains(".MuiChip-label", "Completed", { timeout: 20000 }).should("exist");

    cy.get('span[name="paymentComplete"]', { timeout: 20000 }).should("be.visible").and("have.text", "No");

    // Capture Invoice A document number
    cy.captureDocumentNumber(undefined, "invoiceNumberA");
    cy.wait(500);

    // =========================
    // Block 2: Create Purchase Invoice B (Vendor B)
    // =========================
    cy.get('[data-testid="IconButton__33864F5267194AB99C14BD0CE9884FF5"]').first().click();
    cy.wait(500);

    cy.contains("Main Section").should("be.visible");

    // Business Partner: Vendor B
    cy.get('[aria-describedby="Business Partner-help"]')
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Vendor B", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Vendor B$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait(500);

    cy.get('[data-testid="ChevronDown__830698140BCD4AC3E040007F01000289"]').scrollIntoView().click({ force: true });
    cy.wait(500);

    cy.get('[data-testid="OptionItem__42E87E97974E4B35849A430B8F6F2884"]', { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    // Save header
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();

    // Lines tab
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    // Product: Raw Material B
    cy.get('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Raw material B", { delay: 0, force: true });

    cy.intercept("POST", /FormInitializationComponent/).as("productFormInitB");
    cy.contains('[data-testid^="OptionItem__"]', /Raw material B/, { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait("@productFormInitB", { timeout: 60000 });

    // Invoiced Quantity: 10
    cy.get('[data-testid="TextInput__3374"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__3374"]').type("10", { force: true });
    cy.wait(500);

    // Save line
    cy.intercept("POST", "**/api/datasource**").as("saveLineB");
    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait("@saveLineB", { timeout: 30000 });
    cy.closeToastIfPresent();

    // Verify Net Amount
    cy.contains("20").should("be.visible");

    // Complete Invoice B
    cy.openProcessMenu(4, "Complete");
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get(".mb-1", { timeout: 30000 }).should("have.text", "Process completed successfully");

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();

    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    // Verify Invoice B completed
    cy.contains(".MuiChip-label", "Completed", { timeout: 20000 }).should("exist");
    cy.contains("22").should("be.visible");

    // Capture Invoice B document number
    cy.captureDocumentNumber(undefined, "invoiceNumberB");
    cy.wait(500);

    // =========================
    // Block 3: Create Payment Proposal
    // =========================
    cy.typeInGlobalSearch("payment prop");
    cy.wait(500);

    cy.contains('[data-testid^="MenuTitle__"]', "Payment Proposal", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 120);
    const dd = String(futureDate.getDate()).padStart(2, "0");
    const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const yyyy = futureDate.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    cy.get('input[aria-label="Incl. documents up to this date"]', { timeout: 10000 })
      .should("be.visible")
      .clear()
      .type(formattedDate, { force: true });
    cy.wait(500);

    // Save header
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // -------------------------
    // Select Expected Payments: Invoice A
    // -------------------------
    openSelectExpectedPaymentsWithRetry();

    cy.get("@invoiceNumberA").then((invoiceNumberA) => {
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 })
        .should("be.visible")
        .click()
        .clear();
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type(
        `${String(invoiceNumberA)}`,
        { force: true, delay: 150 }
      );
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type("{backspace}", {
        force: true,
      });
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type(
        `${String(invoiceNumberA).slice(-1)}`,
        { force: true, delay: 150 }
      );
      cy.wait(2000);

      cy.contains("tbody.MuiTableBody-root tr", String(invoiceNumberA), { timeout: 30000 })
        .should("exist")
        .find('input[aria-label="Toggle select row"]')
        .click({ force: true });
    });

    cy.intercept("POST", "**/api/datasource**").as("executeProcessA");
    cy.get('[data-testid="ExecuteButton__761503"]').click();
    cy.wait("@executeProcessA", { timeout: 30000 });

    cy.get('[data-sonner-toast][data-type="success"]', { timeout: 30000 }).should("be.visible");
    cy.closeToastIfPresent();

    cy.get(".fixed.inset-0", { timeout: 10000 }).should("not.exist");
    cy.wait(1000);

    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    // -------------------------
    // Select Expected Payments: Invoice B
    // -------------------------
    openSelectExpectedPaymentsWithRetry();

    cy.get("@invoiceNumberB").then((invoiceNumberB) => {
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 })
        .should("be.visible")
        .click()
        .clear();
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type(
        `${String(invoiceNumberB)}`,
        { force: true, delay: 150 }
      );
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type("{backspace}", {
        force: true,
      });
      cy.wait(500);
      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 }).type(
        `${String(invoiceNumberB).slice(-1)}`,
        { force: true, delay: 150 }
      );
      cy.wait(2000);

      cy.contains("tbody.MuiTableBody-root tr", String(invoiceNumberB), { timeout: 30000 })
        .should("exist")
        .find('input[aria-label="Toggle select row"]')
        .click({ force: true });
    });

    cy.intercept("POST", "**/api/datasource**").as("executeProcessB");
    cy.get('[data-testid="ExecuteButton__761503"]').click();
    cy.wait("@executeProcessB", { timeout: 30000 });

    cy.get('[data-sonner-toast][data-type="success"]', { timeout: 30000 }).should("be.visible");
    cy.closeToastIfPresent();

    cy.get(".fixed.inset-0", { timeout: 10000 }).should("not.exist");
    cy.wait(500);

    // -------------------------
    // Generate Payments
    // -------------------------
    cy.contains("button", "Available Process").click();
    cy.wait(500);

    cy.contains("div.cursor-pointer", "Generate Payments").should("be.visible").click();
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold", { timeout: 10000 }).should("be.visible");
    cy.wait(500);

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();
    cy.wait(500);

    // -------------------------
    // Verify Lines tab: 2 lines created
    // -------------------------
    cy.get('button[aria-label="Lines"]', { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    cy.get("tbody.MuiTableBody-root tr.MuiTableRow-root", { timeout: 30000 }).should("have.length.gte", 2);

    cy.contains('td[title="Vendor A"] button', "Vendor A", { timeout: 10000 }).should("be.visible");
    cy.contains('td[title="Vendor B"] button', "Vendor B", { timeout: 10000 }).should("be.visible");
  });
});
