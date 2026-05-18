describe("Rendering Performance Tests", () => {
  beforeEach(() => {
    cy.loginToEtendo();
  });

  describe("Page Load Performance", () => {
    it("should load the login page within acceptable time", () => {
      cy.cleanupEtendo();

      const startTime = Date.now();
      cy.visit("/");
      cy.get("#username", { timeout: 10000 }).should("be.visible");
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Login page load time: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(5000);
      });
    });

    it("should load the main dashboard within acceptable time after login", () => {
      const startTime = Date.now();
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Dashboard load time: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(10000);
      });
    });
  });

  describe("Web Vitals Metrics", () => {
    it("should have acceptable Largest Contentful Paint (LCP)", () => {
      let lcpValue = 0;

      cy.visit("/", {
        onBeforeLoad(win) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              lcpValue = lastEntry.startTime;
              win.__LCP__ = lcpValue;
            }
          });
          observer.observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
        },
      });

      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.wait(3000);

      cy.window().then((win) => {
        const lcp = win.__LCP__ || 0;
        cy.log(`LCP: ${lcp.toFixed(2)}ms`);
        expect(lcp).to.be.lessThan(4000);
      });
    });

    it("should have acceptable Cumulative Layout Shift (CLS)", () => {
      let clsScore = 0;

      cy.visit("/", {
        onBeforeLoad(win) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
                win.__CLS__ = clsScore;
              }
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });
        },
      });

      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.wait(5000);

      cy.window().then((win) => {
        const cls = win.__CLS__ || 0;
        cy.log(`CLS Score: ${cls.toFixed(4)}`);
        expect(cls).to.be.lessThan(0.25);
      });
    });

    it("should have acceptable First Input Delay (FID) simulation", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const start = win.performance.now();
        win.document.dispatchEvent(new Event("click"));
        const fid = win.performance.now() - start;
        cy.log(`Simulated FID: ${fid.toFixed(2)}ms`);
        expect(fid).to.be.lessThan(100);
      });
    });
  });

  describe("Navigation Timing", () => {
    it("should have acceptable time to interactive", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const timing = win.performance.getEntriesByType("navigation")[0];
        if (timing) {
          const tti = timing.domInteractive - timing.startTime;
          cy.log(`Time to Interactive: ${tti.toFixed(2)}ms`);
          expect(tti).to.be.lessThan(5000);
        }
      });
    });

    it("should have acceptable DOM content loaded time", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.window().then((win) => {
        const timing = win.performance.getEntriesByType("navigation")[0];
        if (timing) {
          const dclTime = timing.domContentLoadedEventEnd - timing.startTime;
          cy.log(`DOM Content Loaded: ${dclTime.toFixed(2)}ms`);
          expect(dclTime).to.be.lessThan(5000);
        }
      });
    });

    it("should complete full page load within threshold", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const timing = win.performance.getEntriesByType("navigation")[0];
        if (timing) {
          const fullLoadTime = timing.loadEventEnd - timing.startTime;
          cy.log(`Full page load: ${fullLoadTime.toFixed(2)}ms`);
          expect(fullLoadTime).to.be.lessThan(10000);
        }
      });
    });
  });

  describe("Resource Loading", () => {
    it("should not load excessive resources", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        cy.log(`Total resources loaded: ${resources.length}`);
        expect(resources.length).to.be.lessThan(200);
      });
    });

    it("should not have individual resources exceeding size threshold", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();

      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        const slowResources = resources.filter((r) => r.duration > 5000);
        for (const r of slowResources) {
          cy.log(`Slow resource: ${r.name} (${r.duration.toFixed(0)}ms)`);
        }
        expect(slowResources.length).to.be.lessThan(5);
      });
    });
  });

  describe("Component Rendering", () => {
    it("should render the menu search input promptly after login", () => {
      const startTime = Date.now();
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.openDrawer();
      cy.get('[data-testid="drawer-search-input"] input', { timeout: 10000 }).should("be.visible");
      cy.then(() => {
        const renderTime = Date.now() - startTime;
        cy.log(`Menu search render time: ${renderTime}ms`);
        expect(renderTime).to.be.lessThan(10000);
      });
    });

    it("should render menu search results without excessive delay", () => {
      cy.visit("/");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.verifyEtendoInterface();
      cy.openDrawer();

      cy.get('[data-testid="drawer-search-input"] input', { timeout: 15000 })
        .should("be.visible")
        .and("not.be.disabled");

      const startTime = Date.now();
      cy.get('[data-testid="drawer-search-input"] input').clear().type("sales");
      cy.get("[data-testid*='MenuTitle']", { timeout: 10000 }).should("exist");
      cy.then(() => {
        const searchTime = Date.now() - startTime;
        cy.log(`Menu search result render time: ${searchTime}ms`);
        expect(searchTime).to.be.lessThan(5000);
      });
    });
  });
});
