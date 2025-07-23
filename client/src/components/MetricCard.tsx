interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: "green" | "blue" | "yellow" | "red";
}

export default function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: "bg-green-900/30 text-green-400",
    blue: "bg-blue-900/30 text-blue-400",
    yellow: "bg-yellow-900/30 text-yellow-400",
    red: "bg-red-900/30 text-red-400",
  };

  const valueColorClasses = {
    green: "text-green-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${valueColorClasses[color]}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
