interface Shard {
  id: number;
  name: string;
  range: string;
  load: number;
  status: string;
  recordCount: number;
}

interface DataShardingProps {
  data: Shard[];
}

export default function DataSharding({ data }: DataShardingProps) {
  const getStatusColor = (load: number) => {
    if (load > 80) return "bg-red-400";
    if (load > 60) return "bg-yellow-400";
    return "bg-green-400";
  };

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-semibold mb-4">Data Sharding</h3>
      <div className="space-y-3">
        {data.map((shard) => (
          <div key={shard.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-sm">{shard.name} ({shard.range})</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(shard.load)}`} />
              <span className="text-xs text-gray-400">{shard.load}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
