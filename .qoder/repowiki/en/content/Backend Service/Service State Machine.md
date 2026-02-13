# Service State Machine

<cite>
**Referenced Files in This Document**
- [lib.rs](file://src-tauri/src/lib.rs)
- [main.rs](file://src-tauri/src/main.rs)
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [useServiceState.ts](file://src/hooks/useServiceState.ts)
- [Index.tsx](file://src/pages/Index.tsx)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the service state machine that powers the Hutch-Kick application. The state machine manages the lifecycle of a background service that periodically "kicks" the Hutch self-care page to maintain connectivity. It defines five states: Stopped, Starting, Running, Stopping, and Error. The implementation enforces strict state transitions, captures comprehensive snapshots of the service state, and ensures thread-safe access using a shared state container with an internal mutex. The frontend integrates with the backend via Tauri commands to reflect real-time state changes and enable user-driven actions.

## Project Structure
The state machine resides in the Rust backend and is exposed to the React frontend through Tauri commands. The frontend polls the backend for state updates and invokes commands to start, stop, or manually trigger kicks.

```mermaid
graph TB
subgraph "Frontend (React)"
UI["UI Components<br/>Index.tsx"]
Hook["State Hook<br/>useServiceState.ts"]
end
subgraph "Tauri Bridge"
Invoke["Invoke Commands<br/>get_status/start_service/stop_service/kick_now/set_interval"]
end
subgraph "Backend (Rust)"
Lib["State Machine Implementation<br/>lib.rs"]
Worker["Worker Loop<br/>worker_loop()"]
Snapshot["ServiceSnapshot<br/>snapshot()"]
end
UI --> Hook
Hook --> Invoke
Invoke --> Lib
Lib --> Worker
Lib --> Snapshot
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L61-L114)
- [lib.rs](file://src-tauri/src/lib.rs#L415-L473)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L88-L107)
- [Index.tsx](file://src/pages/Index.tsx#L9-L52)

**Section sources**
- [README.md](file://README.md#L22-L50)
- [lib.rs](file://src-tauri/src/lib.rs#L61-L114)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L67-L107)

## Core Components
- ServiceMachineState: Enumerates the five states (Stopped, Starting, Running, Stopping, Error).
- ServiceSnapshot: Immutable view of the service state, including current state, Wi-Fi and internet status, last kick time, interval, logs, and error message.
- InnerState: Mutable state container holding the current state, statuses, timing, logs, error message, worker handle, and HTTP client.
- SharedState: Thread-safe wrapper around InnerState using Arc<Mutex<InnerState>>.
- Transition Validation: A deterministic function that validates allowed transitions between states.
- Worker Loop: Background task that periodically checks connectivity, performs kicks, and updates state.
- Tauri Commands: Exposed commands for UI interaction (start, stop, manual kick, status query, interval setting).

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L27-L35)
- [lib.rs](file://src-tauri/src/lib.rs#L61-L71)
- [lib.rs](file://src-tauri/src/lib.rs#L73-L84)
- [lib.rs](file://src-tauri/src/lib.rs#L143-L158)
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)
- [lib.rs](file://src-tauri/src/lib.rs#L415-L473)
- [lib.rs](file://src-tauri/src/lib.rs#L599-L651)

## Architecture Overview
The state machine follows a finite state machine pattern with explicit validation and a snapshot-based query mechanism. The backend exposes commands to the frontend, which polls for updates and triggers actions. The worker loop runs only while the service is in the Running state, checking connectivity and performing periodic kicks.

```mermaid
sequenceDiagram
participant UI as "Frontend UI"
participant Hook as "useServiceState.ts"
participant Tauri as "Tauri Commands"
participant State as "SharedState"
participant Worker as "worker_loop"
UI->>Hook : User clicks Start
Hook->>Tauri : invoke start_service
Tauri->>State : start_service_internal()
State->>State : transition(Stopped -> Starting)
State->>State : transition(Starting -> Running)
State->>Worker : spawn worker loop
Worker->>Worker : periodic checks
Worker->>State : update statuses/logs
Tauri-->>Hook : ServiceSnapshot
Hook-->>UI : Updated state
UI->>Hook : User clicks Stop
Hook->>Tauri : invoke stop_service
Tauri->>State : stop_service_internal()
State->>State : transition(Running -> Stopping)
State->>Worker : abort worker
State->>State : transition(Stopping -> Stopped)
Tauri-->>Hook : ServiceSnapshot
Hook-->>UI : Updated state
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)
- [lib.rs](file://src-tauri/src/lib.rs#L415-L473)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L109-L125)

## Detailed Component Analysis

### State Machine Definition and Transitions
The state machine defines five states and a deterministic transition function that validates allowed transitions. The function accepts any transition to Error and any transition from Error to Stopped, plus the following ordered transitions:
- Stopped -> Starting
- Starting -> Running
- Starting -> Stopped
- Running -> Stopping
- Stopping -> Stopped

```mermaid
stateDiagram-v2
[*] --> Stopped
Stopped --> Starting : "start_service_internal()"
Starting --> Running : "network/internet OK"
Starting --> Stopped : "start blocked/error"
Running --> Stopping : "stop_service_internal() or connectivity lost"
Stopping --> Stopped : "stopped"
Running --> Error : "unexpected failure"
Error --> Stopped : "recover to Stopped"
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L27-L35)
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L27-L35)
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)

### ServiceSnapshot and State Representation
ServiceSnapshot encapsulates the complete service state for UI consumption:
- current_state: Current state of the service
- wifi_status: Wi-Fi connectivity status
- internet_status: Internet availability status
- last_kick_time_ms: Timestamp of the last successful kick
- interval_seconds: Kick interval in seconds
- logs: Recent log entries
- error_message: Last error message if any

The snapshot is generated from InnerState and is immutable, enabling safe sharing across threads and UI updates.

```mermaid
classDiagram
class ServiceSnapshot {
+ServiceMachineState current_state
+WifiStatus wifi_status
+InternetStatus internet_status
+Option~u64~ last_kick_time_ms
+u64 interval_seconds
+Vec~LogEvent~ logs
+Option~String~ error_message
}
class InnerState {
+ServiceMachineState current_state
+WifiStatus wifi_status
+InternetStatus internet_status
+Option~SystemTime~ last_kick_time
+u64 interval_seconds
+VecDeque~LogEvent~ logs
+u64 next_log_id
+Option~String~ error_message
+Option~JoinHandle~ worker_handle
+Client client
+snapshot() ServiceSnapshot
+transition(ServiceMachineState) Result
+push_log(String)
}
class SharedState {
-Arc~Mutex~InnerState~~ inner
+new(Client) SharedState
+lock() MutexGuard
+snapshot() ServiceSnapshot
}
InnerState --> ServiceSnapshot : "creates"
SharedState --> InnerState : "wraps"
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L61-L71)
- [lib.rs](file://src-tauri/src/lib.rs#L73-L84)
- [lib.rs](file://src-tauri/src/lib.rs#L143-L158)
- [lib.rs](file://src-tauri/src/lib.rs#L104-L114)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L61-L71)
- [lib.rs](file://src-tauri/src/lib.rs#L73-L84)
- [lib.rs](file://src-tauri/src/lib.rs#L104-L114)
- [lib.rs](file://src-tauri/src/lib.rs#L143-L158)

### Thread-Safe State Management
SharedState wraps InnerState in Arc<Mutex<InnerState>> to ensure thread-safe access across asynchronous tasks and Tauri commands. The lock() method returns a MutexGuard, and snapshot() creates an immutable copy of the state for UI consumption.

Key characteristics:
- Atomic access to state changes
- Snapshot pattern prevents long-held locks during UI rendering
- Poisoned mutex recovery using unwrap_or_else to continue operation

```mermaid
flowchart TD
Start(["Access SharedState"]) --> Lock["Lock inner Mutex"]
Lock --> Mutate["Mutate InnerState<br/>transition()/push_log()"]
Mutate --> Unlock["Unlock Mutex"]
Unlock --> Snapshot["Create ServiceSnapshot"]
Snapshot --> Return(["Return immutable snapshot"])
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L143-L158)
- [lib.rs](file://src-tauri/src/lib.rs#L104-L114)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L143-L158)
- [lib.rs](file://src-tauri/src/lib.rs#L104-L114)

### Transition Validation Logic
The transition validator enforces the state machine rules. It allows:
- Any transition to Error
- Recovery from Error to Stopped
- Ordered transitions: Stopped -> Starting -> Running
- Reverse transitions: Running -> Stopping -> Stopped
- Immediate stop from Starting to Stopped

```mermaid
flowchart TD
A["From: Stopped"] --> B{"To: Starting?"}
B --> |Yes| Valid["Valid"]
B --> |No| C{"To: Error?"}
C --> |Yes| Valid
C --> |No| Invalid["Invalid"]
D["From: Starting"] --> E{"To: Running or Stopped?"}
E --> |Yes| Valid
E --> |No| F{"To: Error?"}
F --> |Yes| Valid
F --> |No| Invalid
G["From: Running"] --> H{"To: Stopping?"}
H --> |Yes| Valid
H --> |No| I{"To: Error?"}
I --> |Yes| Valid
I --> |No| Invalid
J["From: Stopping"] --> K{"To: Stopped?"}
K --> |Yes| Valid
K --> |No| Invalid
L["From: Error"] --> M{"To: Stopped?"}
M --> |Yes| Valid
M --> |No| Invalid
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)

### State Change Triggers and User Actions
User actions trigger state changes through Tauri commands invoked by the frontend hook:

- Start action:
  - Calls start_service command
  - Validates network and internet connectivity
  - Transitions to Starting, then Running, spawns worker loop
  - On failure, transitions to Error, then Stopped

- Stop action:
  - Calls stop_service command
  - Transitions to Stopping, aborts worker, then to Stopped

- Manual kick:
  - Calls kick_now command
  - Sends a single kick request
  - On failure, transitions to Error, then Stopped

- Interval change:
  - Calls set_interval command
  - Updates the kick interval (minimum enforced)

```mermaid
sequenceDiagram
participant UI as "Frontend UI"
participant Hook as "useServiceState.ts"
participant Tauri as "Tauri Commands"
participant State as "SharedState"
UI->>Hook : Start
Hook->>Tauri : start_service
Tauri->>State : transition(Stopped -> Starting)
Tauri->>State : transition(Starting -> Running)
Tauri-->>Hook : ServiceSnapshot
UI->>Hook : Stop
Hook->>Tauri : stop_service
Tauri->>State : transition(Running -> Stopping)
Tauri->>State : transition(Stopping -> Stopped)
Tauri-->>Hook : ServiceSnapshot
UI->>Hook : Kick Now
Hook->>Tauri : kick_now
Tauri->>State : push_log + last_kick_time
Tauri-->>Hook : ServiceSnapshot
```

**Diagram sources**
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L109-L134)
- [lib.rs](file://src-tauri/src/lib.rs#L599-L651)
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)
- [lib.rs](file://src-tauri/src/lib.rs#L621-L642)

**Section sources**
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L109-L134)
- [lib.rs](file://src-tauri/src/lib.rs#L599-L651)
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)
- [lib.rs](file://src-tauri/src/lib.rs#L621-L642)

### Error Handling Mechanisms
Errors are handled centrally to ensure the service recovers predictably:
- set_error_and_stop transitions to Error, records the error message, then moves to Stopped
- stop_for_connectivity transitions to Stopping and then Stopped upon network or internet loss
- start_service_internal blocks start attempts when network state is unknown or no adapter is connected
- worker_loop and manual kick failures trigger error handling

```mermaid
flowchart TD
Start(["Failure Detected"]) --> SetErr["set_error_and_stop()<br/>record error message"]
SetErr --> ToError["Transition to Error"]
ToError --> Recover["Transition to Stopped"]
Recover --> Notify["Notify user"]
Notify --> End(["Service Stopped"])
NetLoss["Network/Internet Lost"] --> StopFlow["stop_for_connectivity()<br/>Stopping -> Stopped"]
StopFlow --> Notify
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L193-L205)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L193-L205)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)

### Worker Loop and Periodic Operations
The worker loop runs while the service is Running:
- Checks Wi-Fi connectivity
- Verifies internet availability
- Performs a kick request
- Updates last kick time and logs
- Respects the configured interval (minimum enforced)

```mermaid
flowchart TD
Enter(["worker_loop entry"]) --> CheckState["Check current state == Running"]
CheckState --> |No| Exit(["Exit loop"])
CheckState --> |Yes| NetCheck["Check Wi-Fi connectivity"]
NetCheck --> NetOK{"Connected?"}
NetOK --> |No| StopNet["stop_for_connectivity(true)"]
NetOK --> |Yes| Internet["Check internet online"]
Internet --> InternetOK{"Online?"}
InternetOK --> |No| StopInt["stop_for_connectivity(false)"]
InternetOK --> |Yes| Kick["Perform kick"]
Kick --> KickOK{"Kick success?"}
KickOK --> |No| ErrStop["set_error_and_stop()"]
KickOK --> |Yes| Update["Update last_kick_time + log"]
Update --> Sleep["Sleep for interval"]
Sleep --> CheckState
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs#L415-L473)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)
- [lib.rs](file://src-tauri/src/lib.rs#L193-L205)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L415-L473)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)
- [lib.rs](file://src-tauri/src/lib.rs#L193-L205)

### Frontend Integration and State Queries
The frontend uses a React hook to poll the backend for state updates and invoke commands:
- Polling interval: 1200 ms
- Commands: get_status, start_service, stop_service, kick_now, set_interval
- Snapshot mapping: Converts backend timestamps and enumerations to frontend types
- Error handling: Displays error messages and marks backend connectivity

```mermaid
sequenceDiagram
participant Hook as "useServiceState.ts"
participant Tauri as "Tauri Commands"
participant State as "SharedState"
Hook->>Tauri : invoke get_status
Tauri->>State : snapshot()
State-->>Tauri : ServiceSnapshot
Tauri-->>Hook : BackendSnapshot
Hook->>Hook : applySnapshot()
Hook->>Tauri : invoke start_service
Tauri->>State : start_service_internal()
State-->>Tauri : ServiceSnapshot
Tauri-->>Hook : BackendSnapshot
Hook->>Hook : applySnapshot()
```

**Diagram sources**
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L88-L107)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L109-L134)
- [lib.rs](file://src-tauri/src/lib.rs#L599-L651)
- [lib.rs](file://src-tauri/src/lib.rs#L155-L157)

**Section sources**
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L88-L107)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L109-L134)
- [lib.rs](file://src-tauri/src/lib.rs#L599-L651)
- [lib.rs](file://src-tauri/src/lib.rs#L155-L157)

## Dependency Analysis
The backend depends on Tauri for system integration, reqwest for HTTP requests, tokio for async runtime, and serde for serialization. The frontend communicates with the backend via Tauri commands and React state.

```mermaid
graph TB
Frontend["Frontend (React)"]
Hook["useServiceState.ts"]
Commands["Tauri Commands"]
Backend["Rust Backend (lib.rs)"]
Tauri["Tauri Runtime"]
Reqwest["reqwest"]
Tokio["tokio"]
Serde["serde"]
Frontend --> Hook
Hook --> Commands
Commands --> Tauri
Tauri --> Backend
Backend --> Reqwest
Backend --> Tokio
Backend --> Serde
```

**Diagram sources**
- [Cargo.toml](file://src-tauri/Cargo.toml#L20-L28)
- [lib.rs](file://src-tauri/src/lib.rs#L1-L15)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L1-L10)

**Section sources**
- [Cargo.toml](file://src-tauri/Cargo.toml#L20-L28)
- [lib.rs](file://src-tauri/src/lib.rs#L1-L15)
- [useServiceState.ts](file://src/hooks/useServiceState.ts#L1-L10)

## Performance Considerations
- Minimum interval enforcement: Ensures the worker loop does not exceed reasonable polling rates.
- Snapshot pattern: Reduces lock contention by returning immutable snapshots for UI rendering.
- Worker abort: Gracefully stops the worker when transitioning away from Running.
- Logging limit: Maintains a bounded log buffer to prevent memory growth.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and recovery steps:
- Network state unknown: Start blocked; connect Wi-Fi/Ethernet or check system network adapters.
- No active network adapter: Start blocked; connect a network adapter.
- Internet offline: Start blocked; resolve connectivity issues.
- Unexpected failure: Service transitions to Error, then Stopped; review logs for details.
- Connectivity loss: Service automatically transitions to Stopping and Stopped; reconnect and restart.

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)
- [lib.rs](file://src-tauri/src/lib.rs#L193-L205)

## Conclusion
The service state machine provides a robust, thread-safe foundation for managing the Hutch-Kick service lifecycle. Its deterministic transitions, comprehensive snapshots, and centralized error handling ensure predictable behavior and reliable user experience. The frontend integration via Tauri commands enables responsive UI updates and intuitive user controls.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### State Transition Table
Allowed transitions:
- Stopped -> Starting
- Starting -> Running
- Starting -> Stopped
- Running -> Stopping
- Stopping -> Stopped
- Any state -> Error
- Error -> Stopped

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L160-L171)

### Example Scenarios
- Normal start: Stopped -> Starting -> Running; worker loop begins.
- User stop: Running -> Stopping -> Stopped; worker aborted.
- Network disconnect: Running -> Stopping -> Stopped; notification sent.
- Manual kick failure: Running -> Error -> Stopped; notification sent.
- Interval change: Running state unaffected; next kick uses new interval.

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs#L475-L564)
- [lib.rs](file://src-tauri/src/lib.rs#L566-L597)
- [lib.rs](file://src-tauri/src/lib.rs#L373-L413)
- [lib.rs](file://src-tauri/src/lib.rs#L621-L642)