// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      json: async () => data,
      headers: new Map(Object.entries(init?.headers || {})),
      status: 200,
      ok: true,
    }),
  },
}));

import { GET } from "../route";

describe("/api/config endpoint", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return ETENDO_CLASSIC_HOST when set", async () => {
    process.env.ETENDO_CLASSIC_HOST = "http://localhost:8080/etendo1";
    process.env.ETENDO_CLASSIC_URL = "http://host.docker.internal:8080/etendo1";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      etendoClassicHost: "http://localhost:8080/etendo1",
    });
  });

  it("should fallback to ETENDO_CLASSIC_URL when ETENDO_CLASSIC_HOST is not set", async () => {
    delete process.env.ETENDO_CLASSIC_HOST;
    process.env.ETENDO_CLASSIC_URL = "http://host.docker.internal:8080/etendo";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      etendoClassicHost: "http://host.docker.internal:8080/etendo",
    });
  });

  it("should return empty string when neither variable is set", async () => {
    delete process.env.ETENDO_CLASSIC_HOST;
    delete process.env.ETENDO_CLASSIC_URL;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      etendoClassicHost: "",
    });
  });

  it("should return correct Cache-Control header in production mode", async () => {
    process.env.DEBUG_MODE = "false";
    process.env.ETENDO_CLASSIC_HOST = "http://localhost:8080/etendo";

    const response = await GET();
    const headers = response.headers as Map<string, string>;
    const cacheControl = headers.get("Cache-Control");

    expect(cacheControl).toBe("public, max-age=300, s-maxage=300");
  });

  it("should return no-cache headers in debug mode", async () => {
    process.env.DEBUG_MODE = "true";
    process.env.ETENDO_CLASSIC_HOST = "http://localhost:8080/etendo";

    const response = await GET();
    const headers = response.headers as Map<string, string>;
    const cacheControl = headers.get("Cache-Control");

    expect(cacheControl).toBe("no-store, no-cache, must-revalidate, max-age=0");
  });

  it("should prefer ETENDO_CLASSIC_HOST over ETENDO_CLASSIC_URL", async () => {
    process.env.ETENDO_CLASSIC_HOST = "http://localhost:8080/etendo1";
    process.env.ETENDO_CLASSIC_URL = "http://host.docker.internal:8080/etendo";

    const response = await GET();
    const data = await response.json();

    expect(data.etendoClassicHost).toBe("http://localhost:8080/etendo1");
    expect(data.etendoClassicHost).not.toBe("http://host.docker.internal:8080/etendo");
  });
});
