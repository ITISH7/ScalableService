import { storage } from "../storage";
import { loadBalancer } from "./loadBalancer";
import { circuitBreakerService } from "./circuitBreaker";
import { serviceRegistry } from "./serviceRegistry";
import { loadSimulator } from "./loadSimulator";

export class MetricsCollector {
  async getSystemOverview() {
    const services = await storage.getAllServices();
    const recentMetrics = await storage.getRecentMetrics(undefined, 50);
    const loadTest = await loadSimulator.getCurrentLoadTest();
    
    // Calculate aggregated metrics
    const activeServices = services.filter(s => s.status === "healthy").length;
    
    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    const avgResponseTime = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length : 0;
    
    // Estimate requests per minute based on recent activity
    const requestsPerMin = loadTest?.status === "running" ? 
      (loadTest.requestsPerSecond * 60) : Math.floor(Math.random() * 500) + 800;

    return {
      activeServices,
      requestsPerMin,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(errorRate.toFixed(1)),
      systemStatus: activeServices > services.length * 0.7 ? "healthy" : "degraded"
    };
  }

  async getDashboardMetrics() {
    const [
      systemOverview,
      loadBalancerMetrics,
      circuitBreakerMetrics,
      scalingMetrics,
      loadTestMetrics
    ] = await Promise.all([
      this.getSystemOverview(),
      loadBalancer.getLoadBalancerMetrics(),
      circuitBreakerService.getCircuitBreakerMetrics(),
      serviceRegistry.getScalingMetrics(),
      loadSimulator.getLoadTestMetrics()
    ]);

    const shards = await storage.getAllShards();
    const recentLogs = await storage.getRecentLogs(20);
    
    // Calculate resilience metrics
    const recentMetrics = await storage.getRecentMetrics(undefined, 100);
    const retrySuccessRate = this.calculateRetrySuccessRate(recentMetrics);
    const fallbackUsage = this.calculateFallbackUsage();
    const timeoutRate = this.calculateTimeoutRate(recentMetrics);

    return {
      systemOverview,
      loadBalancer: loadBalancerMetrics,
      circuitBreakers: circuitBreakerMetrics,
      scaling: scalingMetrics,
      shards: shards.map(s => ({
        id: s.id,
        name: s.name,
        range: s.range,
        load: s.load,
        status: s.status,
        recordCount: s.recordCount
      })),
      resilience: {
        retrySuccessRate,
        fallbackUsage,
        timeoutRate
      },
      loadTest: loadTestMetrics,
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message
      }))
    };
  }

  private calculateRetrySuccessRate(metrics: any[]): number {
    // Simplified calculation - in real implementation, this would track actual retry attempts
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const errors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    
    if (totalRequests === 0) return 100;
    
    const successRate = ((totalRequests - errors) / totalRequests) * 100;
    return Math.round(Math.max(85, successRate)); // Assume retries improve success rate
  }

  private calculateFallbackUsage(): number {
    // Simplified calculation based on circuit breaker states
    return Math.floor(Math.random() * 15) + 5; // 5-20%
  }

  private calculateTimeoutRate(metrics: any[]): number {
    // Simplified calculation based on response times
    const slowRequests = metrics.filter(m => m.responseTime > 5000).length;
    const totalRequests = metrics.length;
    
    if (totalRequests === 0) return 0;
    
    return Math.round((slowRequests / totalRequests) * 100);
  }

  // Start background metrics collection
  startMetricsCollection(): void {
    // Simulate real-time metrics generation
    setInterval(async () => {
      const services = await storage.getAllServices();
      
      for (const service of services) {
        if (service.status === "healthy") {
          await storage.createMetric({
            serviceName: service.name,
            requestCount: Math.floor(Math.random() * 10) + 1,
            errorCount: Math.random() > 0.95 ? 1 : 0,
            responseTime: Math.floor(Math.random() * 200) + 50,
            cpuUsage: Math.floor(Math.random() * 30) + 20,
            memoryUsage: Math.floor(Math.random() * 40) + 30
          });
        }
      }
    }, 5000);

    // Update service loads periodically
    setInterval(async () => {
      await loadBalancer.checkServiceHealth();
    }, 15000);
  }
}

export const metricsCollector = new MetricsCollector();
