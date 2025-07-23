import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface CircuitBreakerData {
  total: number;
  closed: number;
  open: number;
  halfOpen: number;
  circuitBreakers: Array<{
    serviceName: string;
    state: string;
    failureCount: number;
    failureThreshold: number;
  }>;
}

interface CircuitBreakerStatusProps {
  data: CircuitBreakerData;
}

export default function CircuitBreakerStatus({ data }: CircuitBreakerStatusProps) {
  const { toast } = useToast();

  const handleResetAll = async () => {
    try {
      await apiRequest("POST", "/api/circuit-breakers/reset-all", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Circuit Breakers Reset",
        description: "All circuit breakers have been reset to CLOSED state",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Could not reset circuit breakers",
        variant: "destructive",
      });
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "CLOSED": return "text-green-400";
      case "OPEN": return "text-red-400";
      case "HALF_OPEN": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getIndicatorColor = (state: string) => {
    switch (state) {
      case "CLOSED": return "bg-green-400";
      case "OPEN": return "bg-red-400 animate-pulse";
      case "HALF_OPEN": return "bg-yellow-400";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Circuit Breaker Status</h3>
        <Button
          onClick={handleResetAll}
          variant="outline"
          size="sm"
          className="text-blue-400 hover:text-blue-300 border-blue-400/50"
        >
          Reset All
        </Button>
      </div>
      
      <div className="space-y-4">
        {data.circuitBreakers.map((cb) => (
          <div key={cb.serviceName} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getIndicatorColor(cb.state)}`} />
              <span className="font-medium">{cb.serviceName}</span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getStateColor(cb.state)}`}>
                {cb.state.replace('_', '-')}
              </div>
              <div className="text-xs text-gray-400">
                Failures: {cb.failureCount}/{cb.failureThreshold}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
