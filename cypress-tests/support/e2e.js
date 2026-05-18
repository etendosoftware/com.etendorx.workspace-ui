import "./commands.js";
import "cypress-real-events/support";

Cypress.on("uncaught:exception", (err, runnable) => {
  if (err.message.includes("ResizeObserver loop limit exceeded")) {
    return false;
  }
  if (err.message.includes("Non-Error promise rejection captured")) {
    return false;
  }
  if (err.message.includes("Hydration failed")) {
    return false;
  }
  if (
    err.message.includes("Minified React error") ||
    err.message.includes("removeChild") ||
    err.message.includes("Failed to execute")
  ) {
    return false;
  }
  return true;
});

beforeEach(() => {
  cy.viewport(1280, 720);

  const apiLog = [];

  cy.intercept("**/api/**", (req) => {
    const entry = {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    };

    req.continue((res) => {
      entry.status = res.statusCode;
      entry.duration = `${Date.now() - new Date(entry.timestamp).getTime()}ms`;
      entry.bodyLength = JSON.stringify(res.body || "").length;

      if (res.statusCode >= 400) {
        entry.responsePreview = JSON.stringify(res.body).substring(0, 500);
      }

      apiLog.push(entry);
    });
  }).as("apiTracker");

  cy.wrap(apiLog).as("__apiLog");
});

afterEach(function () {
  if (this.currentTest?.state === "failed") {
    const log = this.__apiLog || [];
    if (log.length > 0) {
      cy.task("log", "\n========== API CALLS LOG (last 30) ==========", { log: false }).then(() => {
        const recent = log.slice(-30);
        recent.forEach((entry) => {
          const line = `[${entry.timestamp}] ${entry.method} ${entry.status || "?"} ${entry.duration || "?"} (${entry.bodyLength || 0}B) ${entry.url}`;
          cy.task("log", line, { log: false });
          if (entry.responsePreview) {
            cy.task("log", `  ERROR RESPONSE: ${entry.responsePreview}`, { log: false });
          }
        });
        cy.task("log", "========== END API LOG ==========\n", { log: false });
      });
    }
  }
});
