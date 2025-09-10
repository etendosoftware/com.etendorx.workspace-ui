/**
 * Simple tests for copilot functionality via /api/erp
 * Verifies that copilot endpoints are correctly configured
 */

import { COPILOT_ENDPOINTS } from "@workspaceui/api-client/src/api/copilot/constants";

describe("Copilot endpoints configuration", () => {
  it("should have correct copilot endpoint paths", () => {
    expect(COPILOT_ENDPOINTS.GET_ASSISTANTS).toBe("copilot/assistants");
    expect(COPILOT_ENDPOINTS.GET_LABELS).toBe("copilot/labels");
    expect(COPILOT_ENDPOINTS.SEND_QUESTION).toBe("copilot/question");
    expect(COPILOT_ENDPOINTS.SEND_AQUESTION).toBe("copilot/aquestion");
    expect(COPILOT_ENDPOINTS.UPLOAD_FILE).toBe("copilot/file");
    expect(COPILOT_ENDPOINTS.CACHE_QUESTION).toBe("copilot/cacheQuestion");
  });

  it("should construct correct API URLs when using /api/erp proxy", () => {
    const baseUrl = "http://localhost:3000/api/erp";
    
    // Test that paths are constructed correctly
    const assistantsUrl = `${baseUrl}/${COPILOT_ENDPOINTS.GET_ASSISTANTS}`;
    const labelsUrl = `${baseUrl}/${COPILOT_ENDPOINTS.GET_LABELS}`;
    
    expect(assistantsUrl).toBe("http://localhost:3000/api/erp/copilot/assistants");
    expect(labelsUrl).toBe("http://localhost:3000/api/erp/copilot/labels");
  });

  it("should maintain copilot/ prefix in all endpoints", () => {
    const endpoints = Object.values(COPILOT_ENDPOINTS);
    
    endpoints.forEach(endpoint => {
      expect(endpoint).toMatch(/^copilot\//);
    });
  });
});