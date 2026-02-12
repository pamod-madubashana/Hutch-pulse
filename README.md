<div align='center'>
<h1>HutchKick</h1>

<img src='src-tauri/icons/icon.png' width=200>
<p>HutchKick is a lightweight Windows tray app that starts or stops a background service to "kick" your Hutch self-care page, while automatically pausing when Wi-Fi or internet drops. 📶⚡</p>
</div>

## Features

- **System Tray Integration**: Runs quietly in the system tray with quick access menu
- **Auto-Pause**: Automatically stops kicking when Wi-Fi or internet connection is lost
- **Always-On-Top Window**: Small popover window that stays on top for quick access
- **Kick Interval**: Configurable kick interval (default: 20 seconds)
- **Manual Kick**: Option to manually trigger a kick at any time
- **Real-time Status**: View Wi-Fi status, internet connectivity, and last kick time
- **Activity Logs**: Track all service activities and events

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Tauri (Rust)
- **State Management**: React Query

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Windows 10/11

### Installation

```bash
# Clone the repository
git clone https://github.com/pamod-madubashana/Hutch-Kick.git

# Navigate to project directory
cd Hutch-Kick

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Building

```bash
# Build for production
npm run tauri build
```

## Usage

1. Launch HutchKick - it will appear in your system tray
2. Click the tray icon to open the control panel
3. Click **Start** to begin the kicking service
4. The service will automatically pause when Wi-Fi or internet drops
5. Use **Kick Now** to manually trigger a kick at any time
6. Configure the kick interval in **Advanced Settings**

## Keyboard Shortcuts

- **Left-click tray icon**: Show/hide control panel
- **Right-click tray icon**: Open context menu (Show/Hide, Start/Stop, Quit)
