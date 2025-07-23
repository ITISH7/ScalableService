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

export const storage = new MemStorage();
