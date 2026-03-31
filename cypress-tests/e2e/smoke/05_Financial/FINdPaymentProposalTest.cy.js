describe("Financial - Payment Proposal - Select Expected Payments", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("Hydration failed")) return false;
      if (err.message.includes("ResizeObserver loop")) return false;
      return true;
    });
  });

  it("Creates two Purchase Invoices, completes them, selects both in one go and generates payment", () => {
    cy.loginToEtendo("admin", "admin", { useSession: false });

    cy.selectRoleOrgWarehouse();

    // =========================
    // Invoice A (Vendor A)
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

    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();

    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    cy.get('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    cy.wait(500);

    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]').scrollIntoView().click({ force: true });
    cy.wait(1000);

    cy.get('[data-testid="TextInput__3374"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__3374"]').type("11,2", { force: true });
    cy.wait(500);

    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait(1000);
    cy.closeToastIfPresent();

    cy.openProcessMenu(4, "Complete");
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();

    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    cy.contains(".MuiChip-label", "Completed", { timeout: 20000 }).should("exist");

    cy.captureDocumentNumber(undefined, "invoiceNumberA");
    cy.wait(500);

    // =========================
    // Invoice B (Vendor B)
    // =========================
    cy.get('[data-testid="IconButton__33864F5267194AB99C14BD0CE9884FF5"]').first().click();
    cy.wait(1000);

    cy.contains("Main Section").should("be.visible");

    cy.get('[aria-describedby="Business Partner-help"]', { timeout: 15000 })
      .first()
      .scrollIntoView()
      .should("be.visible")
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });
    cy.wait(1000);

    cy.get('input[aria-label="Search options"]', { timeout: 15000 })
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

    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();

    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    cy.get('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Raw material B", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /Raw material B/, { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(1000);

    cy.get('[data-testid="TextInput__3374"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__3374"]').type("10", { force: true });
    cy.wait(500);

    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait(1000);
    cy.closeToastIfPresent();

    cy.openProcessMenu(4, "Complete");
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();

    cy.get("button.toolbar-button-refresh:visible", { timeout: 10000 }).first().should("be.enabled").click();
    cy.wait(1000);

    cy.contains(".MuiChip-label", "Completed", { timeout: 20000 }).should("exist");

    cy.captureDocumentNumber(undefined, "invoiceNumberB");
    cy.wait(500);

    // =========================
    // Payment Proposal + Select Expected Payments (both at once)
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
    const dueDateStr = `${mm}/${dd}/${yyyy}`;

    cy.get("input#duedate", { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type(dueDateStr, { force: true });
    cy.wait(500);

    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    cy.contains("button", "Available Process").click();
    cy.wait(500);

    cy.intercept("POST", "**/api/datasource").as("datasourcePlanB");
    cy.contains("div.cursor-pointer", "Select Expected Payments").should("be.visible").click();
    cy.wait("@datasourcePlanB", { timeout: 30000 });

    cy.waitForSelectExpectedPaymentsData();

    cy.contains(".Mui-TableHeadCell-Content-Wrapper", "Due Date", { timeout: 10000 })
      .closest("th")
      .find(".MuiTableSortLabel-root")
      .click();
    cy.wait(1500);

    cy.contains(".Mui-TableHeadCell-Content-Wrapper", "Due Date", { timeout: 10000 })
      .closest("th")
      .find(".MuiTableSortLabel-root")
      .click();
    cy.wait(2000);

    cy.get("@invoiceNumberA").then((invA) => {
      cy.get("@invoiceNumberB").then((invB) => {
        const invAStr = String(invA);
        const invBStr = String(invB);

        cy.contains("tbody.MuiTableBody-root tr", invAStr, { timeout: 15000 })
          .find('input[aria-label="Toggle select row"]')
          .click({ force: true });

        cy.contains("tbody.MuiTableBody-root tr", invAStr, { timeout: 10000 })
          .find('input[aria-label="Toggle select row"]')
          .should("be.checked");

        cy.contains("tbody.MuiTableBody-root tr", invBStr, { timeout: 15000 })
          .find('input[aria-label="Toggle select row"]')
          .click({ force: true });

        cy.contains("tbody.MuiTableBody-root tr", invBStr, { timeout: 10000 })
          .find('input[aria-label="Toggle select row"]')
          .should("be.checked");
      });
    });

    cy.get('[data-testid="ExecuteButton__761503"]', { timeout: 10000 }).should("be.visible").click();

    cy.get('[data-sonner-toast][data-type="success"]', { timeout: 30000 }).should("be.visible");
    cy.closeToastIfPresent();

    // =========================
    // Generate Payments
    // =========================
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

    // =========================
    // Verify Lines tab: 2 lines created
    // =========================
    cy.get('button[aria-label="Lines"]', { timeout: 10000 }).should("be.visible").click();
    cy.wait(500);

    cy.get("tbody.MuiTableBody-root tr.MuiTableRow-root", { timeout: 30000 }).should("have.length.gte", 2);

    cy.contains('td[title="Vendor A"] button', "Vendor A", { timeout: 10000 }).should("be.visible");
    cy.contains('td[title="Vendor B"] button', "Vendor B", { timeout: 10000 }).should("be.visible");
  });
});
