# Thousand Sunny - Ecosistema Multi-IA

Arquitectura multi-agente con Google Apps Script, Google Drive y tres motores de IA (Gemini, ChatGPT, Claude) conectados a traves de una bitacora compartida en Google Sheets.

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `thousand-sunny-unified.js` | GAS Unificado: backend autonomo + bot Telegram + API REST para webapp |
| `thousand-sunny-patch-v2.js` | Patch v2: routing natural language + webapp bridge + cola de tareas |
| `thousand-sunny-bridge-v2.html` | Webapp v2: feed en vivo de la Sheet, mensajes via GAS |
| `thousand-sunny-bridge.html` | Webapp v1: chat autonomo con APIs directas |
| `thousand-sunny-gas-autonomo.js` | GAS v1: script autonomo original |
| `INSTALACION-PATCH-V2.md` | Guia de instalacion del patch v2 |

## Arquitectura

```
Telegram Bot (@thousandsunny_crew_bot)
    |
    v
Google Apps Script (doPost/doGet)
    |
    +---> Gemini API (Sanji/Zoro/Robin/Chopper) [FREE]
    +---> OpenAI API (Usopp) [gpt-4o-mini]
    +---> Google Drive (leer/mover/crear archivos)
    +---> Google Sheets (Bitacora compartida)
    |
    v
Webapp HTML (polling cada 10s)
```

## Tripulacion (Nakamas)

- **Sanji** (Gemini): Evaluacion y procesamiento de contenido
- **Zoro** (Gemini): Discernimiento y ejecucion en Drive
- **Usopp** (ChatGPT): Conexiones creativas y perspectiva lateral
- **Robin** (Gemini): Clasificacion semantica de archivos
- **Chopper** (Gemini): Deteccion de patrones clinicos
- **Nami** (Claude/Local): Navegacion, auditoria, coherencia
- **Franky** (Claude): Ingenieria y construccion del sistema

## Setup

Ver `INSTALACION-PATCH-V2.md` para instrucciones detalladas.
