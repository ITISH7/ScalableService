# Distributed Systems Monitoring Dashboard

## Overview

This project is a full-stack web application that simulates and monitors various aspects of distributed systems. It provides an interactive dashboard for observing load balancing, circuit breakers, horizontal scaling, data sharding, and resilience patterns in action. The application combines real-time system monitoring with simulation capabilities for educational and demonstration purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Logging**: Custom request/response logging middleware

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle ORM)
- **Cloud Provider**: Neon Database for serverless PostgreSQL
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Management**: Type-safe database schema with Zod validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Service Registry System
- Service discovery and health monitoring
- Automatic scaling capabilities (scale up/down)
- Instance count tracking and load distribution
- Service status management (healthy, unhealthy, degraded)

### Load Balancer
- Round-robin and least-load algorithms
- Real-time service health checking
- Dynamic load distribution across service instances
- Service availability monitoring

### Circuit Breaker Pattern
- Configurable failure thresholds and timeouts
- Three states: CLOSED, OPEN, HALF_OPEN
- Automatic failure detection and recovery
- Success rate tracking and reporting

### Monitoring and Metrics
- Real-time system metrics collection
- Performance monitoring (response time, CPU, memory)
- Error rate tracking and alerting
- System overview dashboard with key indicators

### Load Testing and Simulation
- Configurable load test scenarios
- Concurrent user simulation
- Request rate control (RPS)
- Performance metrics during load testing

### Failure Simulation
- Network latency simulation
- Service failure injection
- Timeout and error condition testing
- Recovery pattern demonstration

### Data Sharding
- Range-based data partitioning
- Shard load monitoring
- Record count tracking per shard
- Shard status management

## Data Flow

1. **Dashboard Initialization**: Frontend fetches initial metrics and system state
2. **Real-time Updates**: Automatic polling every 5 seconds for live data
3. **User Actions**: Interactive controls trigger API calls for system modifications
4. **Service Simulation**: Background services generate realistic system behavior
5. **Metrics Collection**: Continuous gathering of performance and health data
6. **Database Persistence**: All metrics, logs, and configuration stored in PostgreSQL

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Connection Pool**: Built-in connection management for high availability

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe CSS class composition

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Error Overlay**: Real-time error reporting in browser
- **TypeScript Checking**: Continuous type validation

### Production Build
- **Client Build**: Vite optimized build with code splitting
- **Server Build**: esbuild bundle for Node.js deployment
- **Static Assets**: Optimized and compressed for fast loading

### Environment Configuration
- **Database URL**: Environment variable for database connection
- **Production Mode**: NODE_ENV-based configuration switching
- **Asset Serving**: Express static file serving for production

The application follows a microservices-inspired architecture within a monolithic deployment, making it easy to understand distributed systems concepts while maintaining simplicity for development and deployment.