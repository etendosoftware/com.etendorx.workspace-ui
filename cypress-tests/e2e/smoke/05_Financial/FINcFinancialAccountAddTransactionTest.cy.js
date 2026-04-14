describe("Financial Account - Add Transaction from Purchase Invoice", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      return !err.message.includes("Hydration failed");
    });
  });

  it("Creates Purchase Invoice, completes it, verifies Payment Out Plan and adds Financial Account transaction", () => {
    cy.loginToEtendo("admin", "admin", { useSession: false });
    cy.wait(500);

    cy.selectRoleOrgWarehouse();

    // -------------------------
    // Step 1: Navigate to Purchase Invoice
    // -------------------------
    cy.get(".h-14 > div > .transition > svg").click();
    cy.wait(500);

    cy.typeInGlobalSearch("purch");
    cy.wait(500);
    cy.get('[data-testid="MenuTitle__206"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500);

    // -------------------------
    // Step 2: Create new Purchase Invoice
    // -------------------------
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
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // -------------------------
    // Step 3: Edit invoice - change Payment Method to PM 4 Spain
    // -------------------------
    cy.get('[data-testid="ChevronDown__830698140BCD4AC3E040007F01000289"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-testid="OptionItem__BC79E3E914CF471C91AE183FC5311BE7"]').scrollIntoView().click({ force: true });
    cy.wait(500);

    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // -------------------------
    // Step 4: Add invoice line
    // -------------------------
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.get("button.toolbar-button-new-form", { timeout: 15000 }).filter(":visible").not(":disabled").first().click();
    cy.wait(500);

    // Product: Raw material A
    cy.get('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    cy.wait(500);

    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]').scrollIntoView().click({ force: true });
    cy.wait("@productFormInit", { timeout: 60000 });

    // Invoiced Quantity: 11.2
    cy.get('[data-testid="TextInput__3374"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__3374"]').type("11,2", { force: true });
    cy.wait(500);

    // Save line
    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Verify Net Amount: 22.40
    cy.contains("22.4").should("be.visible");

    // -------------------------
    // Step 5: Complete Purchase Invoice
    // -------------------------
    cy.contains("button", "Available Process").click();
    cy.wait(500);

    cy.get(".rounded-2xl > :nth-child(1)").click();
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");
    cy.wait(500);

    cy.clickOkInLegacyPopup();

    cy.wait(500);
    cy.get("p.text-gray-700", { timeout: 10000 })
      .should("be.visible")
      .invoke("text")
      .then((text) => {
        const match = text.match(/Payment No\.\s*(\d+)/);
        if (match) {
          cy.wrap(match[1]).as("paymentNumber");
        }
      });

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();
    cy.wait(500);

    cy.get("button.toolbar-button-refresh").filter(":visible").first().should("be.enabled").click();
    cy.wait(1000);

    // Verify Grand Total: 24.64
    cy.contains("24.64").should("be.visible");

    // Verify Payment Complete: Yes
    cy.get('span[name="paymentComplete"]', { timeout: 20000 }).should("be.visible").and("have.text", "Yes");

    // -------------------------
    // Step 6: Verify Payment Out Plan
    // -------------------------
    cy.get('button[title="Payment Plan"]', { timeout: 10000 }).should("be.visible").click();
    cy.wait(1000);
    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    // Verify Expected: 24.64
    cy.get(".MuiTableCell-body:visible").contains("24.64").should("exist");

    // -------------------------
    // Step 7: Navigate to Financial Account
    // -------------------------

    cy.typeInGlobalSearch("finan");
    cy.wait(500);

    cy.contains('[data-testid^="MenuTitle__"]', "Financial Account", { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    // -------------------------
    // Step 8: Search and select "Spain Cashbook"
    // -------------------------
    cy.get('input.w-full[placeholder="Filter Name..."]', { timeout: 10000 })
      .should("be.visible")
      .clear()
      .type("Spain Cashbook{enter}", { force: true });
    cy.wait(1000);

    cy.contains("Spain Cashbook", { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    // -------------------------
    // Step 9: Navigate to Transactions tab
    // -------------------------
    cy.get('button[aria-label="Transaction"]', { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    // -------------------------
    // Step 10: Add new transaction
    // -------------------------
    cy.get("button.toolbar-button-new:visible", { timeout: 20000 }).eq(1).click();
    cy.wait(500);

    // Transaction Type: BP Withdrawal
    cy.get('[data-testid="ChevronDown__7019E1AFE07B44309AE2F0C6629C1251"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-testid="OptionItem__BPW"]').scrollIntoView().click({ force: true });
    cy.wait(500);

    // Link with Payment Number from step 6
    cy.get("@paymentNumber").then((paymentNumber) => {
      cy.get('[aria-label="Payment"] > div[tabindex="0"]').click();
      cy.wait(500);

      cy.get('input[aria-label="Search options"]', { timeout: 10000 })
        .should("be.visible")
        .clear({ force: true })
        .type(paymentNumber, { delay: 50, force: true });
      cy.wait(1000);

      cy.contains('[data-testid^="OptionItem__"]', paymentNumber, { timeout: 10000 })
        .should("be.visible")
        .click({ force: true });
      cy.wait(500);
    });

    // Save the transaction
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // -------------------------
    // Step 11: Verify Payment Out status - Withdrawn not Cleared
    // -------------------------

    cy.typeInGlobalSearch("payment");
    cy.wait(500);

    cy.contains('[data-testid^="MenuTitle__"]', "Payment Out", { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    cy.get("@paymentNumber").then((paymentNumber) => {
      cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type(`${paymentNumber}{enter}`, { force: true });
      cy.wait(1000);

      cy.contains(paymentNumber, { timeout: 10000 }).should("be.visible").click();
      cy.wait(500);
    });

    cy.get(".MuiTableContainer-root").first().scrollTo("right");
    cy.wait(500);
    cy.contains(".MuiChip-label", "Payment Made", { timeout: 20000 }).should("exist");
  });
});
