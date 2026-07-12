# Reconciliacion GAS — regla operativa

Estado: dictamen vigente
Fecha: 2026-07-12
Autor: nami (claude-code) + capitan
Ambito: despliegue del Apps Script del Puente de Mando (produccion @56)

## Regla de oro

**Traer @56 al repo, no llevar el repo antiguo a @56.**

Ni la copia local (disco D:) ni este repositorio son produccion. La version viva
en Apps Script (@56) va **por delante** de ambos. Cualquier despliegue que empuje
una de las copias viejas hacia el deploy vivo es una regresion.

## Evidencia

- El handler `log_cowork` de `thousand-sunny-unified.js` (lineas 456-465 en el
  repo) **no valida ningun token**: solo registra.
- Sin embargo, produccion @56 respondio `unauthorized` al llamar a `log_cowork`.
- Por tanto @56 tiene un guard de autenticacion (COWORK_TOKEN) que **no existe ni
  en el repo ni en la copia D:**.

## Riesgo si se ignora

Desplegar `thousand-sunny-unified.js` (repo) o `Código.js` (copia D:) sobre el
deploy vivo **elimina el guard COWORK_TOKEN** — regresion de seguridad. Es el
"pisar algo mas nuevo" que motivo no empujar a ciegas.

## Bug 2 — ubicacion y aviso de versiones

En el repo, el orden esta en `thousand-sunny-unified.js:421-423`:

```
421  const captainId = ...getProperty("CAPTAIN_CHAT_ID");
422  enviarTelegram_(captainId, 'Capitan (webapp): ' + msgText, false);  // manda a Telegram
423  result = procesarMensajeCapitan_(msgText, msgRuta);                 // ...ANTES de procesar
```

**Aviso:** el comentario `// BUG2 v26: plain text` de la L422 se refiere a un
arreglo distinto (markdown -> texto plano), NO al orden de envio. Hay dos cosas
llamadas "Bug 2" en distintas versiones. Acordar cual es el Bug 2 objetivo
**antes** de tocar, o se arreglara una cosa creyendo que es otra.

## Orden seguro de reconciliacion

1. `clasp pull` de produccion @56 a una **carpeta limpia** (unica fuente de verdad).
2. Aplicar y verificar el Bug 2 acordado en esa carpeta.
3. Solo entonces actualizar el deploy vivo.
4. **Cerrar la sangria:** commitear el `@56` limpio a este repo (`PuenteDeMando`)
   para que el repo vuelva a ser canon y la proxima sesion no parta de una copia
   vieja. Esa es la misma via por la que se perdio contexto antes.

## Confirmaciones de seguridad

- El `unauthorized` de la Bitacora es **buena senal**: el token vive en @56.
- No forzar el token. No desplegar hacia atras.

## Pendientes (follow-up) — estado 2026-07-12

Anclados para que no se evaporen. Trazados tambien en el comentario de PR #8.

### Seguridad (lado vivo; el repo no toca produccion)
- **Rotar** las claves OpenAI y Gemini: estuvieron literales en `fijarKeys()` de
  @56 y la proteccion de push las marco como reales -> tratarlas como comprometidas.
- Neutralizar `fijarKeys()` tambien en el **deploy vivo** (en el repo ya es un stub
  que lanza error), para que las claves vivan solo en Script Properties.
- Copias temporales locales con material sensible: **eliminadas** por el capitan
  (`gas-prod-pull-20260712`, `puentedemando-recanonize-20260712`).

### Endpoints no desplegados (decision: PR posterior, NO en #8)
Cuatro handlers existian en el repo pero no en produccion @56 -> estaban muertos en
vivo. #8 es solo recanonizacion segura y no los incluye. Si se quieren vivos, van en
una PR aparte, reaplicados sobre @56 y con guard/token donde corresponda:
- `cowork_continuar_hilo`
- `drive_etiquetar_pendiente`
- `markdown`
- `md`

Preservados en el historial del repo en `cca68e7` (canon viejo). No se pierden.

### Bug 2 (orden del eco Telegram)
Sigue **abierto**. #8 lo preservo tal cual @56 (envio a Telegram antes de
`procesarMensajeCapitan_`), no lo arreglo. Acordar cual es el Bug 2 objetivo antes
de aplicar el fix encima del canon.

### Orden de merge
1. PR #7 (este dictamen).
2. PR #8 (recanonizacion @56), apilado sobre #7.
