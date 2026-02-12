import { Play, Square, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ServiceStatus } from "@/hooks/useServiceState";

interface PrimaryControlsProps {
  status: ServiceStatus;
  autoRestart: boolean;
  onStart: () => void;
  onStop: () => void;
  onKickNow: () => void;
  onAutoRestartChange: (value: boolean) => void;
  errorMessage: string | null;
  onDismissError: () => void;
}

export function PrimaryControls({
  status,
  autoRestart,
  onStart,
  onStop,
  onKickNow,
  onAutoRestartChange,
  errorMessage,
  onDismissError,
}: PrimaryControlsProps) {
  const isRunning = status === "RUNNING";
  const isStarting = status === "STARTING";

  return (
    <div className="mx-3 space-y-2.5">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          <span>{errorMessage}</span>
          <button onClick={onDismissError} className="text-destructive/60 hover:text-destructive ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={isRunning ? onStop : onStart}
          disabled={isStarting}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
            isRunning
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5" /> Stop Service
            </>
          ) : isStarting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Starting…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Start Service
            </>
          )}
        </button>

        <button
          onClick={onKickNow}
          disabled={!isRunning}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Zap className="w-3.5 h-3.5" /> Kick Now
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
        <Label htmlFor="auto-restart" className="text-xs text-muted-foreground cursor-pointer">
          Auto-restart on reconnect
        </Label>
        <Switch
          id="auto-restart"
          checked={autoRestart}
          onCheckedChange={onAutoRestartChange}
          className="scale-75 origin-right"
        />
      </div>
    </div>
  );
}
