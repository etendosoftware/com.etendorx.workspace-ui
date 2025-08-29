/**
 * Integration-like test: Authorization header propagation on save.
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

describe("Save: Authorization propagation", () => {
  const { setup, cleanup } = useDatasourceTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it("forwards Authorization unchanged", async () => {
    const BEARER_TOKEN = DatasourceTestData.tokens.standard;

    const response = await executeTestScenario({
      bearerToken: BEARER_TOKEN,
      payload: testData.defaultPayload,
      url: testData.urls.order,
      entity: "Order",
    });

    DatasourceTestAssertions.assertResponseStatus(response);

    DatasourceTestAssertions.assertFetchCallWasMade(DatasourceTestData.createErpForwardUrl("Order"), "POST", {
      Authorization: `Bearer ${BEARER_TOKEN}`,
    });
  });
});
