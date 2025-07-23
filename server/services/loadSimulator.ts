import { storage } from "../storage";
import { loadBalancer } from "./loadBalancer";
import { circuitBreakerService } from "./circuitBreaker";

export class LoadSimulator {
  private isRunning = false;
  private currentTest: any = null;
  private intervals: NodeJS.Timeout[] = [];

  async startLoadTest(concurrentUsers: number, requestsPerSecond: number, duration: number): Promise<void> {
    if (this.isRunning) {
      throw new Error("Load test is already running");
    }

    // Create load test record
    const loadTest = await storage.createLoadTest({
      status: "running",
      concurrentUsers,
      requestsPerSecond,
      duration,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    });

    await storage.updateLoadTest(loadTest.id, { startTime: new Date() });
    this.currentTest = loadTest;
    this.isRunning = true;

    await storage.createLog({
      level: "info",
      source: "load-simulator",
      message: `Started load test with ${concurrentUsers} users, ${requestsPerSecond} RPS for ${duration}s`,
      metadata: { concurrentUsers, requestsPerSecond, duration }
    });

    // Simulate load by generating metrics
    const interval = setInterval(async () => {
      await this.simulateRequest();
    }, 1000 / requestsPerSecond);

    this.intervals.push(interval);

    // Stop after duration
    setTimeout(async () => {
      await this.stopLoadTest();
    }, duration * 1000);

    // Update service loads during test
    const loadUpdateInterval = setInterval(async () => {
      await this.updateServiceLoads();
    }, 2000);

    this.intervals.push(loadUpdateInterval);
  }

  async stopLoadTest(): Promise<void> {
    if (!this.isRunning || !this.currentTest) {
      return;
    }

    this.isRunning = false;
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Update load test record
    await storage.updateLoadTest(this.currentTest.id, {
      status: "completed",
      endTime: new Date()
    });

    await storage.createLog({
      level: "info",
      source: "load-simulator",
      message: `Load test completed. Total: ${this.currentTest.totalRequests}, Success: ${this.currentTest.successfulRequests}, Failed: ${this.currentTest.failedRequests}`,
      metadata: {
        totalRequests: this.currentTest.totalRequests,
        successfulRequests: this.currentTest.successfulRequests,
        failedRequests: this.currentTest.failedRequests
      }
    });

    this.currentTest = null;
  }

  private async simulateRequest(): Promise<void> {
    if (!this.isRunning || !this.currentTest) return;

    const services = await storage.getAllServices();
    const healthyServices = services.filter(s => s.status === "healthy");
    
    if (healthyServices.length === 0) return;

    const service = healthyServices[Math.floor(Math.random() * healthyServices.length)];
    const responseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
    const isSuccess = Math.random() > 0.05; // 95% success rate normally

    // Update load test counters
    const updatedTest = await storage.updateLoadTest(this.currentTest.id, {
      totalRequests: this.currentTest.totalRequests + 1,
      successfulRequests: isSuccess ? this.currentTest.successfulRequests + 1 : this.currentTest.successfulRequests,
      failedRequests: isSuccess ? this.currentTest.failedRequests : this.currentTest.failedRequests + 1
    });

    if (updatedTest) {
      this.currentTest = updatedTest;
    }

    // Create metric
    await storage.createMetric({
      serviceName: service.name,
      requestCount: 1,
      errorCount: isSuccess ? 0 : 1,
      responseTime,
      cpuUsage: Math.floor(Math.random() * 30) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 30
    });

    // Simulate circuit breaker behavior
    if (!isSuccess) {
      await circuitBreakerService.recordFailure(service.name);
    } else {
      await circuitBreakerService.recordSuccess(service.name);
    }
  }

  private async updateServiceLoads(): Promise<void> {
    const services = await storage.getAllServices();
    
    for (const service of services) {
      // Simulate load changes during test
      const baseLoad = this.isRunning ? 
        Math.min(90, service.load + Math.floor(Math.random() * 20)) : 
        Math.max(10, service.load - Math.floor(Math.random() * 10));
      
      const variation = Math.floor(Math.random() * 20) - 10;
      const newLoad = Math.max(0, Math.min(100, baseLoad + variation));
      
      await loadBalancer.updateServiceLoad(service.name, newLoad);
    }
  }

  async getCurrentLoadTest() {
    return await storage.getCurrentLoadTest();
  }

  async getLoadTestMetrics() {
    const currentTest = await this.getCurrentLoadTest();
    const recentMetrics = await storage.getRecentMetrics(undefined, 10);
    
    const avgResponseTime = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length : 0;
    
    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      isRunning: this.isRunning,
      currentTest,
      currentRPS: this.isRunning ? (currentTest?.requestsPerSecond || 0) : 0,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(errorRate.toFixed(1)),
      p95Latency: Math.round(avgResponseTime * 1.2) // Approximate P95
    };
  }
}

export const loadSimulator = new LoadSimulator();
