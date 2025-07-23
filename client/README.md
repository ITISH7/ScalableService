# Frontend - Microservice Monitoring Dashboard

React-based frontend for monitoring distributed systems with real-time metrics, load balancing visualization, and failure simulation controls.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation
```bash
# From project root
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5000` (served by the backend in development mode).

## 🏗️ Architecture

### Technology Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management
- **shadcn/ui** component library built on Radix UI
- **Tailwind CSS** for utility-first styling
- **React Hook Form** with Zod validation for forms

### Project Structure
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── MetricCard.tsx  # Real-time metric display
│   │   ├── LoadBalancerStatus.tsx
│   │   ├── CircuitBreakerStatus.tsx
│   │   ├── HorizontalScaling.tsx
│   │   ├── DataSharding.tsx
│   │   ├── ResilienceMetrics.tsx
│   │   ├── LoadSimulation.tsx
│   │   └── RecentLogs.tsx
│   ├── pages/              # Page components
│   │   ├── dashboard.tsx   # Main dashboard
│   │   └── not-found.tsx   # 404 page
│   ├── hooks/              # Custom React hooks
│   │   ├── use-mobile.tsx  # Mobile detection
│   │   └── use-toast.ts    # Toast notifications
│   ├── lib/                # Utility libraries
│   │   ├── queryClient.ts  # TanStack Query setup
│   │   └── utils.ts        # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles and Tailwind
└── index.html              # HTML template
```

## 🎨 Key Components

### Dashboard (`pages/dashboard.tsx`)
Main monitoring interface featuring:
- System overview metrics
- Service health indicators
- Real-time status updates
- Control panels for testing and simulation

### MetricCard (`components/MetricCard.tsx`)
Displays real-time metrics with:
- Dynamic value updates
- Color-coded status indicators
- Animated transitions
- Icon representations

### LoadBalancerStatus (`components/LoadBalancerStatus.tsx`)
Visualizes load balancing with:
- Round-robin algorithm display
- Service load distribution
- Request routing visualization
- Health check indicators

### CircuitBreakerStatus (`components/CircuitBreakerStatus.tsx`)
Shows circuit breaker states:
- CLOSED, OPEN, HALF_OPEN states
- Failure count tracking
- Recovery time display
- State transition animations

### HorizontalScaling (`components/HorizontalScaling.tsx`)
Scaling controls and metrics:
- Instance count management
- Auto-scaling triggers
- Load threshold indicators
- Scaling history

### DataSharding (`components/DataSharding.tsx`)
Shard monitoring interface:
- Shard load distribution
- Range-based partitioning display
- Record count tracking
- Health status per shard

### LoadSimulation (`components/LoadSimulation.tsx`)
Load testing controls:
- Concurrent user configuration
- Request rate settings
- Duration controls
- Real-time test metrics

### RecentLogs (`components/RecentLogs.tsx`)
System event logging:
- Real-time log updates
- Log level filtering
- Timestamp display
- Source identification

## 🔧 Development

### Available Scripts
```bash
# Start development server (with backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Lint code
npm run lint
```

### Development Server
The development server runs on the backend port (`5000`) using Vite middleware. This provides:
- Hot module replacement (HMR)
- Fast refresh for React components
- Automatic TypeScript compilation
- CSS processing with Tailwind

### State Management

#### TanStack Query Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    },
  },
});
```

#### API Integration
```typescript
// Example usage in components
const { data: metrics, isLoading } = useQuery({
  queryKey: ["/api/metrics"],
  refetchInterval: 5000,
});
```

### Styling

#### Dark Theme Configuration
The application uses a dark theme by default with CSS variables:
```css
:root {
  --background: hsl(222, 84%, 5%);
  --foreground: hsl(210, 40%, 98%);
  --card: hsl(220, 40%, 12%);
  --border: hsl(217, 32%, 17%);
  --primary: hsl(207, 90%, 54%);
}
```

#### Tailwind Configuration
```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ... other theme colors
      },
    },
  },
};
```

### Component Development

#### Creating New Components
1. Use TypeScript for type safety
2. Follow the established component structure
3. Use shadcn/ui components as base elements
4. Implement proper loading and error states
5. Add proper accessibility attributes

#### Example Component Structure
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <div className="dashboard-card p-6">
      {/* Component implementation */}
    </div>
  );
}
```

### Routing

Using Wouter for lightweight routing:
```typescript
// App.tsx
import { Switch, Route } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### Forms and Validation

Using React Hook Form with Zod validation:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  concurrentUsers: z.number().min(1).max(1000),
  duration: z.number().min(10).max(3600),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    concurrentUsers: 10,
    duration: 60,
  },
});
```

## 📱 Responsive Design

The dashboard is fully responsive with:
- Mobile-first design approach
- Responsive grid layouts using CSS Grid
- Touch-friendly interfaces
- Optimized for tablets and desktop

### Breakpoints
- `sm`: 640px and up
- `md`: 768px and up  
- `lg`: 1024px and up
- `xl`: 1280px and up

## 🔍 Performance Optimization

### Code Splitting
Vite automatically handles code splitting for optimal loading:
- Dynamic imports for large components
- Tree shaking for unused code
- Asset optimization

### Caching Strategy
- TanStack Query handles response caching
- Background refetch for stale data
- Optimistic updates for better UX

### Bundle Optimization
```bash
# Analyze bundle size
npm run build
npm run preview
```

## 🧪 Testing

### Unit Testing Setup
```bash
# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

test('renders metric card with correct values', () => {
  render(
    <MetricCard 
      title="Active Services" 
      value={5} 
      icon="🖥️" 
      color="green" 
    />
  );
  
  expect(screen.getByText('Active Services')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});
```

## 🚀 Production Build

### Build Process
```bash
# Create optimized production build
npm run build
```

The build process:
1. TypeScript compilation
2. Vite optimization and bundling
3. Asset optimization and compression
4. CSS purging and minification

### Build Output
```
dist/
├── assets/           # Optimized JS/CSS bundles
├── index.html        # Entry HTML file
└── favicon.ico       # App icon
```

## 🔧 Configuration

### Environment Variables
Frontend environment variables must be prefixed with `VITE_`:
```bash
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Microservice Dashboard
```

### Vite Configuration
```typescript
// vite.config.ts
export default {
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```

## 📊 Real-time Features

### Auto-refresh Mechanism
All metrics automatically refresh every 5 seconds using TanStack Query:
```typescript
const { data: metrics } = useQuery({
  queryKey: ["/api/metrics"],
  refetchInterval: 5000,
  refetchIntervalInBackground: true,
});
```

### WebSocket Integration (Future Enhancement)
Ready for WebSocket integration for real-time updates:
```typescript
// Future WebSocket implementation
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  queryClient.setQueryData(["/api/metrics"], data);
};
```

## 🎯 Best Practices

### Code Organization
- Group related components together
- Use consistent naming conventions
- Implement proper TypeScript interfaces
- Follow React best practices

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Avoid unnecessary re-renders
- Optimize images and assets

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Maintain color contrast ratios

### Error Handling
- Implement error boundaries
- Handle network failures gracefully
- Show meaningful error messages
- Provide retry mechanisms