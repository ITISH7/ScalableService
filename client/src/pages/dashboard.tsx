import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Group, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/MetricCard";
import LoadBalancerStatus from "@/components/LoadBalancerStatus";
import CircuitBreakerStatus from "@/components/CircuitBreakerStatus";
import HorizontalScaling from "@/components/HorizontalScaling";
import DataSharding from "@/components/DataSharding";
import ResilienceMetrics from "@/components/ResilienceMetrics";
import LoadSimulation from "@/components/LoadSimulation";
import RecentLogs from "@/components/RecentLogs";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleRefreshMetrics = () => {
    refetch();
    toast({
      title: "Metrics Refreshed",
      description: "Dashboard metrics have been updated",
    });
  };

  const handleSimulateFailure = async () => {
    try {
      await apiRequest("POST", "/api/simulate/service-failure", {
        serviceName: "external-api",
        duration: 60000
      });
      toast({
        title: "Failure Simulation Started",
        description: "Simulating service failure for external-api",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Could not start failure simulation",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center space-x-4">
            <Group className="text-primary h-6 w-6" />
            <h1 className="text-xl font-bold text-foreground">Microservice Dashboard</h1>
            <div className="skeleton h-6 w-32 rounded-full"></div>
          </div>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dashboard-card p-6">
                <div className="skeleton h-16 w-full rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const systemStatus = metrics.systemOverview?.systemStatus || "healthy";

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Group className="text-blue-500 h-6 w-6" />
              <h1 className="text-xl font-bold">Microservice Dashboard</h1>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              systemStatus === "healthy" ? "bg-green-900/30" : "bg-yellow-900/30"
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                systemStatus === "healthy" ? "bg-green-400" : "bg-yellow-400"
              }`} />
              <span className={`text-sm font-medium ${
                systemStatus === "healthy" ? "text-green-300" : "text-yellow-300"
              }`}>
                System {systemStatus === "healthy" ? "Healthy" : "Degraded"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleRefreshMetrics}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={handleSimulateFailure}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Simulate Failure
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card min-h-screen p-4">
          <nav className="space-y-2">
            <a href="#overview" className="flex items-center space-x-3 px-3 py-2 bg-blue-600 rounded-lg text-white">
              <span>📊</span>
              <span>Overview</span>
            </a>
            <a href="#services" className="flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span>🖥️</span>
              <span>Services</span>
            </a>
            <a href="#scaling" className="flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span>📈</span>
              <span>Scaling</span>
            </a>
            <a href="#resilience" className="flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span>🛡️</span>
              <span>Resilience</span>
            </a>
            <a href="#monitoring" className="flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span>📊</span>
              <span>Monitoring</span>
            </a>
            <a href="#logs" className="flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <span>📝</span>
              <span>Logs</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-background">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Active Services"
              value={metrics.systemOverview.activeServices}
              icon="🖥️"
              color="green"
            />
            <MetricCard
              title="Requests/Min"
              value={metrics.systemOverview.requestsPerMin.toLocaleString()}
              icon="🔄"
              color="blue"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${metrics.systemOverview.avgResponseTime}ms`}
              icon="⏱️"
              color="yellow"
            />
            <MetricCard
              title="Error Rate"
              value={`${metrics.systemOverview.errorRate}%`}
              icon="⚠️"
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LoadBalancerStatus data={metrics.loadBalancer} />
            <CircuitBreakerStatus data={metrics.circuitBreakers} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <HorizontalScaling data={metrics.scaling} />
            <DataSharding data={metrics.shards} />
            <ResilienceMetrics data={metrics.resilience} />
          </div>

          <LoadSimulation data={metrics.loadTest} />

          <RecentLogs data={metrics.recentLogs} />
        </main>
      </div>
    </div>
  );
}
