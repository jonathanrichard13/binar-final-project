import { SocketManager } from "../services/socketManager";
import { Server } from "socket.io";
import { logger } from "../utils/logger";

// Mock socket.io and logger
jest.mock("socket.io");
jest.mock("../utils/logger");

const mockLogger = logger as jest.Mocked<typeof logger>;

describe("SocketManager", () => {
  let mockIo: jest.Mocked<Server>;
  let mockSocket: any;
  let socketManager: SocketManager;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      id: "socket123",
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // Create mock io
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Setup the connection event handler
    mockIo.on.mockImplementation((event, handler) => {
      if (event === "connection") {
        // Store the handler for later use
        (mockIo as any).connectionHandler = handler;
      }
      return mockIo;
    });

    socketManager = new SocketManager(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize and setup event handlers", () => {
      expect(mockIo.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function)
      );
    });
  });

  describe("connection handling", () => {
    it("should handle new client connection", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      connectionHandler(mockSocket);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Client connected: socket123"
      );
      expect(mockIo.emit).toHaveBeenCalledWith("clientCount", 1);
      expect(mockSocket.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "joinRoom",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "leaveRoom",
        expect.any(Function)
      );
    });

    it("should handle client disconnect", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      // Connect a client first
      connectionHandler(mockSocket);

      // Get the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "disconnect"
      )[1];

      // Clear previous calls
      jest.clearAllMocks();

      // Trigger disconnect
      disconnectHandler();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Client disconnected: socket123"
      );
      expect(mockIo.emit).toHaveBeenCalledWith("clientCount", 0);
    });

    it("should handle join room event", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      connectionHandler(mockSocket);

      // Get the joinRoom handler
      const joinRoomHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "joinRoom"
      )[1];

      joinRoomHandler("analytics-room");

      expect(mockSocket.join).toHaveBeenCalledWith("analytics-room");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Client socket123 joined room: analytics-room"
      );
    });

    it("should handle leave room event", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      connectionHandler(mockSocket);

      // Get the leaveRoom handler
      const leaveRoomHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "leaveRoom"
      )[1];

      leaveRoomHandler("analytics-room");

      expect(mockSocket.leave).toHaveBeenCalledWith("analytics-room");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Client socket123 left room: analytics-room"
      );
    });
  });

  describe("broadcastAnalyticsUpdate", () => {
    it("should broadcast analytics update to all clients", () => {
      const testData = { totalQueries: 100, successRate: 95 };

      socketManager.broadcastAnalyticsUpdate(testData);

      expect(mockIo.emit).toHaveBeenCalledWith("analyticsUpdate", {
        timestamp: expect.any(String),
        data: testData,
      });
    });
  });

  describe("broadcastPerformanceUpdate", () => {
    it("should broadcast performance update to all clients", () => {
      const testMetrics = { avgResponseTime: 250, errorRate: 2 };

      socketManager.broadcastPerformanceUpdate(testMetrics);

      expect(mockIo.emit).toHaveBeenCalledWith("performanceUpdate", {
        timestamp: expect.any(String),
        metrics: testMetrics,
      });
    });
  });

  describe("broadcastAlert", () => {
    it("should broadcast system alert to all clients", () => {
      const testAlert = {
        type: "high_error_rate",
        severity: "high" as const,
        message: "Error rate exceeded threshold",
      };

      socketManager.broadcastAlert(testAlert);

      expect(mockIo.emit).toHaveBeenCalledWith("systemAlert", {
        timestamp: expect.any(String),
        type: testAlert.type,
        severity: testAlert.severity,
        message: testAlert.message,
      });
    });
  });

  describe("broadcastNewQuery", () => {
    it("should broadcast new query event to all clients", () => {
      const testQuery = {
        queryText: "How to reset password?",
        status: "success",
        processingTime: 150,
      };

      socketManager.broadcastNewQuery(testQuery);

      expect(mockIo.emit).toHaveBeenCalledWith("newQuery", {
        timestamp: expect.any(String),
        query: testQuery,
      });
    });
  });

  describe("getConnectedClientsCount", () => {
    it("should return the correct number of connected clients", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      // Connect two clients
      connectionHandler({
        id: "client1",
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      });
      connectionHandler({
        id: "client2",
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      });

      expect(socketManager.getConnectedClientsCount()).toBe(2);
    });

    it("should return 0 when no clients are connected", () => {
      expect(socketManager.getConnectedClientsCount()).toBe(0);
    });
  });

  describe("multiple client connections", () => {
    it("should track multiple clients correctly", () => {
      const connectionHandler = (mockIo as any).connectionHandler;

      const client1 = {
        id: "client1",
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };
      const client2 = {
        id: "client2",
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };
      const client3 = {
        id: "client3",
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };

      // Connect clients
      connectionHandler(client1);
      connectionHandler(client2);
      connectionHandler(client3);

      expect(socketManager.getConnectedClientsCount()).toBe(3);

      // Disconnect one client
      const disconnectHandler = client2.on.mock.calls.find(
        (call) => call[0] === "disconnect"
      )[1];
      disconnectHandler();

      expect(socketManager.getConnectedClientsCount()).toBe(2);
    });
  });
});
