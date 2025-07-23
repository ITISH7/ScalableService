# Distributed Systems Monitoring Dashboard

A comprehensive microservice monitoring system that demonstrates scalability and resilience patterns including load balancing, circuit breakers, horizontal scaling, data sharding, and failure simulation.
<img width="1785" height="853" alt="Screenshot from 2025-07-23 17-08-44" src="https://github.com/user-attachments/assets/4c67ef36-70fc-46bf-81e5-3842c4b8b8c5" />
<img width="1785" height="853" alt="Screenshot from 2025-07-23 17-08-39" src="https://github.com/user-attachments/assets/85e6357e-e337-498a-9df7-7007c1385e2b" />
<img width="1785" height="853" alt="Screenshot from 2025-07-23 17-08-28" src="https://github.com/user-attachments/assets/53b7b478-a41e-41c4-92f5-2f9ab207bae5" />

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (automatically provisioned in Replit)
- npm or similar package manager

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   # Push database schema to PostgreSQL
   npm run db:push
   ```

3. **Start the Application**
   ```bash
   # Starts both frontend and backend services
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🏗️ Architecture Overview

### System Components

- **Frontend**: React 18 + TypeScript with Vite
- **Backend**: Express.js + TypeScript with Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Updates**: Automatic polling every 5 seconds
- **Styling**: Tailwind CSS with dark theme

### Key Features

#### Scalability Patterns
- **Load Balancing**: Round-robin and least-load algorithms
- **Horizontal Scaling**: Auto-scaling based on load thresholds
- **Data Sharding**: Range-based data partitioning with load monitoring

#### Resilience Patterns
- **Circuit Breaker**: Configurable failure thresholds with auto-recovery
- **Retry Mechanisms**: Built-in retry logic with exponential backoff
- **Timeout Controls**: Configurable timeout handling

#### Monitoring & Simulation
- **Real-time Metrics**: Live system performance monitoring
- **Load Testing**: Configurable concurrent user simulation
- **Failure Simulation**: Network latency, service failures, database overload
- **Event Logging**: Comprehensive system event tracking

## 📱 Frontend

### Technology Stack
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **shadcn/ui** components with Radix UI
- **Tailwind CSS** for styling

### Key Components
- `Dashboard`: Main monitoring interface
- `MetricCard`: Real-time metrics display
- `LoadBalancerStatus`: Load balancing visualization
- `CircuitBreakerStatus`: Circuit breaker state monitoring
- `HorizontalScaling`: Scaling controls and metrics
- `DataSharding`: Shard load distribution
- `LoadSimulation`: Load testing interface
- `RecentLogs`: System event logging

### Development Commands
```bash
# Start frontend development server (runs automatically with npm run dev)
npm run dev

# Build for production
npm run build
```

## 🔧 Backend

### Technology Stack
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** for persistent storage
- **ESM modules** for modern JavaScript

### API Endpoints

#### Metrics & Monitoring
- `GET /api/metrics` - Get real-time system metrics
- `GET /api/services` - List all services
- `GET /api/circuit-breakers` - Circuit breaker states
- `GET /api/shards` - Data shard information
- `GET /api/logs` - Recent system logs

#### Load Testing
- `POST /api/load-test/start` - Start load test
- `POST /api/load-test/stop` - Stop load test
- `GET /api/load-test/status` - Get load test status

#### Failure Simulation
- `POST /api/simulate/service-failure` - Simulate service failure
- `POST /api/simulate/network-latency` - Simulate network latency
- `POST /api/simulate/database-overload` - Simulate database overload
- `POST /api/simulate/memory-leak` - Simulate memory leak

#### Scaling Operations
- `POST /api/services/{id}/scale-up` - Scale service up
- `POST /api/services/{id}/scale-down` - Scale service down

### Core Services

#### Load Balancer (`server/services/loadBalancer.ts`)
- Round-robin algorithm implementation
- Least-load distribution
- Health check integration
- Service discovery

#### Circuit Breaker (`server/services/circuitBreaker.ts`)
- Three states: CLOSED, OPEN, HALF_OPEN
- Configurable failure thresholds
- Automatic recovery logic
- Timeout handling

#### Database Storage (`server/storage.ts`)
- PostgreSQL integration via Drizzle ORM
- Persistent data storage
- Sample data initialization
- CRUD operations for all entities

### Development Commands
```bash
# Start backend server (runs automatically with npm run dev)
npm run dev

# Database operations
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:studio        # Open database studio

# Build for production
npm run build
```

## 🗄️ Database Schema

### Tables
- **services**: Service registry with health status
- **circuit_breakers**: Circuit breaker configurations and states
- **metrics**: Real-time performance metrics
- **shards**: Data shard information and load distribution
- **logs**: System event logging
- **load_tests**: Load testing configurations and results
- **users**: User management (authentication ready)

### Environment Variables
```bash
DATABASE_URL=<postgresql_connection_string>
PGHOST=<database_host>
PGPORT=<database_port>
PGUSER=<database_user>
PGPASSWORD=<database_password>
PGDATABASE=<database_name>
```

## 🚀 Deployment

### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

### Environment Setup
- Set `NODE_ENV=production` for production builds
- Configure `DATABASE_URL` for PostgreSQL connection
- Ensure all required environment variables are set

## 🎯 Usage Examples

### Starting a Load Test
```bash
curl -X POST http://localhost:5000/api/load-test/start \
  -H "Content-Type: application/json" \
  -d '{"concurrentUsers": 50, "duration": 300, "requestsPerSecond": 10}'
```

### Simulating Service Failure
```bash
curl -X POST http://localhost:5000/api/simulate/service-failure \
  -H "Content-Type: application/json" \
  -d '{"serviceName": "payment-service", "duration": 60000}'
```

### Scaling a Service
```bash
curl -X POST http://localhost:5000/api/services/1/scale-up
```

## 📊 Monitoring Features

### Real-time Metrics
- Active service count
- Requests per minute
- Average response time
- Error rate percentage
- CPU and memory usage
- Load balancer distribution

### Visual Indicators
- Service health status (healthy, degraded, unhealthy)
- Circuit breaker states with color coding
- Load distribution charts
- Shard performance metrics
- Real-time event logs

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Verify database connection
   npm run db:push
   ```

2. **Port Already in Use**
   ```bash
   # Kill process using port 5000
   kill -9 $(lsof -ti:5000)
   ```

3. **TypeScript Compilation Errors**
   ```bash
   # Check for TypeScript issues
   npx tsc --noEmit
   ```

### Development Tips
- Use browser DevTools to monitor real-time updates
- Check console logs for detailed error information
- Monitor network requests in the Network tab
- Use the database studio for direct data inspection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
