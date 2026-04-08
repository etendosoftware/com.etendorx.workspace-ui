describe("Stress Tests", () => {
  beforeEach(() => {
    cy.loginToEtendo();
  });

  describe("Rapid Navigation Stress", () => {
    it.skip("should handle rapid sequential page visits without crashing", () => {
      const iterations = 15;

      for (let i = 0; i < iterations; i++) {
        cy.visit("/");
        cy.get("body", { timeout: 15000 }).should("be.visible");
        cy.verifyEtendoInterface();
        cy.log(`Navigation iteration ${i + 1}/${iterations} completed`);
      }
    });

    it("should handle rapid menu search interactions", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      const searchTerms = [
        "sales",
        "purchase",
        "product",
        "business",
        "invoice",
        "order",
        "warehouse",
        "payment",
        "goods",
        "report",
      ];

      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input', { timeout: 10000 }).should("be.visible");

      searchTerms.forEach((term, index) => {
        cy.get('[data-testid="drawer-search-input"] input').clear().type(term, { delay: 0 });
        cy.wait(300);
        cy.log(`Search iteration ${index + 1}/${searchTerms.length}: "${term}"`);
      });

      cy.get('[data-testid="drawer-search-input"] input').clear();
      cy.get("body").should("be.visible");
    });
  });

  describe("Form Interaction Stress", () => {
    it("should handle rapid input field interactions on login page", () => {
      cy.cleanupEtendo();
      cy.visit("/");
      cy.get("#username", { timeout: 10000 }).should("be.visible");

      const iterations = 30;
      for (let i = 0; i < iterations; i++) {
        cy.get("#username").clear({ force: true }).type(`user_${i}`, { delay: 0 });
        cy.get("#password").clear({ force: true }).type(`pass_${i}`, { delay: 0 });
      }

      cy.get("#username").should("be.visible");
      cy.get("#password").should("be.visible");
      cy.log(`Completed ${iterations} rapid form input cycles`);
    });

    it("should handle rapid click events without freezing", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      const clicks = 20;
      for (let i = 0; i < clicks; i++) {
        cy.get("body").click("center", { force: true });
      }

      cy.get("body").should("be.visible");
      cy.log(`Completed ${clicks} rapid clicks without crash`);
    });
  });

  describe("Session Stress", () => {
    it("should handle multiple login/logout cycles", () => {
      const cycles = 5;

      for (let i = 0; i < cycles; i++) {
        cy.cleanupEtendo();
        cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
        cy.verifyEtendoInterface();
        cy.log(`Login/Logout cycle ${i + 1}/${cycles} completed`);
      }
    });

    it("should handle repeated failed login attempts gracefully", () => {
      cy.cleanupEtendo();
      const attempts = 10;

      for (let i = 0; i < attempts; i++) {
        cy.visit("/");
        cy.get("#username", { timeout: 10000 }).should("be.visible");
        cy.get("#username").clear().type(`invalid_user_${i}`);
        cy.get("#password").clear().type(`invalid_pass_${i}`);
        cy.contains("button", "Log In").click();
        cy.wait(1000);
        cy.log(`Failed login attempt ${i + 1}/${attempts}`);
      }

      cy.get("body").should("be.visible");
      cy.log("Application remained stable after repeated failed logins");
    });
  });

  describe("Memory and Resource Stress", () => {
    it.skip("should not exhibit excessive memory growth during navigation", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const memoryInfo = win.performance.memory;
        if (!memoryInfo) {
          cy.log("Performance.memory API not available (non-Chrome browser), skipping");
          return;
        }

        const initialHeap = memoryInfo.usedJSHeapSize;
        cy.log(`Initial heap: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);

        const navIterations = 10;
        for (let i = 0; i < navIterations; i++) {
          cy.visit("/");
          cy.get("body", { timeout: 15000 }).should("be.visible");
        }

        cy.window().then((w) => {
          const finalMemory = w.performance.memory;
          if (finalMemory) {
            const finalHeap = finalMemory.usedJSHeapSize;
            const growth = finalHeap - initialHeap;
            const growthMB = growth / 1024 / 1024;

            cy.log(`Final heap: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
            cy.log(`Heap growth: ${growthMB.toFixed(2)} MB`);

            expect(finalHeap).to.be.lessThan(initialHeap * 3);
          }
        });
      });
    });

    it("should handle many DOM queries without degradation", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      const queryCount = 100;
      const startTime = Date.now();

      for (let i = 0; i < queryCount; i++) {
        cy.get("body").should("exist");
      }

      cy.then(() => {
        const elapsed = Date.now() - startTime;
        cy.log(`${queryCount} DOM queries completed in ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(30000);
      });
    });
  });

  describe("Concurrent Actions Stress", () => {
    it("should handle search while page is still rendering", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input', { timeout: 15000 }).should("be.visible");
      cy.get('[data-testid="drawer-search-input"] input').type("sales", { delay: 0 });
      cy.get("body").should("be.visible");

      cy.get('[data-testid="drawer-search-input"] input').clear().type("purchase", { delay: 0 });
      cy.get("body").should("be.visible");

      cy.get('[data-testid="drawer-search-input"] input').clear().type("product", { delay: 0 });
      cy.get("body").should("be.visible");

      cy.log("Application handled concurrent search/render operations");
    });

    it("should handle rapid keyboard events", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.openDrawer();

      cy.get('[data-testid="drawer-search-input"] input', { timeout: 10000 }).should("be.visible");

      cy.get('[data-testid="drawer-search-input"] input')
        .type("abcdefghijklmnopqrstuvwxyz", { delay: 0 })
        .clear()
        .type("1234567890", { delay: 0 })
        .clear()
        .type("{enter}{esc}", { delay: 0 });

      cy.get("body").should("be.visible");
      cy.log("Application handled rapid keyboard events without crash");
    });
  });

  describe("Error Recovery Stress", () => {
    it("should recover after visiting a non-existent route", () => {
      cy.visit("/non-existent-route-12345", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.log("Application recovered from 404 route");
    });

    it("should remain stable after multiple 404 navigations", () => {
      const badRoutes = ["/fake-page-1", "/fake-page-2", "/fake-page-3", "/another-bad-route", "/does-not-exist"];

      badRoutes.forEach((route, index) => {
        cy.visit(route, { failOnStatusCode: false });
        cy.get("body", { timeout: 15000 }).should("be.visible");
        cy.log(`404 recovery ${index + 1}/${badRoutes.length}`);
      });

      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.log("Application stable after multiple 404 navigations");
    });
  });
});
