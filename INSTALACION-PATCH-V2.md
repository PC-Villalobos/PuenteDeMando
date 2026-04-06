# 🏴‍☠️ Thousand Sunny — Patch v2 Installation Guide

## Overview
This patch adds natural language routing and a live webapp bridge to the existing GAS script, enabling:
- Free keyword-based routing (no API costs)
- Webapp messages that flow through GAS
- Real-time bitácora polling for live feed
- Task queue system for autonomous actions

---

## Files Created

### 1. **thousand-sunny-patch-v2.js** (GAS script additions)
Functions to add to your existing `thousand-sunny-unified.js`

### 2. **thousand-sunny-bridge-v2.html** (Webapp)
Complete standalone webapp with dark theme and live chat

---

## Installation Steps

### Step 1: Update GAS Script

1. Open your Google Apps Script project: `script.google.com`
2. Open `thousand-sunny-unified.js`
3. Scroll to the END of the file
4. **Copy and paste ALL content** from `thousand-sunny-patch-v2.js` after the existing code
5. **SAVE** (Ctrl+S or Cmd+S)

#### Step 1b: Modify doPost() — Replace the `else` block

Find this section (around line 327):
```javascript
    } else {
      // Mensaje libre → Sanji responde (free tier priority)
      logBitacora_("telegram", "capitan", text, "humano", 0);
      const resp = callGemini_(text, PROMPTS.sanji);
      logBitacora_("telegram", "sanji", resp.text, GEMINI_MODEL, resp.tokens);
      enviarTelegram_(chatId, "🍳 *Sanji:*\n" + resp.text);
    }
```

**Replace it with:**
```javascript
    } else {
      handleNatural_(chatId, text);
    }
```

#### Step 1c: Modify doGet() — Add new cases

Find the `switch(action)` block in `doGet()` (around line 349).

**Before the final `default:` case, ADD:**
```javascript
      case "mensaje":
        const msgText = e.parameter.text || "";
        const msgRuta = e.parameter.ruta || "webapp";
        if (!msgText) { result = {error: "sin texto"}; break; }
        result = procesarMensajeCapitan_(msgText, msgRuta);
        break;

      case "bitacora_desde":
        const since = e.parameter.since || "";
        result = getBitacoraDesde_(since);
        break;

      case "autonomo_toggle":
        result = toggleAutonomo_();
        break;

      case "tarea_nueva":
        const tarea = e.parameter.tarea || "";
        const asignado = e.parameter.asignado || "franky";
        result = agregarTarea_(tarea, asignado);
        break;

      case "cola_estado":
        result = getColaEstado_();
        break;
```

**Save again!**

---

### Step 2: Deploy as Webapp

1. Click **"Implementar"** (top right)
2. Select **"Nueva implementación"**
3. Type: **"App web"**
4. Execute as: **"Yo"** (your account)
5. Access: **"Cualquiera"** (Anyone, the webapp needs CORS)
6. Click **"Implementar"**
7. Copy the URL (it will look like `https://script.google.com/macros/s/.../ususercontent`)

**⚠️ Save this URL — you need it for the webapp configuration!**

---

### Step 3: Deploy the Webapp (HTML)

You have two options:

#### Option A: Host on GitHub Pages (Recommended)
1. Create a GitHub repo
2. Add `thousand-sunny-bridge-v2.html` to the repo
3. Enable Pages: Settings → Pages → Deploy from branch
4. Copy the GitHub Pages URL

#### Option B: Google Sites (Simpler)
1. Create a Google Site
2. Insert → More → Embed code
3. Paste the HTML content from `thousand-sunny-bridge-v2.html`
4. Publish and copy the link

#### Option C: Self-hosted
- Upload to any web server with the HTML file
- Configure CORS headers if needed

---

### Step 4: Configure the Webapp

1. Open the webapp URL
2. A modal will appear: **"⚙️ Configuración"**
3. Paste the GAS URL from Step 2
4. Click **"Conectar"**

Done! The webapp will:
- Fetch the last 20 messages
- Start polling for new messages every 10 seconds
- Display them in real-time

---

## How It Works

### Natural Language Routing
Messages are analyzed for keywords (no API calls):

| Keywords | Nakama | Purpose |
|----------|--------|---------|
| sanji, cocin, analiz, evalúa, procesa | **Sanji** | Analysis & evaluation |
| usopp, creativ, patrón, conexi, narra | **Usopp** | Creative connections |
| zoro, muev, corta, elimina, drive, archiv | **Zoro** | Drive actions |
| robin, clasific, organiz, contenido | **Robin** | Classification |
| chopper, caso, pacient, clínic, patrón | **Chopper** | Clinical patterns |
| nami, estado, rumbo, barco, cómo va | **Nami** | Status updates |
| todos, tripulación, crew, nakama, opinen | **ALL** | Full crew discussion |
| (no match) | **Sanji** | Default (free tier) |

