import { useServiceState } from "@/hooks/useServiceState";
import { PopoverHeader } from "@/components/PopoverHeader";
import { StatusCard } from "@/components/StatusCard";
import { PrimaryControls } from "@/components/PrimaryControls";
import { AdvancedSettings } from "@/components/AdvancedSettings";
import { LogPanel } from "@/components/LogPanel";
import { PopoverFooter } from "@/components/PopoverFooter";

const Index = () => {
  const service = useServiceState();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background/50 p-4">
      <div className="w-[360px] h-[420px] flex flex-col rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-xl overflow-hidden">
        <PopoverHeader status={service.status} />

        <div className="h-px bg-border/30 mx-3" />

        <div className="flex-1 flex flex-col gap-3 py-3 overflow-hidden">
          <StatusCard
            wifiStatus={service.wifiStatus}
            internetStatus={service.internetStatus}
            lastKick={service.lastKick}
          />

          <PrimaryControls
            status={service.status}
            onStart={service.startService}
            onStop={service.stopService}
            onKickNow={service.kickNow}
            errorMessage={service.errorMessage}
          />

          <AdvancedSettings
            kickInterval={service.kickInterval}
            onKickIntervalChange={service.setKickInterval}
          />

          {!service.backendConnected && (
            <p className="mx-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[10px] text-destructive">
              Backend unavailable. Run this UI with Tauri desktop runtime.
            </p>
          )}

          <LogPanel logs={service.logs} />
        </div>

        <PopoverFooter version="v1.0.0" onQuit={service.quitApp} />
      </div>
    </div>
  );
};

export default Index;
