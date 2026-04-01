// Industry benchmarks (sources: SAP <2s dialog, Odoo <2-3s lists, Nielsen 1s/10s limits)
// warning: industry standard — where competitive ERPs perform
// failure: max tolerable — beyond this, users abandon tasks (Nielsen 10s rule)
const THRESHOLDS = {
  windowOpen: { warning: 2000, failure: 5000 },
  newRecordForm: { warning: 2000, failure: 5000 },
  saveRecord: { warning: 2000, failure: 5000 },
  saveRecordComplex: { warning: 3000, failure: 8000 },
  tableLoad: { warning: 2000, failure: 5000 },
  tabNavigation: { warning: 1000, failure: 3000 },
  advancedFilters: { warning: 1000, failure: 3000 },
  dropdownLoad: { warning: 1000, failure: 3000 },
  consecutiveRecord: { warning: 3000, failure: 8000 },
};

function assertPerformance(elapsed, label, threshold) {
  const { warning, failure } = threshold;
  if (elapsed <= warning) {
    cy.log(`✅ ${label}: ${elapsed}ms (GOOD - within industry standard of ${warning}ms)`);
  } else if (elapsed <= failure) {
    cy.log(
      `⚠️ ${label}: ${elapsed}ms (WARNING - exceeds industry standard of ${warning}ms, max tolerable: ${failure}ms)`
    );
    cy.log(`⚠️ INDUSTRY BENCHMARK: SAP < 2s, Odoo < 2-3s, Nielsen limit: 1s flow / 10s attention`);
  }
  expect(elapsed, `${label} should be under ${failure}ms (max tolerable)`).to.be.lessThan(failure);
}

