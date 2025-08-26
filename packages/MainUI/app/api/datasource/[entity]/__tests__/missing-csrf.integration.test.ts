/**
 * Integration-like test: Save without csrfToken should not set X-CSRF-Token nor csrfToken form field.
 */

// Import shared mocks to avoid duplicating jest.mock declarations
import "../../../_test-utils/test-shared-mocks";

import {
  useDatasourceTestEnvironment,
  executeTestScenario,
  DatasourceTestAssertions,
  DatasourceTestData,
  testData,
} from "../../../_test-utils/datasource-integration-commons";

describe("Save without csrfToken", () => {
  const { setup, cleanup } = useDatasourceTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it("omits CSRF header and field when csrfToken is absent", async () => {
    const BEARER_TOKEN = DatasourceTestData.tokens.noCsrf;
    
    // Create payload without CSRF token
    const payloadWithoutCsrf = DatasourceTestData.payloads.createStandard(false);

    const response = await executeTestScenario({
      bearerToken: BEARER_TOKEN,
      payload: payloadWithoutCsrf,
      url: testData.urls.simple,
      entity: "Invoice",
    });

    DatasourceTestAssertions.assertResponseStatus(response);

    DatasourceTestAssertions.assertFetchCallWasMade(
      DatasourceTestData.createErpForwardUrl("Invoice", 1, 2),
      "POST",
      {
        Authorization: "Bearer Bearer-Token-NoCSRF",
        "X-CSRF-Token": undefined,
      }
    );

    // Verify that the body does not contain csrfToken
    DatasourceTestAssertions.assertRequestBodyContent(
      undefined,
      "csrfToken"
    );
  });
});
