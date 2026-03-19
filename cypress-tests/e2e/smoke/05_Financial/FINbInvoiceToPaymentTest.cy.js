describe("Financial Test 2 - Sales Invoice to Payment In", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      return !err.message.includes("Hydration failed");
    });
  });

  it("Creates Sales Invoice, completes it, creates Payment In and links the invoice", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });

    cy.selectRoleOrgWarehouse();

    // -------------------------
    // Step 1: Navigate to Sales Invoice
    // -------------------------
    cy.get(".h-14 > div > .transition > svg").click();

    cy.typeInGlobalSearch("sales i");

    cy.get('[data-testid="MenuTitle__178"] > .flex.overflow-hidden > .relative > .ml-2').click();

    // -------------------------
    // Step 2: Create New Sales Invoice
    // -------------------------
    cy.clickNewRecord();

    cy.contains("Main Section").should("be.visible");

    // Business Partner: Customer A
    cy.get('[aria-describedby="Business Partner-help"]')
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Customer A", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Customer A$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

    // Save header to populate defaults
    cy.clickSave();
    cy.closeToastIfPresent();

    // Save all header fields
    cy.clickSave();
    cy.closeToastIfPresent();

    // Verify Draft status
    cy.contains(".MuiChip-label", "Draft", { timeout: 10000 }).should("exist");

    // -------------------------
    // Step 3: Add Invoice Line
    // -------------------------
    cy.get('button[aria-label="Lines"]').click();

    cy.clickNewRecord();

    // Product: Final good A
    cy.get('[data-testid="ChevronDown__2996"]').scrollIntoView().click({ force: true });

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Final good", { delay: 0, force: true });

    cy.intercept("POST", /FormInitializationComponent/).as("productFormInit");
    cy.contains('[data-testid^="OptionItem__"]', /Final good A/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait("@productFormInit", { timeout: 60000 });

    // Invoiced Quantity: 13.13
    cy.get('[data-testid="TextInput__2999"]').clear({ force: true });
    cy.get('[data-testid="TextInput__2999"]').type("13,13", { force: true });

    // Save line
    cy.get("button.toolbar-button-save").eq(1).click();
    cy.closeToastIfPresent();

    // Verify Net Amount: 26.26
    cy.contains("26.26").should("be.visible");

    // -------------------------
    // Step 4: Complete Sales Invoice
    // -------------------------
    cy.contains("button", "Available Process").click();

    cy.get(".rounded-2xl > :nth-child(1)").click();

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");

    cy.clickOkInLegacyPopup();

    cy.get(".mb-1", { timeout: 10000 }).should("have.text", "Process completed successfully");

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();

    // Refresh and verify Completed status
    cy.get("button.toolbar-button-refresh").filter(":visible").first().should("be.enabled").click();
    cy.wait(500);

    // Capture invoice number for later use
    cy.captureDocumentNumber(undefined, "invoiceNumber");

    // -------------------------
    // Step 5: Navigate to Payment In
    // -------------------------
    cy.typeInGlobalSearch("payment");

    cy.contains('[data-testid^="MenuTitle__"]', "Payment In", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });

    // -------------------------
    // Step 6: Create new Payment In
    // -------------------------
    cy.clickNewRecord();

    cy.contains("Main Section").should("be.visible");

    // Received From (Business Partner): Customer A
    cy.get('[data-testid="ChevronDown__7C541AC0C75CFDD7E040007F01016B4D"]').scrollIntoView().click({ force: true });

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Customer A", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Customer A$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

    // Save to populate defaults
    cy.clickSave();
    cy.closeToastIfPresent();

    // Amount: 28.92
    cy.get('[data-testid="TextInput__329fab"]').scrollIntoView().clear({ force: true }).type("28,92", { force: true });

    // Save Payment In
    cy.clickSave();
    cy.closeToastIfPresent();

    // Verify Status: Awaiting Payment
    cy.get('span[name="status"]', { timeout: 10000 }).should("be.visible").and("have.text", "Awaiting Payment");

    // Capture payment document number
    cy.captureDocumentNumber(undefined, "paymentNumber");

    // -------------------------
    // Step 7: Open Add Details process
    // -------------------------
    cy.get('[data-testid="IconButtonWithText__process-menu"]').click();
    cy.wait(500);

    cy.get('[data-testid="ProcessMenuItemBase__541926"]').click();

    cy.get("tbody.MuiTableBody-root tr.MuiTableRow-root", { timeout: 30000 }).should("have.length.gte", 1);

    cy.get("@invoiceNumber").then((invoiceNumber) => {
      const invoiceStr = String(invoiceNumber);

      cy.intercept("POST", "**/api/datasource**").as("filterRequest");

      cy.get('input[placeholder="Filter Invoice No...."]', { timeout: 15000 })
        .scrollIntoView()
        .should("be.visible")
        .click({ force: true })
        .clear({ force: true })
        .type(invoiceStr, { force: true, delay: 150 });

      cy.wait("@filterRequest", { timeout: 30000 });

      cy.contains("tbody.MuiTableBody-root tr", invoiceStr, { timeout: 30000 })
        .should("exist")
        .scrollIntoView()
        .find('input[aria-label="Toggle select row"]')
        .click({ force: true });

      cy.contains("tbody.MuiTableBody-root tr", invoiceStr, { timeout: 10000 })
        .find('input[aria-label="Toggle select row"]')
        .should("be.checked");
    });

    cy.get('div[aria-label="Action Regarding Document"]', { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .find('div[tabindex="0"]')
      .should("not.be.disabled")
      .click();

    cy.get('div[data-dropdown-portal] li[data-testid^="OptionItem__"]', { timeout: 15000 }).should(
      "have.length.gte",
      1
    );

    cy.contains('li[data-testid^="OptionItem__"] span', "Process Received Payment(s)", { timeout: 20000 })
      .should("be.visible")
      .click();

    cy.get('[data-testid="ExecuteButton__761503"]', { timeout: 10000 }).should("be.visible").click();

    cy.get('[data-sonner-toast][data-type="success"]', { timeout: 30000 }).should("be.visible");
    cy.closeToastIfPresent();

    // Verify Status: Payment Received
    cy.get('[data-testid="status-bar-container"] span[name="status"]', { timeout: 20000 })
      .should("be.visible")
      .and("have.text", "Payment Received");

    // Verify Generated Credit: 1.74
    cy.get('[data-testid="status-bar-container"] span[name="generatedCredit"]', { timeout: 10000 })
      .should("be.visible")
      .and("have.text", "1.74");
  });
});
