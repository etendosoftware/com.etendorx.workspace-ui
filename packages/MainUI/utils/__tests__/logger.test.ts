/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Logger, type ILogger } from "../logger";

describe("Logger", () => {
  // ============================================================================
  // Test Fixtures
  // ============================================================================

  const createMockImplementation = (): jest.Mocked<ILogger> => ({
    debug: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });

  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe("constructor", () => {
    it("should create logger with implementation", () => {
      const mockImpl = createMockImplementation();
      const logger = new Logger(mockImpl);

      expect(logger).toBeInstanceOf(Logger);
    });
  });

  // ============================================================================
  // Debug Logs Disabled by Default
  // ============================================================================

  describe("debug logs disabled (default)", () => {
    let mockImpl: jest.Mocked<ILogger>;
    let logger: Logger;

    beforeEach(() => {
      mockImpl = createMockImplementation();
      logger = new Logger(mockImpl);
    });

    it.each([
      { method: "debug" as const, args: ["debug message"] },
      { method: "info" as const, args: ["info message"] },
      { method: "log" as const, args: ["log message"] },
    ])("should NOT call implementation.$method when debug is disabled", ({ method, args }) => {
      logger[method](...args);
      expect(mockImpl[method]).not.toHaveBeenCalled();
    });

    it.each([
      { method: "warn" as const, args: ["warning message"] },
      { method: "error" as const, args: ["error message"] },
    ])("should ALWAYS call implementation.$method", ({ method, args }) => {
      logger[method](...args);
      expect(mockImpl[method]).toHaveBeenCalledWith(...args);
    });
  });

  // ============================================================================
  // Warnings and Errors Always Enabled
  // ============================================================================

  describe("warn and error methods", () => {
    let mockImpl: jest.Mocked<ILogger>;
    let logger: Logger;

    beforeEach(() => {
      mockImpl = createMockImplementation();
      logger = new Logger(mockImpl);
    });

    it("should pass all arguments to warn", () => {
      logger.warn("message", { data: 123 }, "extra");
      expect(mockImpl.warn).toHaveBeenCalledWith("message", { data: 123 }, "extra");
    });

    it("should pass all arguments to error", () => {
      const error = new Error("test error");
      logger.error("error occurred", error);
      expect(mockImpl.error).toHaveBeenCalledWith("error occurred", error);
    });

    it("should handle no arguments", () => {
      logger.warn();
      logger.error();
      expect(mockImpl.warn).toHaveBeenCalledWith();
      expect(mockImpl.error).toHaveBeenCalledWith();
    });
  });

  // ============================================================================
  // Multiple Arguments Handling
  // ============================================================================

  describe("multiple arguments handling", () => {
    it("should pass multiple arguments to warn", () => {
      const mockImpl = createMockImplementation();
      const logger = new Logger(mockImpl);

      logger.warn(1, "two", { three: 3 }, [4], null, undefined);

      expect(mockImpl.warn).toHaveBeenCalledWith(1, "two", { three: 3 }, [4], null, undefined);
    });

    it("should pass multiple arguments to error", () => {
      const mockImpl = createMockImplementation();
      const logger = new Logger(mockImpl);

      const err = new Error("test");
      logger.error("prefix", err, { context: "test" });

      expect(mockImpl.error).toHaveBeenCalledWith("prefix", err, { context: "test" });
    });
  });

  // ============================================================================
  // ILogger Interface Compliance
  // ============================================================================

  describe("ILogger interface compliance", () => {
    it("should implement all ILogger methods", () => {
      const mockImpl = createMockImplementation();
      const logger = new Logger(mockImpl);

      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.log).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });
});
