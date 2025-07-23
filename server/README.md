# Backend - Microservice Monitoring System

Express.js backend providing REST APIs for microservice monitoring, load balancing, circuit breaker management, and failure simulation capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm package manager

### Installation
```bash
# From project root
npm install

# Setup database schema
npm run db:push

# Start development server
npm run dev
```

The backend server will start on `http://localhost:5000`

## 🏗️ Architecture

### Technology Stack
- **Express.js** with TypeScript for type-safe API development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** for persistent data storage
- **Neon Database** for serverless PostgreSQL hosting
- **ESM modules** for modern JavaScript support

### Project Structure
```
server/
├── services/              # Core business logic
│   ├── loadBalancer.ts   # Load balancing algorithms
│   ├── circuitBreaker.ts # Circuit breaker implementation
│   ├── loadSimulator.ts  # Load testing simulation
│   └── metricCollector.ts # Real-time metrics collection
├── db.ts                 # Database connection setup
├── storage.ts            # Data access layer
├── routes.ts             # API route definitions
├── index.ts              # Server entry point
└── vite.ts               # Vite middleware integration
```

## 🛠️ Core Services

### Load Balancer (`services/loadBalancer.ts`)
Implements multiple load balancing algorithms:

#### Round-Robin Algorithm
```typescript
class RoundRobinBalancer {
  private currentIndex = 0;
  
  selectService(services: Service[]): Service {
    const healthyServices = services.filter(s => s.status === 'healthy');
    if (healthyServices.length === 0) return null;
    
    const service = healthyServices[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % healthyServices.length;
    return service;
  }
}
```

#### Least-Load Algorithm
```typescript
class LeastLoadBalancer {
  selectService(services: Service[]): Service {
    const healthyServices = services.filter(s => s.status === 'healthy');
    return healthyServices.reduce((min, service) => 
      service.load < min.load ? service : min
    );
  }
}
```

### Circuit Breaker (`services/circuitBreaker.ts`)
Implements the circuit breaker pattern with three states:

#### States
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Failure threshold exceeded, requests fail fast
- **HALF_OPEN**: Testing recovery, limited requests allowed

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Data Storage (`storage.ts`)
Database abstraction layer using Drizzle ORM:

#### Interface Definition
```typescript
export interface IStorage {
  // Service management
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<boolean>;
  
  // Circuit breaker management
  getAllCircuitBreakers(): Promise<CircuitBreaker[]>;
  getCircuitBreaker(serviceName: string): Promise<CircuitBreaker | undefined>;
  updateCircuitBreaker(serviceName: string, updates: Partial<CircuitBreaker>): Promise<CircuitBreaker>;
  
  // Metrics and monitoring
  getRecentMetrics(serviceName?: string, limit?: number): Promise<Metric[]>;
  createMetric(metric: InsertMetric): Promise<Metric>;
  getRecentLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}
```

#### Database Implementation
```typescript
export class DatabaseStorage implements IStorage {
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
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
  
  // ... other implementations
}
```

## 📡 API Endpoints

### System Metrics
```typescript
// GET /api/metrics
// Returns comprehensive system metrics
interface SystemMetrics {
  systemOverview: {
    activeServices: number;
    requestsPerMin: number;
    avgResponseTime: number;
    errorRate: number;
    systemStatus: 'healthy' | 'degraded';
  };
  loadBalancer: LoadBalancerData;
  circuitBreakers: CircuitBreaker[];
  scaling: ScalingData;
  shards: Shard[];
  resilience: ResilienceData;
  loadTest: LoadTest;
  recentLogs: Log[];
}
```

### Service Management
```typescript
// GET /api/services
// List all registered services
interface Service {
  id: number;
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  instanceCount: number;
  load: number;
  lastHealthCheck: Date;
}

// POST /api/services
// Register a new service
interface CreateServiceRequest {
  name: string;
  url: string;
  instanceCount?: number;
}

// PUT /api/services/:id
// Update service configuration
interface UpdateServiceRequest {
  status?: 'healthy' | 'degraded' | 'unhealthy';
  instanceCount?: number;
  load?: number;
}
```

### Load Testing
```typescript
// POST /api/load-test/start
// Start a load test
interface StartLoadTestRequest {
  concurrentUsers: number;
  requestsPerSecond: number;
  duration: number; // seconds
  targetService?: string;
}

// POST /api/load-test/stop
// Stop current load test

// GET /api/load-test/status
// Get current load test status
interface LoadTestStatus {
  status: 'running' | 'stopped';
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  startTime: Date;
  endTime?: Date;
}
```