### Message Flow

**Telegram → GAS:**
1. `/start`, `/sanji msg`, `/tripulacion msg` → old commands still work
2. Free text → `handleNatural_()` → keyword routing → Telegram output

**Webapp → GAS:**
1. User types in webapp → `?action=mensaje&text=...&ruta=webapp`
2. GAS routes naturally
3. Responses logged to bitácora
4. Webapp polls `?action=bitacora_desde&since=TIMESTAMP`
5. Messages appear in real-time

**Autonomous → Telegram/Webapp:**
- `cicloAutonomo()` runs every 5 minutes (existing trigger)
- New messages logged with `ruta="autonomo"`
- Webapp sees them in live feed

### Task Queue (Optional)

For future automation:
```javascript
// Create a task
agregarTarea_("Analizar Drive", "franky")

// Get queue status
getColaEstado_()
```

---

## Testing

### Test Natural Routing (Telegram)
```
/start
hello sanji          → Sanji responds
crear un documento   → Zoro activates
how are we doing     → Nami responds
```

### Test Webapp
1. Open webapp URL
2. Enter your GAS URL in setup
3. Type a message
4. Responses should appear in real-time
5. Check Telegram — same message appears there too

### Verify Bitácora
1. Open your GAS "Bitácora" sheet
2. Should have rows with: timestamp, ruta (telegram/webapp/autonomo), nakama, mensaje

---

## Troubleshooting

**Q: Webapp says "Estado: red"?**
- Check GAS URL is correct (no trailing slash)
- Make sure GAS is published as **"App web"** not **"Library"**
- Check browser console (F12) for errors

**Q: Messages not appearing live?**
- Polling runs every 10 seconds — might have delay
- Check Bitácora sheet in GAS — are messages being logged?
- Refresh webapp manually

**Q: Webapp sends to Telegram when I don't want it?**
- If `ruta !== "telegram"`, messages go to Telegram too
- Edit `procesarMensajeCapitan_()` to control this

**Q: Natural routing not working?**
- Keywords must match the `routeNatural_()` regex
- Check logs: GAS Editor → Execution logs
- Add more keywords if needed

---

## Customization

### Add Keywords to Routing
Edit `routeNatural_()`:
```javascript
// Add new keywords for Sanji
if (/sanji|cook|process|NEW_KEYWORD/.test(lower)) {
  return ['sanji'];
}
```

### Change Polling Interval
In webapp, find this line:
```javascript
pollInterval = setInterval(pollMessages, 10000); // 10 seconds
```
Change `10000` to desired milliseconds (e.g., `5000` for 5 seconds).

### Add New Nakamas
1. Add emoji: `EMOJIS.nuevo = '🆕'`
2. Add color: `COLORS.nuevo = '#123456'`
3. Add keywords to `routeNatural_()`
4. Add response logic to `handleNatural_()` and `procesarMensajeCapitan_()`

---

## API Reference

### GET Actions

| Action | Parameters | Returns |
|--------|-----------|---------|
| `mensaje` | `text`, `ruta` | `{responses: [...]}` |
| `bitacora_desde` | `since` (ISO timestamp) | `[{timestamp, ruta, nakama, mensaje, motor, tokens}]` |
| `autonomo_toggle` | - | `{ok: true, estado: "on\|off"}` |
| `tarea_nueva` | `tarea`, `asignado` | `{ok: true, id: "TASK-123"}` |
| `cola_estado` | - | `{pendientes: N, procesadas: N, completadas: N, tareas: [...]}` |

### Example Requests

```javascript
// Send message from webapp
fetch(`${gasUrl}?action=mensaje&text=Hola&ruta=webapp`)
  .then(r => r.json())
  .then(d => console.log(d.responses));

// Get messages since timestamp
fetch(`${gasUrl}?action=bitacora_desde&since=2025-01-15T10:30:00Z`)
  .then(r => r.json())
  .then(messages => console.log(messages));

// Toggle autonomous mode
fetch(`${gasUrl}?action=autonomo_toggle`)
  .then(r => r.json())
  .then(d => console.log(d.estado)); // "on" or "off"
```

---

## Support

For issues:
1. Check GAS logs: **View → Execution logs**
2. Check Bitácora sheet for message entries
3. Check browser console (F12) on webapp
4. Verify API keys in GAS properties (if using Gemini/OpenAI)

---

**🏴‍☠️ ¡Buen viaje, Capitán!**
