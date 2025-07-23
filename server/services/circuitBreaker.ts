import { storage } from "../storage";
import type { CircuitBreaker, InsertCircuitBreaker } from "@shared/schema";

type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreakerService {
  async getCircuitBreaker(serviceName: string): Promise<CircuitBreaker> {
    let circuitBreaker = await storage.getCircuitBreaker(serviceName);
    
    if (!circuitBreaker) {
      // Create default circuit breaker
      circuitBreaker = await storage.createCircuitBreaker({
        serviceName,
        state: "CLOSED",
        failureCount: 0,
        failureThreshold: 5,
        timeout: 60000
      });
    }
    
    return circuitBreaker;
  }

  async recordSuccess(serviceName: string): Promise<void> {
    const circuitBreaker = await this.getCircuitBreaker(serviceName);
    
    if (circuitBreaker.state === "HALF_OPEN") {
      // Success in half-open state closes the circuit
      await storage.updateCircuitBreaker(serviceName, {
        state: "CLOSED",
        failureCount: 0
      });
      
      await storage.createLog({
        level: "info",
        source: serviceName,
        message: `Circuit breaker for ${serviceName} reset to CLOSED state`,
        metadata: { serviceName, previousState: "HALF_OPEN" }
      });
    } else if (circuitBreaker.state === "CLOSED" && circuitBreaker.failureCount > 0) {
      // Reset failure count on success
      await storage.updateCircuitBreaker(serviceName, {
        failureCount: 0
      });
    }
  }

  async recordFailure(serviceName: string): Promise<boolean> {
    const circuitBreaker = await this.getCircuitBreaker(serviceName);
    const newFailureCount = circuitBreaker.failureCount + 1;
    
    if (circuitBreaker.state === "CLOSED" && newFailureCount >= circuitBreaker.failureThreshold) {
      // Open the circuit
      await storage.updateCircuitBreaker(serviceName, {
        state: "OPEN",
        failureCount: newFailureCount,
        lastFailure: new Date()
      });
      
      await storage.createLog({
        level: "error",
        source: serviceName,
        message: `Circuit breaker opened for ${serviceName} due to ${newFailureCount} consecutive failures`,
        metadata: { serviceName, failureCount: newFailureCount, threshold: circuitBreaker.failureThreshold }
      });
      
      return false; // Circuit is now open
    } else if (circuitBreaker.state === "HALF_OPEN") {
      // Failure in half-open state reopens the circuit
      await storage.updateCircuitBreaker(serviceName, {
        state: "OPEN",
        failureCount: newFailureCount,
        lastFailure: new Date()
      });
      
      await storage.createLog({
        level: "warn",
        source: serviceName,
        message: `Circuit breaker reopened for ${serviceName} after failed attempt in half-open state`,
        metadata: { serviceName, failureCount: newFailureCount }
      });
      
      return false;
    } else {
      // Just increment failure count
      await storage.updateCircuitBreaker(serviceName, {
        failureCount: newFailureCount,
        lastFailure: new Date()
      });
      
      return true; // Circuit is still closed
    }
  }

  async canExecute(serviceName: string): Promise<boolean> {
    const circuitBreaker = await this.getCircuitBreaker(serviceName);
    
    switch (circuitBreaker.state) {
      case "CLOSED":
        return true;
      
      case "OPEN":
        // Check if timeout has elapsed to transition to half-open
        if (circuitBreaker.lastFailure) {
          const timeSinceLastFailure = Date.now() - new Date(circuitBreaker.lastFailure).getTime();
          if (timeSinceLastFailure >= circuitBreaker.timeout) {
            await storage.updateCircuitBreaker(serviceName, {
              state: "HALF_OPEN"
            });
            
            await storage.createLog({
              level: "info",
              source: serviceName,
              message: `Circuit breaker for ${serviceName} transitioned to HALF_OPEN state`,
              metadata: { serviceName, timeoutElapsed: timeSinceLastFailure }
            });
            
            return true;
          }
        }
        return false;
      
      case "HALF_OPEN":
        return true;
      
      default:
        return false;
    }
  }

  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const canExecute = await this.canExecute(serviceName);
    
    if (!canExecute) {
      if (fallback) {
        await storage.createLog({
          level: "info",
          source: serviceName,
          message: `Circuit breaker OPEN for ${serviceName}, executing fallback`,
          metadata: { serviceName }
        });
        return fallback();
      } else {
        throw new Error(`Circuit breaker is OPEN for ${serviceName}`);
      }
    }
    
    try {
      const result = await operation();
      await this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      await this.recordFailure(serviceName);
      
      if (fallback) {
        await storage.createLog({
          level: "warn",
          source: serviceName,
          message: `Operation failed for ${serviceName}, executing fallback`,
          metadata: { serviceName, error: (error as Error).message }
        });
        return fallback();
      } else {
        throw error;
      }
    }
  }

  async resetCircuitBreaker(serviceName: string): Promise<void> {
    await storage.updateCircuitBreaker(serviceName, {
      state: "CLOSED",
      failureCount: 0
    });
    
    await storage.createLog({
      level: "info",
      source: "circuit-breaker",
      message: `Manually reset circuit breaker for ${serviceName}`,
      metadata: { serviceName }
    });
  }

  async resetAllCircuitBreakers(): Promise<void> {
    const circuitBreakers = await storage.getAllCircuitBreakers();
    
    for (const cb of circuitBreakers) {
      await this.resetCircuitBreaker(cb.serviceName);
    }
  }

  async getCircuitBreakerMetrics() {
    const circuitBreakers = await storage.getAllCircuitBreakers();
    
    return {
      total: circuitBreakers.length,
      closed: circuitBreakers.filter(cb => cb.state === "CLOSED").length,
      open: circuitBreakers.filter(cb => cb.state === "OPEN").length,
      halfOpen: circuitBreakers.filter(cb => cb.state === "HALF_OPEN").length,
      circuitBreakers: circuitBreakers.map(cb => ({
        serviceName: cb.serviceName,
        state: cb.state,
        failureCount: cb.failureCount,
        failureThreshold: cb.failureThreshold,
        lastFailure: cb.lastFailure
      }))
    };
  }
}

export const circuitBreakerService = new CircuitBreakerService();