### Failure Simulation
```typescript
// POST /api/simulate/service-failure
// Simulate service failure
interface ServiceFailureRequest {
  serviceName: string;
  duration: number; // milliseconds
}

// POST /api/simulate/network-latency
// Simulate network latency
interface NetworkLatencyRequest {
  latency: number; // milliseconds
  duration: number;
}

// POST /api/simulate/database-overload
// Simulate database overload
interface DatabaseOverloadRequest {
  duration: number;
  intensity: 'low' | 'medium' | 'high';
}

// POST /api/simulate/memory-leak
// Simulate memory leak
interface MemoryLeakRequest {
  duration: number;
  rate: number; // MB per second
}
```

### Scaling Operations
```typescript
// POST /api/services/:id/scale-up
// Scale service instances up
interface ScaleUpResponse {
  message: string;
  newInstanceCount: number;
}

// POST /api/services/:id/scale-down
// Scale service instances down
interface ScaleDownResponse {
  message: string;
  newInstanceCount: number;
}
```

## 🗄️ Database Schema

### Database Configuration
```typescript
// db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
export const db = drizzle({ client: pool, schema });
```

### Schema Definitions
```typescript
// shared/schema.ts
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  url: varchar('url', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('healthy'),
  instanceCount: integer('instance_count').notNull().default(1),
  load: integer('load').notNull().default(0),
  lastHealthCheck: timestamp('last_health_check').notNull().defaultNow(),
});

export const circuitBreakers = pgTable('circuit_breakers', {
  id: serial('id').primaryKey(),
  serviceName: varchar('service_name', { length: 255 }).notNull().unique(),
  state: varchar('state', { length: 20 }).notNull().default('CLOSED'),
  failureCount: integer('failure_count').notNull().default(0),
  failureThreshold: integer('failure_threshold').notNull().default(5),
  timeout: integer('timeout').notNull().default(60000),
  lastFailure: timestamp('last_failure'),
});

export const metrics = pgTable('metrics', {
  id: serial('id').primaryKey(),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  requestCount: integer('request_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  responseTime: integer('response_time').notNull().default(0),
  cpuUsage: integer('cpu_usage').notNull().default(0),
  memoryUsage: integer('memory_usage').notNull().default(0),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate migration files
npm run db:generate

# Open database studio
npm run db:studio
```

## 🔧 Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push        # Apply schema changes
npm run db:generate    # Create migration files
npm run db:studio      # Open database admin interface

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Development Setup
```typescript
// server/index.ts
import express from 'express';
import { createServer } from 'vite';

const app = express();
const port = process.env.PORT || 5000;

// Development middleware
if (process.env.NODE_ENV === 'development') {
  const vite = await createServer({
    server: { middlewareMode: true },
  });
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

// API routes
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`[express] serving on port ${port}`);
});
```

### Environment Variables
```bash
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=dbname

# Application configuration
NODE_ENV=development
PORT=5000
```

## 🔄 Real-time Features

### Metrics Collection
```typescript
class MetricCollector {
  private interval: NodeJS.Timeout;
  
  start() {
    this.interval = setInterval(async () => {
      const services = await storage.getAllServices();
      
      for (const service of services) {
        const metrics = await this.collectServiceMetrics(service);
        await storage.createMetric(metrics);
      }
    }, 5000); // Collect every 5 seconds
  }
  
  private async collectServiceMetrics(service: Service): Promise<InsertMetric> {
    return {
      serviceName: service.name,
      requestCount: Math.floor(Math.random() * 100),
      errorCount: Math.floor(Math.random() * 5),
      responseTime: Math.floor(Math.random() * 500) + 50,
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
    };
  }
}
```

### Health Monitoring
```typescript
class HealthMonitor {
  async checkServiceHealth(service: Service): Promise<void> {
    try {
      const response = await fetch(`${service.url}/health`, {
        timeout: 5000,
      });
      
      const status = response.ok ? 'healthy' : 'degraded';
      await storage.updateService(service.id, { 
        status,
        lastHealthCheck: new Date(),
      });
    } catch (error) {
      await storage.updateService(service.id, { 
        status: 'unhealthy',
        lastHealthCheck: new Date(),
      });
    }
  }
}
```

## 🚦 Load Balancing

