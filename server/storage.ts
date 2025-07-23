import {
  users, services, circuitBreakers, metrics, shards, logs, loadTests,
  type User, type InsertUser,
  type Service, type InsertService,
  type CircuitBreaker, type InsertCircuitBreaker,
  type Metric, type InsertMetric,
  type Shard, type InsertShard,
  type Log, type InsertLog,
  type LoadTest, type InsertLoadTest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Circuit breaker methods
  getAllCircuitBreakers(): Promise<CircuitBreaker[]>;
  getCircuitBreaker(serviceName: string): Promise<CircuitBreaker | undefined>;
  createCircuitBreaker(circuitBreaker: InsertCircuitBreaker): Promise<CircuitBreaker>;
  updateCircuitBreaker(serviceName: string, updates: Partial<CircuitBreaker>): Promise<CircuitBreaker | undefined>;

  // Metrics methods
  getRecentMetrics(serviceName?: string, limit?: number): Promise<Metric[]>;
  createMetric(metric: InsertMetric): Promise<Metric>;

  // Shard methods
  getAllShards(): Promise<Shard[]>;
  getShard(id: number): Promise<Shard | undefined>;
  createShard(shard: InsertShard): Promise<Shard>;
  updateShard(id: number, updates: Partial<InsertShard>): Promise<Shard | undefined>;

  // Log methods
  getRecentLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  clearLogs(): Promise<boolean>;

  // Load test methods
  getCurrentLoadTest(): Promise<LoadTest | undefined>;
  createLoadTest(loadTest: InsertLoadTest): Promise<LoadTest>;
  updateLoadTest(id: number, updates: Partial<LoadTest>): Promise<LoadTest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private metrics: Metric[];
  private shards: Map<number, Shard>;
  private logs: Log[];
  private loadTests: Map<number, LoadTest>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.metrics = [];
    this.shards = new Map();
    this.logs = [];
    this.loadTests = new Map();
    this.currentId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Initialize services
    const sampleServices: Service[] = [
      { id: 1, name: "api-service-1", url: "http://localhost:3001", status: "healthy", instanceCount: 3, load: 23, lastHealthCheck: new Date() },
      { id: 2, name: "api-service-2", url: "http://localhost:3002", status: "healthy", instanceCount: 3, load: 31, lastHealthCheck: new Date() },
      { id: 3, name: "api-service-3", url: "http://localhost:3003", status: "degraded", instanceCount: 3, load: 78, lastHealthCheck: new Date() },
      { id: 4, name: "payment-service", url: "http://localhost:3004", status: "healthy", instanceCount: 2, load: 45, lastHealthCheck: new Date() },
      { id: 5, name: "user-service", url: "http://localhost:3005", status: "healthy", instanceCount: 2, load: 67, lastHealthCheck: new Date() },
      { id: 6, name: "external-api", url: "http://external-api.com", status: "unhealthy", instanceCount: 1, load: 0, lastHealthCheck: new Date() },
    ];

    sampleServices.forEach(service => {
      this.services.set(service.id, service);
    });

    // Initialize circuit breakers
    const sampleCircuitBreakers: CircuitBreaker[] = [
      { id: 1, serviceName: "payment-service", state: "CLOSED", failureCount: 0, failureThreshold: 5, lastFailure: null, timeout: 60000 },
      { id: 2, serviceName: "external-api", state: "OPEN", failureCount: 52, failureThreshold: 50, lastFailure: new Date(), timeout: 60000 },
      { id: 3, serviceName: "user-service", state: "HALF_OPEN", failureCount: 3, failureThreshold: 5, lastFailure: new Date(), timeout: 60000 },
    ];

    sampleCircuitBreakers.forEach(cb => {
      this.circuitBreakers.set(cb.serviceName, cb);
    });

    // Initialize shards
    const sampleShards: Shard[] = [
      { id: 1, name: "Shard 1", range: "A-H", load: 67, status: "healthy", recordCount: 10000 },
      { id: 2, name: "Shard 2", range: "I-P", load: 84, status: "degraded", recordCount: 12000 },
      { id: 3, name: "Shard 3", range: "Q-Z", load: 52, status: "healthy", recordCount: 8000 },
    ];

    sampleShards.forEach(shard => {
      this.shards.set(shard.id, shard);
    });

    this.currentId = 10;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    return Array.from(this.services.values()).find(service => service.name === name);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentId++;
    const service: Service = { 
      name: insertService.name,
      url: insertService.url,
      status: insertService.status || "healthy",
      instanceCount: insertService.instanceCount || 1,
      load: insertService.load || 0,
      id, 
      lastHealthCheck: new Date()
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, updates: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService = { 
      ...service, 
      ...updates, 
      lastHealthCheck: new Date()
    };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Circuit breaker methods
  async getAllCircuitBreakers(): Promise<CircuitBreaker[]> {
    return Array.from(this.circuitBreakers.values());
  }

  async getCircuitBreaker(serviceName: string): Promise<CircuitBreaker | undefined> {
    return this.circuitBreakers.get(serviceName);
  }

  async createCircuitBreaker(insertCircuitBreaker: InsertCircuitBreaker): Promise<CircuitBreaker> {
    const id = this.currentId++;
    const circuitBreaker: CircuitBreaker = { 
      serviceName: insertCircuitBreaker.serviceName,
      state: insertCircuitBreaker.state || "CLOSED",
      failureCount: insertCircuitBreaker.failureCount || 0,
      failureThreshold: insertCircuitBreaker.failureThreshold || 5,
      timeout: insertCircuitBreaker.timeout || 60000,
      id, 
      lastFailure: null 
    };
    this.circuitBreakers.set(circuitBreaker.serviceName, circuitBreaker);
    return circuitBreaker;
  }

  async updateCircuitBreaker(serviceName: string, updates: Partial<InsertCircuitBreaker>): Promise<CircuitBreaker | undefined> {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return undefined;

    const updatedCircuitBreaker = { ...circuitBreaker, ...updates };
    this.circuitBreakers.set(serviceName, updatedCircuitBreaker);
    return updatedCircuitBreaker;
  }

  // Metrics methods
  async getRecentMetrics(serviceName?: string, limit: number = 100): Promise<Metric[]> {
    let filtered = this.metrics;
    if (serviceName) {
      filtered = this.metrics.filter(m => m.serviceName === serviceName);
    }
    return filtered
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const id = this.currentId++;
    const metric: Metric = { 
      serviceName: insertMetric.serviceName,
      requestCount: insertMetric.requestCount || 0,
      errorCount: insertMetric.errorCount || 0,
      responseTime: insertMetric.responseTime || 0,
      cpuUsage: insertMetric.cpuUsage || 0,
      memoryUsage: insertMetric.memoryUsage || 0,
      id, 
      timestamp: new Date()
    };
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
    
    return metric;
  }

  // Shard methods
  async getAllShards(): Promise<Shard[]> {
    return Array.from(this.shards.values());
  }

  async getShard(id: number): Promise<Shard | undefined> {
    return this.shards.get(id);
  }

  async createShard(insertShard: InsertShard): Promise<Shard> {
    const id = this.currentId++;
    const shard: Shard = { 
      name: insertShard.name,
      range: insertShard.range,
      load: insertShard.load || 0,
      status: insertShard.status || "healthy",
      recordCount: insertShard.recordCount || 0,
      id 
    };
    this.shards.set(id, shard);
    return shard;
  }

  async updateShard(id: number, updates: Partial<InsertShard>): Promise<Shard | undefined> {
    const shard = this.shards.get(id);
    if (!shard) return undefined;

    const updatedShard = { ...shard, ...updates };
    this.shards.set(id, updatedShard);
    return updatedShard;
  }

  // Log methods
  async getRecentLogs(limit: number = 50): Promise<Log[]> {
    return this.logs
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentId++;
    const log: Log = { 
      level: insertLog.level,
      source: insertLog.source,
      message: insertLog.message,
      metadata: insertLog.metadata || null,
      id, 
      timestamp: new Date()
    };
    this.logs.push(log);
    
    // Keep only recent logs
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(-100);
    }
    
    return log;
  }

  async clearLogs(): Promise<boolean> {
    this.logs = [];
    return true;
  }

  // Load test methods
  async getCurrentLoadTest(): Promise<LoadTest | undefined> {
    return Array.from(this.loadTests.values()).find(test => test.status === "running");
  }

  async createLoadTest(insertLoadTest: InsertLoadTest): Promise<LoadTest> {
    const id = this.currentId++;
    const loadTest: LoadTest = { 
      status: insertLoadTest.status || "stopped",
      concurrentUsers: insertLoadTest.concurrentUsers || 10,
      requestsPerSecond: insertLoadTest.requestsPerSecond || 1,
      duration: insertLoadTest.duration || 60,
      totalRequests: insertLoadTest.totalRequests || 0,
      successfulRequests: insertLoadTest.successfulRequests || 0,
      failedRequests: insertLoadTest.failedRequests || 0,
      id, 
      startTime: null,
      endTime: null
    };
    this.loadTests.set(id, loadTest);
    return loadTest;
  }

  async updateLoadTest(id: number, updates: Partial<InsertLoadTest>): Promise<LoadTest | undefined> {
    const loadTest = this.loadTests.get(id);
    if (!loadTest) return undefined;

    const updatedLoadTest = { ...loadTest, ...updates };
    this.loadTests.set(id, updatedLoadTest);
    return updatedLoadTest;
  }
}

