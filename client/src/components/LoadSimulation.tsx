import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Zap, Server, Database, MemoryStick } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface LoadTestData {
  isRunning: boolean;
  currentTest: any;
  currentRPS: number;
  avgResponseTime: number;
  errorRate: number;
  p95Latency: number;
}

interface LoadSimulationProps {
  data: LoadTestData;
}

export default function LoadSimulation({ data }: LoadSimulationProps) {
  const { toast } = useToast();
  const [concurrentUsers, setConcurrentUsers] = useState([250]);
  const [requestsPerSecond, setRequestsPerSecond] = useState([45]);

  const handleStartLoadTest = async () => {
    try {
      await apiRequest("POST", "/api/load-test/start", {
        concurrentUsers: concurrentUsers[0],
        requestsPerSecond: requestsPerSecond[0],
        duration: 120 // 2 minutes
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Load Test Started",
        description: `Started with ${concurrentUsers[0]} users, ${requestsPerSecond[0]} RPS`,
      });
    } catch (error) {
      toast({
        title: "Load Test Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleStopLoadTest = async () => {
    try {
      await apiRequest("POST", "/api/load-test/stop", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Load Test Stopped",
        description: "Load test has been terminated",
      });
    } catch (error) {
      toast({
        title: "Pause Failed",
        description: "Could not stop load test",
        variant: "destructive",
      });
    }
  };

  const handleSimulateFailure = async (type: string) => {
    try {
      const endpoint = `/api/simulate/${type}`;
      const body = type === "database-overload" ? { duration: 45000 } : { duration: 30000 };
      
      await apiRequest("POST", endpoint, body);
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      const failureTypes = {
        "network-latency": "Network Latency",
        "service-failure": "Service Failure",
        "database-overload": "Database Overload",
        "memory-leak": "MemoryStick Leak"
      };
      
      toast({
        title: "Failure Simulation Started",
        description: `Simulating ${failureTypes[type as keyof typeof failureTypes]}`,
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

  return (
    <Card className="dashboard-card mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Load Simulation & Testing</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${data.isRunning ? "bg-blue-400 animate-pulse" : "bg-gray-400"}`} />
            <span className={`text-sm ${data.isRunning ? "text-blue-400" : "text-gray-400"}`}>
              {data.isRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300">Test Configuration</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Concurrent Users: {concurrentUsers[0]}
                </label>
                <Slider
                  value={concurrentUsers}
                  onValueChange={setConcurrentUsers}
                  max={1000}
                  min={10}
                  step={10}
                  disabled={data.isRunning}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Requests/Second: {requestsPerSecond[0]}
                </label>
                <Slider
                  value={requestsPerSecond}
                  onValueChange={setRequestsPerSecond}
                  max={100}
                  min={1}
                  step={1}
                  disabled={data.isRunning}
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleStartLoadTest}
                  disabled={data.isRunning}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Test
                </Button>
                <Button
                  onClick={handleStopLoadTest}
                  disabled={!data.isRunning}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  size="sm"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </div>
            </div>
          </div>
          
          {/* Failure Simulation */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300">Failure Simulation</h4>
            <div className="space-y-3">
              <Button
                onClick={() => handleSimulateFailure("network-latency")}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                <Zap className="mr-2 h-4 w-4" />
                Network Latency
              </Button>
              <Button
                onClick={() => handleSimulateFailure("service-failure")}
                className="w-full bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <Server className="mr-2 h-4 w-4" />
                Service Failure
              </Button>
              <Button
                onClick={() => handleSimulateFailure("database-overload")}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Database className="mr-2 h-4 w-4" />
                Database Overload
              </Button>
              <Button
                onClick={() => handleSimulateFailure("memory-leak")}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                size="sm"
              >
                <MemoryStick className="mr-2 h-4 w-4" />
                MemoryStick Leak
              </Button>
            </div>
          </div>
          
          {/* Real-time Metrics */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300">Real-time Metrics</h4>
            <div className="space-y-3">
              <div className="bg-slate-800 p-3 rounded">
                <div className="text-sm text-gray-400">Current RPS</div>
                <div className="text-xl font-bold text-blue-400">{data.currentRPS.toFixed(1)}</div>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <div className="text-sm text-gray-400">P95 Latency</div>
                <div className="text-xl font-bold text-yellow-400">{data.p95Latency}ms</div>
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <div className="text-sm text-gray-400">Error Rate</div>
                <div className="text-xl font-bold text-green-400">{data.errorRate}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
