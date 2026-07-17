# ⚠️ DISCONTINUED DEMO - vfs-visa-automation-demo

> [!WARNING]
> **This repository is a discontinued demo project.** It is no longer actively maintained or supported. The code herein is preserved solely as a prototype/demonstration of local automation capabilities.

---

# VFS Global Visa Booking Automation Demo

A local automation environment and simulation dashboard for automating visa booking appointments. This project demonstrated methods to bypass security layers (like Cloudflare Turnstile) and coordinate local browser processes through a Next.js interface.

---

## 📂 Repository Structure

The project is structured as a pnpm monorepo:

```
├── web/                  # Next.js 16 Web Dashboard Application
│   ├── src/
│   │   ├── app/          # App router endpoints & page view
│   │   │   ├── api/      # REST API route to trigger local bot execution
│   │   │   └── page.tsx  # Interactive Control Panel UI
│   │   └── ...
│   └── package.json
│
├── bot/                  # Playwright-based Stealth Automation Engine
│   ├── src/
│   │   └── vfs-demo-runner.ts  # Main automation script using CDP
│   └── package.json
│
├── mock/                 # Mock & Simulation Interfaces
│   └── KONTROLPANELISIMULASYONU.html # Static high-fidelity mockup dashboard
│
├── package.json          # Root monorepo configuration
├── pnpm-workspace.yaml   # Workspace packages mapping
└── pnpm-lock.yaml        # Monorepo lockfile
```

---

## ⚙️ Setup & Local Execution

### 1. Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** (v9+ recommended)
- **Google Chrome** installed locally

---

### 2. Browser Debug Mode Configuration

To bypass anti-bot and ja3/ja4 fingerprinting checks, the bot does not launch Chrome natively. Instead, it attaches to an existing Chrome browser instance via **Chrome DevTools Protocol (CDP)** on port `9222`.

Before starting the bot, launch Google Chrome in debugging mode using the following terminal command:

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="/home/sezin/Documents/vizetest/bot/.chrome-debug-profile"
```

> [!IMPORTANT]
> The target Google Chrome instance **must remain open** and be active on port `9222` for the Playwright engine to attach.

---

### 3. Installation

Install all package dependencies for the monorepo:

```bash
pnpm install
```

---

### 4. Running the Dashboard

Start the Next.js development dashboard server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the Control Panel. From here, you can trigger the local Playwright bot by clicking **"VFS Demo Botunu Başlat"**.

---

### 5. Running the Bot Directly (CLI)

If you prefer to trigger the Playwright bot directly via command line:

```bash
pnpm bot:start
```

---

## 💡 Architecture & Bypass Strategy

- **CDP Attachment**: Attaching to a real, user-driven Chrome process ensures that TLS fingerprints, HTTP/2 configurations, and browser environment settings are exactly those of a standard consumer system.
- **Human Simulation**: Mouse moves are generated using Bezier curves with varying steps/latencies; keyboard inputs utilize variable delays per keystroke.
- **Turnstile Handshake**: Integrates check logic on Cloudflare Turnstile iframes, simulating natural clicks and verifying the generation of `cf-turnstile-response`.
