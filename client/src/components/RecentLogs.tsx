import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

interface RecentLogsProps {
  data: LogEntry[];
}

export default function RecentLogs({ data }: RecentLogsProps) {
  const { toast } = useToast();

  const handleClearLogs = async () => {
    try {
      await apiRequest("DELETE", "/api/logs", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Logs Cleared",
        description: "All log entries have been cleared",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Could not clear logs",
        variant: "destructive",
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "bg-red-400";
      case "warn": return "bg-yellow-400";
      case "info": return "bg-blue-400";
      default: return "bg-gray-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Events & Logs</CardTitle>
          <Button
            onClick={handleClearLogs}
            variant="outline"
            size="sm"
            className="text-red-400 hover:text-red-300 border-red-400/50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent logs</p>
          ) : (
            data.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-2 hover:bg-slate-800 rounded text-sm transition-colors"
              >
                <span className="text-gray-400 text-xs mt-1 min-w-[60px]">
                  {formatTimestamp(log.timestamp)}
                </span>
                <div className={`w-2 h-2 rounded-full mt-2 ${getLevelColor(log.level)}`} />
                <span className="flex-1">{log.message}</span>
                <span className="text-gray-500 text-xs min-w-[80px] text-right">
                  {log.source}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
