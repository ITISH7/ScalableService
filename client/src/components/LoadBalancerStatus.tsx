interface LoadBalancerData {
  totalServices: number;
  healthyServices: number;
  services: Array<{
    id: number;
    name: string;
    status: string;
    load: number;
    instanceCount: number;
  }>;
}

interface LoadBalancerStatusProps {
  data: LoadBalancerData;
}

export default function LoadBalancerStatus({ data }: LoadBalancerStatusProps) {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Load Balancer Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-400 text-sm">Active</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.services.slice(0, 3).map((service) => (
          <div key={service.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                service.status === "healthy" ? "bg-green-400" :
                service.status === "degraded" ? "bg-yellow-400" : "bg-red-400"
              }`} />
              <span className="font-medium">{service.name}</span>
              <span className="text-gray-400 text-sm">
                {service.instanceCount} instance{service.instanceCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Load</div>
              <div className="font-medium">{service.load}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
