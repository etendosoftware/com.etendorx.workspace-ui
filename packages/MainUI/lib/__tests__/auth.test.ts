import { extractBearerToken } from "../auth";

describe("auth utilities", () => {
  describe("extractBearerToken", () => {
    it("should extract token from Authorization header", () => {
      const mockRequest = {
        headers: new Headers({
          Authorization: "Bearer test-token-123",
        }),
        url: "http://localhost:3000/api/test",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBe("test-token-123");
    });

    it("should return null when Authorization header is missing", () => {
      const mockRequest = {
        headers: new Headers(),
        url: "http://localhost:3000/api/test",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBeNull();
    });

    it("should return null when Authorization header does not start with Bearer", () => {
      const mockRequest = {
        headers: new Headers({
          Authorization: "Basic dXNlcjpwYXNz",
        }),
        url: "http://localhost:3000/api/test",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBeNull();
    });

    it("should extract token from query parameter when header is missing", () => {
      const mockRequest = {
        headers: new Headers(),
        url: "http://localhost:3000/api/test?token=query-token-456",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBe("query-token-456");
    });

    it("should prefer Authorization header over query parameter", () => {
      const mockRequest = {
        headers: new Headers({
          Authorization: "Bearer header-token",
        }),
        url: "http://localhost:3000/api/test?token=query-token",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBe("header-token");
    });

    it("should handle URL with multiple query parameters", () => {
      const mockRequest = {
        headers: new Headers(),
        url: "http://localhost:3000/api/test?foo=bar&token=multi-token&baz=qux",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBe("multi-token");
    });

    it("should return null when neither header nor query param has token", () => {
      const mockRequest = {
        headers: new Headers(),
        url: "http://localhost:3000/api/test?foo=bar",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBeNull();
    });

    it("should handle invalid URL gracefully", () => {
      const mockRequest = {
        headers: new Headers(),
        url: "not-a-valid-url",
      } as Request;

      const token = extractBearerToken(mockRequest);

      expect(token).toBeNull();
    });
  });
});