### Algorithm Implementation
```typescript
export class LoadBalancer {
  private algorithms = {
    'round-robin': new RoundRobinBalancer(),
    'least-load': new LeastLoadBalancer(),
  };
  
  private currentAlgorithm: keyof typeof this.algorithms = 'round-robin';
  
  async routeRequest(request: any): Promise<Service> {
    const services = await storage.getAllServices();
    const balancer = this.algorithms[this.currentAlgorithm];
    
    const selectedService = balancer.selectService(services);
    if (!selectedService) {
      throw new Error('No healthy services available');
    }
    
    // Update service load
    await storage.updateService(selectedService.id, {
      load: selectedService.load + 1,
    });
    
    return selectedService;
  }
  
  switchAlgorithm(algorithm: keyof typeof this.algorithms) {
    this.currentAlgorithm = algorithm;
  }
}
```

## 🛡️ Circuit Breaker Implementation

### State Management
```typescript
export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  
  async getCircuitBreaker(serviceName: string): Promise<CircuitBreaker> {
    if (!this.circuitBreakers.has(serviceName)) {
      const cb = await storage.getCircuitBreaker(serviceName);
      if (cb) {
        this.circuitBreakers.set(serviceName, new CircuitBreaker(cb));
      }
    }
    return this.circuitBreakers.get(serviceName);
  }
  
  async executeWithCircuitBreaker<T>(
    serviceName: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    const circuitBreaker = await this.getCircuitBreaker(serviceName);
    return circuitBreaker.call(operation);
  }
}
```

## 📊 Monitoring and Metrics

### Performance Tracking
```typescript
class PerformanceTracker {
  async trackRequest(serviceName: string, duration: number, success: boolean) {
    const metric = {
      serviceName,
      requestCount: 1,
      errorCount: success ? 0 : 1,
      responseTime: duration,
      cpuUsage: await this.getCpuUsage(),
      memoryUsage: await this.getMemoryUsage(),
    };
    
    await storage.createMetric(metric);
  }
  
  async getCpuUsage(): Promise<number> {
    // Implementation for CPU usage monitoring
    return Math.floor(Math.random() * 100);
  }
  
  async getMemoryUsage(): Promise<number> {
    // Implementation for memory usage monitoring
    return Math.floor(Math.random() * 100);
  }
}
```

### Logging System
```typescript
class Logger {
  async log(level: string, source: string, message: string, metadata?: any) {
    const logEntry = {
      level,
      source,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };
    
    await storage.createLog(logEntry);
    console.log(`[${level}] ${source}: ${message}`);
  }
  
  info(source: string, message: string, metadata?: any) {
    return this.log('INFO', source, message, metadata);
  }
  
  warn(source: string, message: string, metadata?: any) {
    return this.log('WARN', source, message, metadata);
  }
  
  error(source: string, message: string, metadata?: any) {
    return this.log('ERROR', source, message, metadata);
  }
}
```

## 🧪 Testing and Simulation

### Load Testing
```typescript
class LoadTester {
  private isRunning = false;
  private currentTest?: LoadTest;
  
  async startTest(config: StartLoadTestRequest): Promise<void> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }
    
    this.currentTest = await storage.createLoadTest({
      status: 'running',
      ...config,
      startTime: new Date(),
    });
    
    this.isRunning = true;
    this.runLoadTest();
  }
  
  private async runLoadTest(): Promise<void> {
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    
    while (this.isRunning && this.currentTest) {
      const promises = [];
      
      for (let i = 0; i < this.currentTest.requestsPerSecond; i++) {
        promises.push(this.simulateRequest());
      }
      
      const results = await Promise.allSettled(promises);
      requestCount += results.length;
      successCount += results.filter(r => r.status === 'fulfilled').length;
      
      await storage.updateLoadTest(this.currentTest.id, {
        totalRequests: requestCount,
        successfulRequests: successCount,
        failedRequests: requestCount - successCount,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  async stopTest(): Promise<void> {
    this.isRunning = false;
    if (this.currentTest) {
      await storage.updateLoadTest(this.currentTest.id, {
        status: 'stopped',
        endTime: new Date(),
      });
    }
  }
}
```

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker Support
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security headers
CORS_ORIGIN=https://yourdomain.com
```

## 🔒 Security

### Authentication Middleware
```typescript
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

## 📈 Performance Optimization

### Database Optimization
- Use database indexes for frequently queried fields
- Implement connection pooling
- Use read replicas for read-heavy operations
- Implement query optimization

### Caching Strategy
```typescript
import Redis from 'ioredis';

class CacheManager {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

## 🐛 Debugging

### Logging Configuration
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint
```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.select().from(services).limit(1);
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## 📊 Monitoring Integration

### Metrics Export
```typescript
import prometheus from 'prom-client';

const register = new prometheus.Registry();

const requestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const responseTime = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
});

register.registerMetric(requestCounter);
register.registerMetric(responseTime);

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```