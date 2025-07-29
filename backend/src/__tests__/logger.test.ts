import { logger } from "../utils/logger";

describe("Logger", () => {
  it("should export a logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should be able to log messages without throwing errors", () => {
    expect(() => {
      logger.info("Test info message");
      logger.error("Test error message");
      logger.warn("Test warning message");
      logger.debug("Test debug message");
    }).not.toThrow();
  });

  it("should handle structured logging", () => {
    expect(() => {
      logger.info("Test message with metadata", {
        userId: 123,
        action: "test",
      });
    }).not.toThrow();
  });

  it("should handle error objects", () => {
    const testError = new Error("Test error");
    expect(() => {
      logger.error("Error occurred:", testError);
    }).not.toThrow();
  });
});
