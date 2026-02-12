import { useState, useCallback } from "react";

export type ServiceStatus = "RUNNING" | "STOPPED" | "STARTING" | "ERROR";
export type KickInterval = "60" | "120" | "300";

export interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
}

interface ServiceState {
  status: ServiceStatus;
  wifiConnected: boolean;
  internetOnline: boolean;
  lastKick: Date | null;
  autoRestart: boolean;
  kickInterval: KickInterval;
  logs: LogEntry[];
  errorMessage: string | null;
}

const initialState: ServiceState = {
  status: "STOPPED",
  wifiConnected: true,
  internetOnline: true,
  lastKick: null,
  autoRestart: false,
  kickInterval: "120",
  logs: [
    { id: "1", message: "Service initialized", timestamp: new Date(Date.now() - 300000) },
    { id: "2", message: "Wi-Fi connected", timestamp: new Date(Date.now() - 240000) },
    { id: "3", message: "Ready to start", timestamp: new Date(Date.now() - 60000) },
  ],
  errorMessage: null,
};

let logCounter = 4;

export function useServiceState() {
  const [state, setState] = useState<ServiceState>(initialState);

  const addLog = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      logs: [
        { id: String(logCounter++), message, timestamp: new Date() },
        ...prev.logs,
      ].slice(0, 50),
    }));
  }, []);

  const startService = useCallback(() => {
    if (!state.wifiConnected || !state.internetOnline) {
      setState((prev) => ({
        ...prev,
        errorMessage: !prev.wifiConnected ? "Wi-Fi is not connected" : "No internet connection",
      }));
      addLog("Start failed — no connectivity");
      return;
    }
    setState((prev) => ({ ...prev, status: "STARTING", errorMessage: null }));
    addLog("Starting service…");
    setTimeout(() => {
      setState((prev) => ({ ...prev, status: "RUNNING", lastKick: new Date() }));
      addLog("Service started");
      addLog("Kick OK");
    }, 1500);
  }, [state.wifiConnected, state.internetOnline, addLog]);

  const stopService = useCallback(() => {
    setState((prev) => ({ ...prev, status: "STOPPED", errorMessage: null }));
    addLog("Service stopped");
  }, [addLog]);

  const kickNow = useCallback(() => {
    if (state.status !== "RUNNING") return;
    setState((prev) => ({ ...prev, lastKick: new Date() }));
    addLog("Manual kick OK");
  }, [state.status, addLog]);

  const setAutoRestart = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, autoRestart: value }));
    addLog(`Auto-restart ${value ? "enabled" : "disabled"}`);
  }, [addLog]);

  const setKickInterval = useCallback((value: KickInterval) => {
    setState((prev) => ({ ...prev, kickInterval: value }));
    addLog(`Kick interval set to ${value}s`);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, errorMessage: null }));
  }, []);

  return {
    ...state,
    startService,
    stopService,
    kickNow,
    setAutoRestart,
    setKickInterval,
    clearLogs,
    dismissError,
  };
}
