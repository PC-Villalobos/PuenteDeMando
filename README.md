# Puente de Mando — la consola del Capitán

La **consola operacional** del Thousand Sunny: la capa de presencia y notificación del barco — no su cerebro ni su fuente de verdad (eso vive en el repo [ThousandSunny](https://github.com/PC-Villalobos/ThousandSunny) y en el Vault de Obsidian, la *maceta de Groot*).

> **Estado canónico (2026-06-27).** Esto **ya no es** un "ecosistema multi-IA Gemini/ChatGPT/Claude sobre GAS". En la arquitectura soberana (`bridge-linux/ARQUITECTURA.md` en ThousandSunny):
> - el **motor** se consolida en **DeepSeek** (y modelos locales); los modelos son **actores intercambiables**, no proveedores fijos.
> - el **GAS** migra a **apps HTML ejecutables en el escritorio Linux**, vinculadas a la VPS (Laboon) + Obsidian Sync.
> - la inteligencia vive en el **sistema** (memoria + continuidad + herramientas), no en el modelo — ver `TESIS.md`.
>
> Lo de abajo es la **implementación actual (GAS, legacy en migración)**.

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `thousand-sunny-unified.js` | GAS Unificado: backend autonomo + bot Telegram + API REST para webapp |
| `thousand-sunny-patch-v2.js` | Patch v2: routing natural language + webapp bridge + cola de tareas |
| `thousand-sunny-bridge-v2.html` | Webapp v2: feed en vivo de la Sheet, mensajes via GAS |
| `thousand-sunny-bridge.html` | Webapp v1: chat autonomo con APIs directas |
| `thousand-sunny-gas-autonomo.js` | GAS v1: script autonomo original |
| `INSTALACION-PATCH-V2.md` | Guia de instalacion del patch v2 |
| `VEGAPUNK_FRONTERA.md` | Que material NO puede cruzar a la consola, y por que salidas cruzaria |

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

## Tripulacion (asignación de motores — legacy, en migración a DeepSeek)

> Esta asignación modelo↔nakama es del estrato GAS. En el canon, el nakama es un
> **personaje** y el modelo un **actor intercambiable** (`TEATRO.md`); el motor se
> unifica en DeepSeek/local. Tabla conservada como referencia de la implementación actual.

- **Sanji** (Gemini): Evaluacion y procesamiento de contenido
- **Zoro** (Gemini): Discernimiento y ejecucion en Drive
- **Usopp** (ChatGPT): Conexiones creativas y perspectiva lateral
- **Robin** (Gemini): Clasificacion semantica de archivos
- **Chopper** (Gemini): Deteccion de patrones clinicos
- **Nami** (Claude/Local): Navegacion, auditoria, coherencia
- **Franky** (Claude): Ingenieria y construccion del sistema

## Setup

Ver `INSTALACION-PATCH-V2.md` para instrucciones detalladas.
