import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadBalancer } from "./services/loadBalancer";
import { circuitBreakerService } from "./services/circuitBreaker";
import { serviceRegistry } from "./services/serviceRegistry";
import { loadSimulator } from "./services/loadSimulator";
import { failureSimulator } from "./services/failureSimulator";
import { metricsCollector } from "./services/metricsCollector";
import { insertServiceSchema, insertCircuitBreakerSchema, insertLoadTestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await metricsCollector.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // System overview endpoint
  app.get("/api/overview", async (req, res) => {
    try {
      const overview = await metricsCollector.getSystemOverview();
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system overview" });
    }
  });

  // Service management endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  // Scaling endpoints
  app.post("/api/services/:serviceName/scale-up", async (req, res) => {
    try {
      const { serviceName } = req.params;
      await serviceRegistry.scaleUp(serviceName);
      res.json({ message: `Scaled up ${serviceName}` });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/services/:serviceName/scale-down", async (req, res) => {
    try {
      const { serviceName } = req.params;
      await serviceRegistry.scaleDown(serviceName);
      res.json({ message: `Scaled down ${serviceName}` });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Circuit breaker endpoints
  app.get("/api/circuit-breakers", async (req, res) => {
    try {
      const metrics = await circuitBreakerService.getCircuitBreakerMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch circuit breaker metrics" });
    }
  });

  app.post("/api/circuit-breakers/:serviceName/reset", async (req, res) => {
    try {
      const { serviceName } = req.params;
      await circuitBreakerService.resetCircuitBreaker(serviceName);
      res.json({ message: `Reset circuit breaker for ${serviceName}` });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/circuit-breakers/reset-all", async (req, res) => {
    try {
      await circuitBreakerService.resetAllCircuitBreakers();
      res.json({ message: "Reset all circuit breakers" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset circuit breakers" });
    }
  });

  // Load testing endpoints
  app.get("/api/load-test", async (req, res) => {
    try {
      const metrics = await loadSimulator.getLoadTestMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch load test metrics" });
    }
  });

  app.post("/api/load-test/start", async (req, res) => {
    try {
      const { concurrentUsers, requestsPerSecond, duration } = req.body;
      await loadSimulator.startLoadTest(
        parseInt(concurrentUsers) || 100,
        parseInt(requestsPerSecond) || 10,
        parseInt(duration) || 60
      );
      res.json({ message: "Load test started" });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/load-test/stop", async (req, res) => {
    try {
      await loadSimulator.stopLoadTest();
      res.json({ message: "Load test stopped" });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Failure simulation endpoints
  app.post("/api/simulate/network-latency", async (req, res) => {
    try {
      const { serviceName, duration } = req.body;
      await failureSimulator.simulateNetworkLatency(serviceName, duration);
      res.json({ message: "Network latency simulation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start network latency simulation" });
    }
  });

  app.post("/api/simulate/service-failure", async (req, res) => {
    try {
      const { serviceName, duration } = req.body;
      await failureSimulator.simulateServiceFailure(serviceName, duration);
      res.json({ message: "Service failure simulation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start service failure simulation" });
    }
  });

  app.post("/api/simulate/database-overload", async (req, res) => {
    try {
      const { duration } = req.body;
      await failureSimulator.simulateDatabaseOverload(duration);
      res.json({ message: "Database overload simulation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start database overload simulation" });
    }
  });

  app.post("/api/simulate/memory-leak", async (req, res) => {
    try {
      const { serviceName, duration } = req.body;
      await failureSimulator.simulateMemoryLeak(serviceName, duration);
      res.json({ message: "Memory leak simulation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start memory leak simulation" });
    }
  });

  app.post("/api/simulate/stop-all", async (req, res) => {
    try {
      await failureSimulator.stopAllSimulations();
      res.json({ message: "All simulations stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop simulations" });
    }
  });

  // Shard management endpoints
  app.get("/api/shards", async (req, res) => {
    try {
      const shards = await storage.getAllShards();
      res.json(shards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shards" });
    }
  });

  // Logs endpoints
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getRecentLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ message: "Logs cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const metrics = await loadBalancer.getLoadBalancerMetrics();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: metrics.healthyServices,
        totalServices: metrics.totalServices
      });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", message: "Health check failed" });
    }
  });

  const httpServer = createServer(app);

  // Start background services
  serviceRegistry.startAutoScaling();
  metricsCollector.startMetricsCollection();

  return httpServer;
}
