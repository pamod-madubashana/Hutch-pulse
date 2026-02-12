import { Wifi, WifiOff, Globe, Clock } from "lucide-react";

interface StatusCardProps {
  wifiConnected: boolean;
  internetOnline: boolean;
  lastKick: Date | null;
}

function timeAgo(date: Date | null): string {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function StatusCard({ wifiConnected, internetOnline, lastKick }: StatusCardProps) {
  const rows = [
    {
      icon: wifiConnected ? Wifi : WifiOff,
      label: "Wi-Fi",
      value: wifiConnected ? "Connected" : "Off",
      ok: wifiConnected,
    },
    {
      icon: Globe,
      label: "Internet",
      value: internetOnline ? "Online" : "Offline",
      ok: internetOnline,
    },
    {
      icon: Clock,
      label: "Last Kick",
      value: timeAgo(lastKick),
      ok: true,
    },
  ];

  return (
    <div className="mx-3 rounded-lg glass-surface p-3 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <row.icon className="w-3.5 h-3.5" />
            <span>{row.label}</span>
          </div>
          <span className={`font-medium ${row.ok ? "text-foreground" : "text-destructive"}`}>
            {row.value}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
        Service stops automatically if Wi-Fi or internet drops.
      </p>
    </div>
  );
}
