# Frontera de Vegapunk — qué no cruza a la consola

> El Puente de Mando es la capa de **presencia y notificación**. En la matriz de
> custodia del puerto de Vegapunk figura como **adaptador**, y es el solicitante más
> atado del barco: es la única capa que publica hacia fuera (Sheets, Drive, Telegram,
> la webapp). Este documento dice qué no puede cruzar hasta aquí, y por dónde
> cruzaría si alguien no lo impide.
>
> Ley completa: `state/vegapunk/CARTA_DE_CUSTODIA.md` en el repo
> [ThousandSunny](https://github.com/PC-Villalobos/ThousandSunny).

## La regla

| Clase de material | Al adaptador |
|---|---|
| `asistencial` (episodio de una relación de cuidado) | **denegado** |
| `intimo` (registro íntimo o experimental del Capitán) | **denegado** |
| `cuantificado` (series y medidas, incluso seudónimas) | **denegado** |
| `metafora` (simbólico, sin sujeto) | derivado — nunca texto de una pieza reclasificada |

Denegado significa denegado: ni en claro, ni resumido, ni "solo el título", ni como
nombre de fichero. Un título clínico ya es contenido clínico.

**La trampa que motiva esto:** un material puede *declararse* metáfora y arrastrar la
relación asistencial entera. El puerto lo detecta y lo reclasifica a `asistencial`
(fixture `metafora_trampa.md`). Lo que llegue aquí ya viene clasificado por el puerto;
la consola **no reclasifica** y no juzga: si no trae recibo, no se publica.

## Por dónde cruzaría — las salidas reales de este repo

Verificado sobre `thousand-sunny-unified.js` (recanonizado desde producción v56). Estas
son las funciones que publican hacia fuera y, por tanto, los puntos donde un material
de Vegapunk se convertiría en irreversible:

| Línea | Función | Publica en |
|---|---|---|
| 1375 | `crearEnDrive_` | Google Drive (crea fichero) |
| 1501 | `escribirEnDoc_` | Google Drive (escribe en un doc) |
| 1686 | `guardarMemoria_` | Sheet de memoria compartida |
| 1710 | `enviarTelegram_` | Telegram — **la más irreversible: sale del dominio del Capitán** |
| 1767 | `_legacy_logBitacora_` | Sheet Bitácora (estrato histórico) |
| 2338 | `_legacy_logCowork_` | Sheet Cowork (estrato histórico) |
| 358 | `doGet` (`bitacora`, `memoria`, `status`) | API REST → webapp |

## Estado de la frontera

**Declarada, no implementada.** Hoy ninguna de esas funciones comprueba clase ni
recibo: la garantía es que **ningún material de Vegapunk existe fuera de los fixtures
sintéticos**, y la Fase 0 prohíbe fuentes reales. La frontera aguanta porque no hay
nada que cruzar todavía.

Eso deja de ser cierto en el momento en que se apruebe GO-1 (admitir una sola fuente
real). **El guardián en estas siete salidas es requisito previo de GO-1, no trabajo
posterior.** Se implementa aquí, no en el puerto: quien publica es quien comprueba.

No se ha modificado `thousand-sunny-unified.js`. El repo lo trata como canon traído
de producción, y meterle un guardián sin GO rompería esa regla — que es exactamente
la clase de atajo que esta frontera existe para impedir.
