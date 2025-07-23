import { storage } from "../storage";
import { circuitBreakerService } from "./circuitBreaker";

export class FailureSimulator {
  private activeFailures: Map<string, NodeJS.Timeout> = new Map();

  async simulateNetworkLatency(serviceName?: string, duration: number = 30000): Promise<void> {
    const targetService = serviceName || "external-api";
    
    await storage.createLog({
      level: "warn",
      source: "failure-simulator",
      message: `Simulating network latency for ${targetService}`,
      metadata: { serviceName: targetService, duration, type: "network-latency" }
    });

    // Increase response times for the service
    const latencyInterval = setInterval(async () => {
      await storage.createMetric({
        serviceName: targetService,
        requestCount: 1,
        errorCount: 0,
        responseTime: Math.floor(Math.random() * 2000) + 1000, // 1-3 seconds
        cpuUsage: Math.floor(Math.random() * 20) + 40,
        memoryUsage: Math.floor(Math.random() * 30) + 50
      });
    }, 1000);

    this.activeFailures.set(`${targetService}-latency`, setTimeout(() => {
      clearInterval(latencyInterval);
      this.activeFailures.delete(`${targetService}-latency`);
      
      storage.createLog({
        level: "info",
        source: "failure-simulator",
        message: `Network latency simulation ended for ${targetService}`,
        metadata: { serviceName: targetService, type: "network-latency" }
      });
    }, duration));
  }

  async simulateServiceFailure(serviceName?: string, duration: number = 60000): Promise<void> {
    const targetService = serviceName || "external-api";
    const service = await storage.getServiceByName(targetService);
    
    if (service) {
      // Mark service as unhealthy
      await storage.updateService(service.id, { status: "unhealthy", load: 0 });
      
      await storage.createLog({
        level: "error",
        source: "failure-simulator",
        message: `Simulating complete failure for ${targetService}`,
        metadata: { serviceName: targetService, duration, type: "service-failure" }
      });

      // Generate failure metrics
      const failureInterval = setInterval(async () => {
        await storage.createMetric({
          serviceName: targetService,
          requestCount: 1,
          errorCount: 1,
          responseTime: 0,
          cpuUsage: 0,
          memoryUsage: 0
        });

        // Trigger circuit breaker
        await circuitBreakerService.recordFailure(targetService);
      }, 500);

      this.activeFailures.set(`${targetService}-failure`, setTimeout(async () => {
        clearInterval(failureInterval);
        this.activeFailures.delete(`${targetService}-failure`);
        
        // Restore service
        await storage.updateService(service.id, { status: "healthy", load: 25 });
        
        await storage.createLog({
          level: "info",
          source: "failure-simulator",
          message: `Service failure simulation ended for ${targetService}`,
          metadata: { serviceName: targetService, type: "service-failure" }
        });
      }, duration));
    }
  }

  async simulateDatabaseOverload(duration: number = 45000): Promise<void> {
    await storage.createLog({
      level: "warn",
      source: "failure-simulator",
      message: "Simulating database overload affecting all shards",
      metadata: { duration, type: "database-overload" }
    });

    // Increase load on all shards
    const shards = await storage.getAllShards();
    
    const overloadInterval = setInterval(async () => {
      for (const shard of shards) {
        const newLoad = Math.min(100, shard.load + Math.floor(Math.random() * 30) + 20);
        await storage.updateShard(shard.id, { 
          load: newLoad,
          status: newLoad > 85 ? "degraded" : "healthy"
        });
      }
    }, 2000);

    this.activeFailures.set("database-overload", setTimeout(async () => {
      clearInterval(overloadInterval);
      this.activeFailures.delete("database-overload");
      
      // Restore normal shard loads
      for (const shard of shards) {
        await storage.updateShard(shard.id, { 
          load: Math.floor(Math.random() * 40) + 30,
          status: "healthy"
        });
      }
      
      await storage.createLog({
        level: "info",
        source: "failure-simulator",
        message: "Database overload simulation ended",
        metadata: { type: "database-overload" }
      });
    }, duration));
  }

  async simulateMemoryLeak(serviceName?: string, duration: number = 90000): Promise<void> {
    const targetService = serviceName || "user-service";
    
    await storage.createLog({
      level: "warn",
      source: "failure-simulator",
      message: `Simulating memory leak for ${targetService}`,
      metadata: { serviceName: targetService, duration, type: "memory-leak" }
    });

    let memoryUsage = 30;
    const leakInterval = setInterval(async () => {
      memoryUsage = Math.min(95, memoryUsage + Math.floor(Math.random() * 5) + 2);
      
      await storage.createMetric({
        serviceName: targetService,
        requestCount: 1,
        errorCount: memoryUsage > 85 ? 1 : 0,
        responseTime: Math.floor(memoryUsage * 2) + 100,
        cpuUsage: Math.min(80, memoryUsage + 10),
        memoryUsage
      });

      if (memoryUsage > 85) {
        await circuitBreakerService.recordFailure(targetService);
      }
    }, 3000);

    this.activeFailures.set(`${targetService}-memory-leak`, setTimeout(() => {
      clearInterval(leakInterval);
      this.activeFailures.delete(`${targetService}-memory-leak`);
      
      storage.createLog({
        level: "info",
        source: "failure-simulator",
        message: `Memory leak simulation ended for ${targetService}`,
        metadata: { serviceName: targetService, type: "memory-leak" }
      });
    }, duration));
  }

  async stopAllSimulations(): Promise<void> {
    this.activeFailures.forEach((timeout, key) => {
      clearTimeout(timeout);
    });
    this.activeFailures.clear();
    
    await storage.createLog({
      level: "info",
      source: "failure-simulator",
      message: "All failure simulations stopped",
      metadata: { type: "stop-all" }
    });
  }

  getActiveFailures(): string[] {
    return Array.from(this.activeFailures.keys());
  }
}

export const failureSimulator = new FailureSimulator();
