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
            wifiConnected={service.wifiConnected}
            internetOnline={service.internetOnline}
            lastKick={service.lastKick}
          />

          <PrimaryControls
            status={service.status}
            autoRestart={service.autoRestart}
            onStart={service.startService}
            onStop={service.stopService}
            onKickNow={service.kickNow}
            onAutoRestartChange={service.setAutoRestart}
            errorMessage={service.errorMessage}
            onDismissError={service.dismissError}
          />

          <AdvancedSettings
            kickInterval={service.kickInterval}
            onKickIntervalChange={service.setKickInterval}
          />

          <LogPanel logs={service.logs} onClear={service.clearLogs} />
        </div>

        <PopoverFooter version="v1.0.0" />
      </div>
    </div>
  );
};

export default Index;
