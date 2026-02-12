import { Play, Square, Zap } from "lucide-react";
import type { ServiceStatus } from "@/hooks/useServiceState";

interface PrimaryControlsProps {
  status: ServiceStatus;
  onStart: () => void;
  onStop: () => void;
  onKickNow: () => void;
  errorMessage: string | null;
}

export function PrimaryControls({
  status,
  onStart,
  onStop,
  onKickNow,
  errorMessage,
}: PrimaryControlsProps) {
  const isRunning = status === "RUNNING";
  const isStarting = status === "STARTING";
  const isStopping = status === "STOPPING";

  return (
    <div className="mx-3 space-y-2.5">
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={isRunning ? onStop : onStart}
          disabled={isStarting || isStopping}
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
          ) : isStopping ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Stopping…
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
    </div>
  );
}
