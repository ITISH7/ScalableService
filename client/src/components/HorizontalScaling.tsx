import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ScalingData {
  totalInstances: number;
  services: Array<{
    name: string;
    instanceCount: number;
    load: number;
    status: string;
    canScaleUp: boolean;
    canScaleDown: boolean;
  }>;
}

interface HorizontalScalingProps {
  data: ScalingData;
}

export default function HorizontalScaling({ data }: HorizontalScalingProps) {
  const { toast } = useToast();

  const handleScaleUp = async (serviceName: string) => {
    try {
      await apiRequest("POST", `/api/services/${serviceName}/scale-up`, {});
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Scaled Up",
        description: `${serviceName} has been scaled up`,
      });
    } catch (error) {
      toast({
        title: "Scale Up Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleScaleDown = async (serviceName: string) => {
    try {
      await apiRequest("POST", `/api/services/${serviceName}/scale-down`, {});
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Scaled Down",
        description: `${serviceName} has been scaled down`,
      });
    } catch (error) {
      toast({
        title: "Scale Down Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Use the first API service for the main display
  const apiService = data.services.find(s => s.name.includes("api-service")) || data.services[0];

  if (!apiService) {
    return (
      <div className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-4">Horizontal Scaling</h3>
        <p className="text-gray-400">No services available</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-semibold mb-4">Horizontal Scaling</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{apiService.name}</span>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{apiService.instanceCount}</span>
            <span className="text-gray-400">instances</span>
          </div>
        </div>
        
        {/* Visual representation of instances */}
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded ${
                i < apiService.instanceCount ? "bg-green-600" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => handleScaleUp(apiService.name)}
            disabled={!apiService.canScaleUp}
            size="sm"
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="mr-1 h-3 w-3" />
            Scale Up
          </Button>
          <Button
            onClick={() => handleScaleDown(apiService.name)}
            disabled={!apiService.canScaleDown}
            size="sm"
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <Minus className="mr-1 h-3 w-3" />
            Scale Down
          </Button>
        </div>
      </div>
    </div>
  );
}