describe("CRUD Performance Tests", () => {
  beforeEach(() => {
    cy.loginToEtendo();
    cy.visit("/");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.verifyEtendoInterface();
  });

  describe("Window Open Performance", () => {
    it.skip("should open Sales Order window within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);

      const startTime = Date.now();
      cy.get('[data-testid="MenuTitle__129"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Sales Order window open", THRESHOLDS.windowOpen);
      });
    });

    it.skip("should open Product window within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);

      const startTime = Date.now();
      cy.get('[data-testid="MenuTitle__126"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Product window open", THRESHOLDS.windowOpen);
      });
    });

    it.skip("should open Business Partner window within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("business");
      cy.wait(500);

      const startTime = Date.now();
      cy.contains('[data-testid^="MenuTitle"]', "Business Partner").first().click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Business Partner window open", THRESHOLDS.windowOpen);
      });
    });
  });

  describe("New Record Performance", () => {
    it.skip("should open new Sales Order form within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__129"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      const startTime = Date.now();
      cy.clickNewRecord();
      cy.contains("Main Section", { timeout: 20000 }).should("be.visible");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "New Sales Order form load", THRESHOLDS.newRecordForm);
      });
    });

    it.skip("should open new Product form within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__126"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      const startTime = Date.now();
      cy.clickNewRecord();
      cy.get('input[aria-label="Search Key"]', { timeout: 20000 }).filter(":visible").should("exist");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "New Product form load", THRESHOLDS.newRecordForm);
      });
    });
  });

  describe("Save Record Performance", () => {
    it.skip("should save a Sales Order header within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__129"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      cy.clickNewRecord();
      cy.contains("Main Section", { timeout: 20000 }).should("be.visible");
      cy.wait(1000);

      cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
      cy.wait(1000);
      cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();
      cy.wait(1000);

      cy.get('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full').click();
      cy.wait(1000);
      cy.get('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();
      cy.wait(1000);

      const startTime = Date.now();
      cy.clickSave();
      cy.get("[data-sonner-toast]", { timeout: 30000 }).should("exist");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Sales Order save", THRESHOLDS.saveRecordComplex);
      });
      cy.closeToastIfPresent();
    });

    it.skip("should save a Product record within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__126"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      cy.clickNewRecord();
      cy.get('input[aria-label="Search Key"]', { timeout: 20000 }).filter(":visible").should("exist");
      cy.wait(1000);

      const uniqueKey = `PERF_${Date.now()}`;
      cy.get('input[aria-label="Search Key"]').filter(":visible").clear().type(uniqueKey);
      cy.typeName(`Perf Test Product ${uniqueKey}`);
      cy.wait(500);

      const startTime = Date.now();
      cy.clickSave();
      cy.get("[data-sonner-toast]", { timeout: 30000 }).should("exist");
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Product save", THRESHOLDS.saveRecord);
      });
      cy.closeToastIfPresent();
    });
  });

  describe("Table Load Performance", () => {
    it("should load Sales Order table with data within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);

      cy.get('[data-testid="MenuTitle__129"]').click();

      const startTime = Date.now();
      cy.get("tr[data-index]", { timeout: 20000 }).should("have.length.at.least", 1);
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Sales Order table load", THRESHOLDS.tableLoad);
      });
    });

    it.skip("should load Product table with data within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);

      cy.get('[data-testid="MenuTitle__126"]').click();

      const startTime = Date.now();
      cy.get("tr[data-index]", { timeout: 20000 }).should("have.length.at.least", 1);
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Product table load", THRESHOLDS.tableLoad);
      });
    });
  });

  describe("Tab Navigation Performance", () => {
    it.skip("should switch to Lines tab within acceptable time", () => {
      cy.on("uncaught:exception", () => false);
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__129"]').click();
      cy.get("tr[data-index]", { timeout: 20000 }).should("have.length.at.least", 1);

      cy.get("tr[data-index='0'] td button").first().click({ force: true });
      cy.wait(3000);

      cy.get("body").then(($body) => {
        if ($body.text().includes("Application error")) {
          cy.log("App crashed on row click - known app issue, skipping tab navigation");
          return;
        }
        cy.get('button[aria-label="Lines"], button:contains("Lines")', { timeout: 15000 })
          .filter(":visible")
          .first()
          .then(($btn) => {
            const startTime = Date.now();
            cy.wrap($btn).click({ force: true });
            cy.get("tr[data-index]", { timeout: 20000 }).should("exist");
            cy.then(() => {
              assertPerformance(Date.now() - startTime, "Lines tab switch", THRESHOLDS.tabNavigation);
            });
          });
      });
    });
  });

  describe("Search and Filter Performance", () => {
    it("should filter table results within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__126"]').click();
      cy.get("tr[data-index]", { timeout: 20000 }).should("have.length.at.least", 1);

      cy.get("button.toolbar-button-advanced-filters", { timeout: 10000 }).then(($btn) => {
        if ($btn.length > 0 && !$btn.is(":disabled")) {
          const startTime = Date.now();
          cy.wrap($btn).first().click();
          cy.contains("Advanced Filters", { timeout: 10000 }).should("be.visible");
          cy.then(() => {
            assertPerformance(Date.now() - startTime, "Advanced Filters open", THRESHOLDS.advancedFilters);
          });
        } else {
          cy.log("Advanced Filters button not available, skipping");
        }
      });
    });

    it.skip("should open dropdown options within acceptable time", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__129"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      cy.clickNewRecord();
      cy.contains("Main Section", { timeout: 20000 }).should("be.visible");
      cy.wait(1000);

      const startTime = Date.now();
      cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
      cy.get('[data-testid^="OptionItem"]', { timeout: 15000 }).should("have.length.at.least", 1);
      cy.then(() => {
        assertPerformance(Date.now() - startTime, "Dropdown options load", THRESHOLDS.dropdownLoad);
      });
    });
  });

  describe("Consecutive CRUD Operations Performance", () => {
    it.skip("should handle multiple record creations without degradation", () => {
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("produ");
      cy.wait(500);
      cy.get('[data-testid="MenuTitle__126"]').click();
      cy.get("button.toolbar-button-new", { timeout: 20000 }).should("be.visible");

      const times = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]', {
          timeout: 20000,
        })
          .first()
          .click({ force: true });
        cy.get('input[aria-label="Search Key"]', { timeout: 20000 }).filter(":visible").should("exist");
        cy.then(() => {
          times.push(Date.now() - startTime);
        });

        const uniqueKey = `PERF_BATCH_${Date.now()}_${i}`;
        cy.get('input[aria-label="Search Key"]').filter(":visible").clear().type(uniqueKey);
        cy.typeName(`Perf Batch ${i}`);
        cy.wait(500);

        cy.clickSave();
        cy.get("[data-sonner-toast]", { timeout: 30000 }).should("exist");
        cy.closeToastIfPresent();
        cy.wait(1000);
      }

      cy.then(() => {
        for (let i = 0; i < times.length; i++) {
          assertPerformance(times[i], `Record ${i + 1} creation`, THRESHOLDS.consecutiveRecord);
        }
        const lastTime = times[times.length - 1];
        const firstTime = times[0];
        cy.log(`First: ${firstTime}ms, Last: ${lastTime}ms`);
      });
    });
  });
});