export class DatabaseStorage implements IStorage {
  async initializeData() {
    // Check if data already exists
    const existingServices = await this.getAllServices();
    if (existingServices.length > 0) {
      return; // Data already initialized
    }

    // Initialize services
    const sampleServices = [
      { name: "api-service-1", url: "http://localhost:3001", status: "healthy" as const, instanceCount: 3, load: 23 },
      { name: "api-service-2", url: "http://localhost:3002", status: "healthy" as const, instanceCount: 3, load: 31 },
      { name: "api-service-3", url: "http://localhost:3003", status: "degraded" as const, instanceCount: 3, load: 78 },
      { name: "payment-service", url: "http://localhost:3004", status: "healthy" as const, instanceCount: 2, load: 45 },
      { name: "user-service", url: "http://localhost:3005", status: "healthy" as const, instanceCount: 2, load: 67 },
      { name: "external-api", url: "http://external-api.com", status: "unhealthy" as const, instanceCount: 1, load: 0 },
    ];

    for (const service of sampleServices) {
      await this.createService(service);
    }

    // Initialize circuit breakers
    const sampleCircuitBreakers = [
      { serviceName: "payment-service", state: "CLOSED" as const, failureCount: 0, failureThreshold: 5, timeout: 60000 },
      { serviceName: "external-api", state: "OPEN" as const, failureCount: 52, failureThreshold: 50, lastFailure: new Date(), timeout: 60000 },
      { serviceName: "user-service", state: "HALF_OPEN" as const, failureCount: 3, failureThreshold: 5, lastFailure: new Date(), timeout: 60000 },
    ];

    for (const cb of sampleCircuitBreakers) {
      await this.createCircuitBreaker(cb);
    }

    // Initialize shards
    const sampleShards = [
      { name: "Shard 1", range: "A-H", load: 67, status: "healthy" as const, recordCount: 10000 },
      { name: "Shard 2", range: "I-P", load: 84, status: "degraded" as const, recordCount: 12000 },
      { name: "Shard 3", range: "Q-Z", load: 52, status: "healthy" as const, recordCount: 8000 },
    ];

    for (const shard of sampleShards) {
      await this.createShard(shard);
    }
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.name, name));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values({
        ...insertService,
        lastHealthCheck: new Date()
      })
      .returning();
    return service;
  }

  async updateService(id: number, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({
        ...updates,
        lastHealthCheck: new Date()
      })
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Circuit breaker methods
  async getAllCircuitBreakers(): Promise<CircuitBreaker[]> {
    return await db.select().from(circuitBreakers);
  }

  async getCircuitBreaker(serviceName: string): Promise<CircuitBreaker | undefined> {
    const [circuitBreaker] = await db
      .select()
      .from(circuitBreakers)
      .where(eq(circuitBreakers.serviceName, serviceName));
    return circuitBreaker || undefined;
  }

  async createCircuitBreaker(insertCircuitBreaker: InsertCircuitBreaker): Promise<CircuitBreaker> {
    const [circuitBreaker] = await db
      .insert(circuitBreakers)
      .values(insertCircuitBreaker)
      .returning();
    return circuitBreaker;
  }

  async updateCircuitBreaker(serviceName: string, updates: Partial<CircuitBreaker>): Promise<CircuitBreaker | undefined> {
    const [circuitBreaker] = await db
      .update(circuitBreakers)
      .set(updates)
      .where(eq(circuitBreakers.serviceName, serviceName))
      .returning();
    return circuitBreaker || undefined;
  }

  // Metrics methods
  async getRecentMetrics(serviceName?: string, limit: number = 100): Promise<Metric[]> {
    if (serviceName) {
      return await db
        .select()
        .from(metrics)
        .where(eq(metrics.serviceName, serviceName))
        .orderBy(desc(metrics.timestamp))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(metrics)
      .orderBy(desc(metrics.timestamp))
      .limit(limit);
  }

  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const [metric] = await db
      .insert(metrics)
      .values({
        ...insertMetric,
        timestamp: new Date()
      })
      .returning();
    return metric;
  }

  // Shard methods
  async getAllShards(): Promise<Shard[]> {
    return await db.select().from(shards);
  }

  async getShard(id: number): Promise<Shard | undefined> {
    const [shard] = await db.select().from(shards).where(eq(shards.id, id));
    return shard || undefined;
  }

  async createShard(insertShard: InsertShard): Promise<Shard> {
    const [shard] = await db
      .insert(shards)
      .values(insertShard)
      .returning();
    return shard;
  }

  async updateShard(id: number, updates: Partial<InsertShard>): Promise<Shard | undefined> {
    const [shard] = await db
      .update(shards)
      .set(updates)
      .where(eq(shards.id, id))
      .returning();
    return shard || undefined;
  }

  // Log methods
  async getRecentLogs(limit: number = 50): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(limit);
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db
      .insert(logs)
      .values({
        ...insertLog,
        timestamp: new Date()
      })
      .returning();
    return log;
  }

  async clearLogs(): Promise<boolean> {
    await db.delete(logs);
    return true;
  }

  // Load test methods
  async getCurrentLoadTest(): Promise<LoadTest | undefined> {
    const [loadTest] = await db
      .select()
      .from(loadTests)
      .where(eq(loadTests.status, "running"))
      .limit(1);
    return loadTest || undefined;
  }

  async createLoadTest(insertLoadTest: InsertLoadTest): Promise<LoadTest> {
    const [loadTest] = await db
      .insert(loadTests)
      .values(insertLoadTest)
      .returning();
    return loadTest;
  }

  async updateLoadTest(id: number, updates: Partial<LoadTest>): Promise<LoadTest | undefined> {
    const [loadTest] = await db
      .update(loadTests)
      .set(updates)
      .where(eq(loadTests.id, id))
      .returning();
    return loadTest || undefined;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

// Initialize database with sample data
storage.initializeData().catch(console.error);
