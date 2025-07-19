import { Server } from "socket.io";
import { logger } from "../utils/logger";

export class SocketManager {
  private io: Server;
  private connectedClients: Set<string> = new Set();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send current connected clients count
      this.io.emit("clientCount", this.connectedClients.size);

      socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        this.io.emit("clientCount", this.connectedClients.size);
      });

      socket.on("joinRoom", (room: string) => {
        socket.join(room);
        logger.info(`Client ${socket.id} joined room: ${room}`);
      });

      socket.on("leaveRoom", (room: string) => {
        socket.leave(room);
        logger.info(`Client ${socket.id} left room: ${room}`);
      });
    });
  }

  // Broadcast real-time analytics data
  public broadcastAnalyticsUpdate(data: any): void {
    this.io.emit("analyticsUpdate", {
      timestamp: new Date().toISOString(),
      data,
    });
  }

  // Broadcast performance metrics
  public broadcastPerformanceUpdate(metrics: any): void {
    this.io.emit("performanceUpdate", {
      timestamp: new Date().toISOString(),
      metrics,
    });
  }

  // Broadcast new query event
  public broadcastNewQuery(queryData: any): void {
    this.io.emit("newQuery", {
      timestamp: new Date().toISOString(),
      query: queryData,
    });
  }

  // Send alert to all connected clients
  public broadcastAlert(alert: {
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
  }): void {
    this.io.emit("systemAlert", {
      timestamp: new Date().toISOString(),
      ...alert,
    });
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
