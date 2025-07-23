interface ResilienceData {
  retrySuccessRate: number;
  fallbackUsage: number;
  timeoutRate: number;
}

interface ResilienceMetricsProps {
  data: ResilienceData;
}

export default function ResilienceMetrics({ data }: ResilienceMetricsProps) {
  const metrics = [
    {
      label: "Retry Success Rate",
      value: data.retrySuccessRate,
      color: "bg-green-600"
    },
    {
      label: "Fallback Usage",
      value: data.fallbackUsage,
      color: "bg-yellow-600"
    },
    {
      label: "Timeout Rate",
      value: data.timeoutRate,
      color: "bg-red-600"
    }
  ];

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-semibold mb-4">Resilience Metrics</h3>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{metric.label}</span>
              <span className="font-medium">{metric.value}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`${metric.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
