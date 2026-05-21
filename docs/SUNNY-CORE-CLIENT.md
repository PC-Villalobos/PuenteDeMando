# Sunny Core Client

Packet: SUN-0003
Estado: activo

`sunny-client.js` conecta Puente/Cowork con el Hub local:

- `GET http://127.0.0.1:3333/api/core`
- `POST http://127.0.0.1:3333/api/missions/start`
- `POST http://127.0.0.1:3333/api/missions/:packetId/close`

## Uso browser

```html
<script src="./sunny-client.js"></script>
<script>
  const bridge = new SunnyBridge();
  const core = await bridge.getCoreState();
</script>
```

## Uso Node

```javascript
const SunnyBridge = require("./sunny-client");
const bridge = new SunnyBridge();

await bridge.startMission({
  packetId: "SUN-0004",
  actor: "Codex",
  role: "Usopp",
  subject: "Implementar GAS Adapter",
  objective: "Sincronizar Core hacia GAS/Drive sin dar autoridad canonica a GAS.",
  summary: "Preparar espejo controlado del Core hacia GAS.",
  projectIds: ["thousand_sunny_operativo"],
});
```

## Cierre estilo Argos

El cliente acepta el objeto de cierre con `log`, `shadow`, `glitch`, `state`,
`captain` y `handoff`, y lo traduce al formato que el Sunny Core valida.

```javascript
await bridge.closeMission("SUN-0004", "Codex", {
  log: "Se implemento el adaptador.",
  shadow: "Riesgo controlado: GAS sigue siendo espejo, no autoridad.",
  glitch: "",
  state: {
    status: "idle",
    summary: "Adaptador listo.",
    handoff_to: null,
    next_step: "Probar mirror contra Drive.",
  },
  captain: "Capitan, el adaptador esta listo para prueba.",
  handoff: {
    contexto: "SUN-0004 construyo el primer GAS Adapter.",
    decision: "La verdad sigue en Sunny Core.",
    continuidad: "Probar mirror y registrar resultado.",
    session_ref: "codex:2026-05-01:SUN-0004",
  },
});
```

## Correccion importante

No basta con enviar `sections.handoff` directamente a
`/api/missions/:packetId/close` si el servidor no lo traduce. En SUN-0003 el
Hub quedo endurecido para aceptar cierres estilo Argos, extraer el handoff y
persistir el bloque de closure dentro de la mision cerrada.
