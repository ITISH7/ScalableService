import { storage } from "../storage";
import type { Service } from "@shared/schema";

export class LoadBalancer {
  private currentIndex = 0;

  async getHealthyServices(): Promise<Service[]> {
    const services = await storage.getAllServices();
    return services.filter(service => service.status === "healthy");
  }

  async selectService(algorithm: "round-robin" | "least-load" = "round-robin"): Promise<Service | null> {
    const healthyServices = await this.getHealthyServices();
    
    if (healthyServices.length === 0) {
      return null;
    }

    switch (algorithm) {
      case "round-robin":
        const service = healthyServices[this.currentIndex % healthyServices.length];
        this.currentIndex++;
        return service;
      
      case "least-load":
        return healthyServices.reduce((least, current) => 
          current.load < least.load ? current : least
        );
      
      default:
        return healthyServices[0];
    }
  }

  async updateServiceLoad(serviceName: string, load: number): Promise<void> {
    const service = await storage.getServiceByName(serviceName);
    if (service) {
      await storage.updateService(service.id, { load });
      
      // Log load update
      await storage.createLog({
        level: "info",
        source: "load-balancer",
        message: `Updated load for ${serviceName} to ${load}%`,
        metadata: { serviceName, load }
      });
    }
  }

  async checkServiceHealth(): Promise<void> {
    const services = await storage.getAllServices();
    
    for (const service of services) {
      // Simulate health check - in real implementation, this would make HTTP requests
      const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
      const newStatus = isHealthy ? "healthy" : "unhealthy";
      
      if (service.status !== newStatus) {
        await storage.updateService(service.id, { status: newStatus });
        
        await storage.createLog({
          level: newStatus === "healthy" ? "info" : "warn",
          source: "load-balancer",
          message: `Service ${service.name} health changed to ${newStatus}`,
          metadata: { serviceName: service.name, oldStatus: service.status, newStatus }
        });
      }
    }
  }

  async getLoadBalancerMetrics() {
    const services = await storage.getAllServices();
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === "healthy").length;
    const averageLoad = services.reduce((sum, s) => sum + s.load, 0) / totalServices;

    return {
      totalServices,
      healthyServices,
      unhealthyServices: totalServices - healthyServices,
      averageLoad: Math.round(averageLoad),
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        load: s.load,
        instanceCount: s.instanceCount
      }))
    };
  }
}

export const loadBalancer = new LoadBalancer();
