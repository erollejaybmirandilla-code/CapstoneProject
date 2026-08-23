# Quick Start Guide

## How to Run the System

### Option 1: All-in-One (Easiest)

```bash
run-all.bat
```

This starts both the API server and Expo automatically.

---

### Option 2: Separate Terminals (More Control)

**Terminal 1 - Start API Server:**
```bash
run-dev.bat
```

**Terminal 2 - Start Expo:**
```bash
run-mobile.bat
```

---

## Batch Files Summary

| File | Purpose | Network |
|------|---------|---------|
| `run-all.bat` | Start everything automatically | Same WiFi |
| `run-dev.bat` | Start API server only | - |
| `run-server.bat` | Start API (production mode) | - |
| `run-mobile.bat` | Start Expo | Same WiFi |

---

## First Time Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the system:**
   ```bash
   run-all.bat
   ```

---

## Connecting with Expo Go

1. Install **Expo Go** on your phone
2. Make sure phone and computer are on same WiFi
3. Run `run-all.bat`
4. Scan the QR code with Expo Go

---

## Accessing from Different Network

To use the app from a different WiFi/network:

1. **Deploy the API** to a hosting service:
   - Railway: https://railway.app
   - Render: https://render.com

2. **Update API URL** in `artifacts/mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=https://your-deployed-api.com/api
   ```

3. **Run the app:**
   ```bash
   run-mobile.bat
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API server not detected" | Start `run-dev.bat` first |
| "Could not connect" | Check firewall allows ports 8080 and 8081 |
| App loads but no data | Make sure API server is running |

---

## No External Services

This system uses:
- **Local API server** (no Cloudflare)
- **LAN connection** (no ngrok/tunneling)
- **No third-party tunneling services**
