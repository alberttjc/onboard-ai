"use client";

/**
 * Logs Panel - Right sidebar with console logs only
 * Extracted from the monolithic ConsolePanel for better separation of concerns
 */

import React, { memo, useMemo } from "react";
import { useLiveAPI } from "@/contexts/LiveAPIProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogsPanelProps {
  onClose?: () => void;
  className?: string;
}

const LogEntry = memo(({ log }: { log: any }) => {
  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400 bg-red-950/20 border-red-900/30";
      case "warning":
        return "text-yellow-400 bg-yellow-950/20 border-yellow-900/30";
      case "success":
        return "text-green-400 bg-green-950/20 border-green-900/30";
      default:
        return "text-blue-400 bg-blue-950/20 border-blue-900/30";
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`text-xs border rounded-lg p-2 mb-1 ${getLogColor(log.type)}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{getLogIcon(log.type)}</span>
          <Badge variant="outline" className="text-xs">
            {log.type}
          </Badge>
          <span className="text-gray-500">{log.timestamp}</span>
        </div>
      </div>
      <p className="text-gray-200 mb-1 leading-tight">{log.message}</p>
      {log.data && (
        <details className="mt-1">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs">
            Details
          </summary>
          <pre className="text-xs mt-1 p-2 bg-gray-900 rounded overflow-x-auto max-h-24 overflow-y-auto">
            {JSON.stringify(log.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
});

LogEntry.displayName = "LogEntry";

const LogsPanel = memo(({ onClose, className = "" }: LogsPanelProps) => {
  const { state, clearLogs } = useLiveAPI();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");

  // Memoize filtered logs for performance
  const filteredLogs = useMemo(() => {
    let logs = state.logs;
    
    // Filter by type
    if (filterType !== "all") {
      logs = logs.filter(log => log.type === filterType);
    }
    
    // Filter by search term
    if (searchTerm) {
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Show latest first and limit for performance
    return logs.slice(-100).reverse();
  }, [state.logs, searchTerm, filterType]);

  const downloadLogs = () => {
    const logsText = state.logs
      .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}${
        log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''
      }`)
      .join('\n\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const logTypeStats = useMemo(() => {
    const stats = state.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [state.logs]);

  return (
    <div className={`w-96 bg-black border-l border-gray-800 transition-all duration-300 h-screen ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 lg:p-4 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg lg:text-lg text-xl font-semibold">Console Logs</h2>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white w-10 h-10 lg:w-auto lg:h-auto"
              >
                <X className="w-5 h-5 lg:w-4 lg:h-4" />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              Total: {state.logs.length}
            </Badge>
            {logTypeStats.success && (
              <Badge variant="outline" className="text-xs text-green-400">
                ✅ {logTypeStats.success}
              </Badge>
            )}
            {logTypeStats.error && (
              <Badge variant="outline" className="text-xs text-red-400">
                ❌ {logTypeStats.error}
              </Badge>
            )}
            {logTypeStats.warning && (
              <Badge variant="outline" className="text-xs text-yellow-400">
                ⚠️ {logTypeStats.warning}
              </Badge>
            )}
            {logTypeStats.info && (
              <Badge variant="outline" className="text-xs text-blue-400">
                ℹ️ {logTypeStats.info}
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-xs"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-xs">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                    All Types
                  </SelectItem>
                  <SelectItem value="info" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                    Info
                  </SelectItem>
                  <SelectItem value="success" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                    Success
                  </SelectItem>
                  <SelectItem value="warning" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                    Warning
                  </SelectItem>
                  <SelectItem value="error" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                    Error
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                size="sm"
                variant="outline"
                onClick={downloadLogs}
                className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-xs"
                title="Download logs"
              >
                <Download className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearLogs}
                className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Content */}
        <ScrollArea className="flex-1 p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">
                {searchTerm || filterType !== "all" 
                  ? "No logs match your filters" 
                  : "No logs yet. Connect to start seeing activity."}
              </p>
              {(searchTerm || filterType !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                  }}
                  className="mt-2 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
});

LogsPanel.displayName = "LogsPanel";

export default LogsPanel;