import { storage } from "../storage";
import { loadBalancer } from "./loadBalancer";

export class ServiceRegistry {
  async scaleUp(serviceName: string): Promise<void> {
    const service = await storage.getServiceByName(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const newInstanceCount = service.instanceCount + 1;
    await storage.updateService(service.id, { 
      instanceCount: newInstanceCount,
      load: Math.max(0, service.load - 20) // Reduce load as we add instances
    });

    await storage.createLog({
      level: "info",
      source: "orchestrator",
      message: `Auto-scaled ${serviceName} from ${service.instanceCount} to ${newInstanceCount} instances due to high load`,
      metadata: { serviceName, oldInstanceCount: service.instanceCount, newInstanceCount }
    });
  }

  async scaleDown(serviceName: string): Promise<void> {
    const service = await storage.getServiceByName(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (service.instanceCount <= 1) {
      throw new Error(`Cannot scale down ${serviceName} below 1 instance`);
    }

    const newInstanceCount = service.instanceCount - 1;
    await storage.updateService(service.id, { 
      instanceCount: newInstanceCount,
      load: Math.min(100, service.load + 20) // Increase load as we remove instances
    });

    await storage.createLog({
      level: "info",
      source: "orchestrator",
      message: `Scaled down ${serviceName} from ${service.instanceCount} to ${newInstanceCount} instances`,
      metadata: { serviceName, oldInstanceCount: service.instanceCount, newInstanceCount }
    });
  }

  async autoScale(): Promise<void> {
    const services = await storage.getAllServices();
    
    for (const service of services) {
      if (service.status === "healthy") {
        // Scale up if load is high
        if (service.load > 75 && service.instanceCount < 5) {
          await this.scaleUp(service.name);
        }
        // Scale down if load is low
        else if (service.load < 25 && service.instanceCount > 1) {
          await this.scaleDown(service.name);
        }
      }
    }
  }

  async getScalingMetrics() {
    const services = await storage.getAllServices();
    
    return {
      totalInstances: services.reduce((sum, s) => sum + s.instanceCount, 0),
      services: services.map(s => ({
        name: s.name,
        instanceCount: s.instanceCount,
        load: s.load,
        status: s.status,
        canScaleUp: s.instanceCount < 5,
        canScaleDown: s.instanceCount > 1
      }))
    };
  }

  // Start auto-scaling monitoring
  startAutoScaling(): void {
    setInterval(async () => {
      try {
        await this.autoScale();
      } catch (error) {
        console.error("Auto-scaling error:", error);
      }
    }, 30000); // Check every 30 seconds
  }
}

export const serviceRegistry = new ServiceRegistry();
