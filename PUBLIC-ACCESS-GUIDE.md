# Running Expo Go from Anywhere (Public Access)

## Option 1: Using Expo Tunnel (Recommended - Easiest)

Run the public access batch file:
```
run-mobile-public.bat
```

This uses Expo's built-in ngrok tunneling to create a public URL.

**Requirements:**
- Expo account (free at expo.dev)
- Run `npx expo login` first if not logged in

**How it works:**
1. Starts Expo dev server with `--tunnel` flag
2. Creates a public ngrok URL like `exp://xxxxx.ngrok.io:8081`
3. Scan the QR code with Expo Go from anywhere

---

## Option 2: Using Cloudflare Tunnel (More Reliable)

If you already have Cloudflare tunnel running, you can also tunnel the Expo dev server:

### Step 1: Start Cloudflare tunnel for Expo
```bash
cloudflared tunnel --url http://localhost:8081
```

### Step 2: Start Expo with LAN
```bash
run-mobile.bat
```

### Step 3: Use the Cloudflare URL
The Cloudflare tunnel will give you a URL like:
```
https://xxxxx.trycloudflare.com
```

In Expo Go, enter this URL manually:
```
exp://xxxxx.trycloudflare.com:8081
```

---

## Option 3: Using ngrok Directly

### Step 1: Install ngrok
```bash
npm install -g ngrok
```

### Step 2: Start ngrok tunnel
```bash
ngrok http 8081
```

### Step 3: Start Expo
```bash
run-mobile.bat
```

### Step 4: Use ngrok URL
Use the ngrok forwarding address in Expo Go.

---

## Troubleshooting

### "Tunnel not working"
1. Ensure you're logged in: `npx expo login`
2. Check internet connection
3. Try restarting the tunnel

### "Could not connect to development server"
1. Verify the tunnel URL is correct
2. Check that Expo dev server is running
3. Ensure firewall allows port 8081

### "API not working"
1. Verify Cloudflare tunnel for API is running
2. Check `EXPO_PUBLIC_API_URL` in run-mobile.bat
3. Test API: `curl https://fighting-flight-hebrew-contributor.trycloudflare.com/api/healthz`

---

## Quick Start Commands

```bash
# For public access (anywhere)
run-mobile-public.bat

# For local network only
run-mobile.bat
```

---

## Network Architecture

```
[Your Phone/Expo Go] 
       ↓
[Internet] → [Cloudflare/ngrok Tunnel] → [Your Computer:8081]
       ↓
[Cloudflare Tunnel] → [API Server:8080]
```

The system now works from anywhere with internet access!
