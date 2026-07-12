# MNEMOSINE v0 - Capa pre-sueno

Fecha: 2026-07-12

## Proposito

MNEMOSINE v0 no reemplaza la funcion de sueno. La antecede.

Su trabajo es convertir conversaciones crudas en destilados operativos sin que el material intimo salga de la maquina local. La funcion de sueno sigue trabajando sobre `state/` y otros destilados; MNEMOSINE crea esos destilados con ancla verificable al origen.

Regla sagrada:

> Nada crudo sale de casa. Nada operativo depende de recordar todo.

## Anillos

### Anillo 0 - Raw local

Contenido:

- conversaciones completas
- audios, fotos, videos y documentos originales
- datos financieros, clinicos o intimos
- tabla local de anclas `anchor_id -> fichero -> rango`

Condiciones:

- vive solo en local
- cifrado en reposo
- no se indexa en RAG
- no se envia a modelos externos
- solo se abre con permiso explicito del Capitan

### Anillo 1 - Destilado durable

Contenido:

- Markdown literal normalizado
- sintesis durables
- decisiones
- pendientes
- semillas enlazadas
- anclas opacas hacia Anillo 0

Condiciones:

- es el primer material que puede leer la funcion de sueno
- es apto para RAG local
- puede viajar si no contiene raw ni rutas sensibles

### Anillo 2 - Vistas por permiso

Contenido:

- vistas modulares por usuario, caso o tarea
- IDs opacos
- resumen de contexto necesario

Condiciones:

- sin rutas locales
- sin nombres de ficheros privados
- sin acceso directo al raw

### Anillo 3 - Publico

Contenido:

- patrones
- arquitectura
- aprendizajes generalizados
- documentacion compartible

Condiciones:

- viaja el patron, nunca el corpus pesado

## Contrato de ancla

Cada unidad destilada debe conservar una referencia opaca al origen.

Formato minimo:

```yaml
anchor_id: anc_YYYYMMDD_slug_0001
source_kind: transcript | chat | audio | image | document
source_local_id: src_opaque_0001
local_range:
  page: null
  start: null
  end: null
privacy_ring: 0
access_policy: local_explicit_permission
```

Reglas:

- `anchor_id` puede aparecer en destilados.
- `source_local_id` solo resuelve dentro del indice local.
- El indice local no se sube a GitHub.
- Ningun destilado debe incluir rutas absolutas al raw.
- Si una respuesta necesita volver al original, pide permiso y resuelve el ancla localmente.

## Formato de destilado

Cada destilado de conversacion debe usar este esqueleto:

```markdown
# <titulo corto>

fecha: YYYY-MM-DD
origen: <tipo sin ruta>
anchor_root: anc_YYYYMMDD_slug
semillas:
  - <semilla>
estado: bruto | revisado | consolidado

## Sintesis
<5-12 lineas utiles>

## Hechos
- <hecho verificable> [anc_...]

## Decisiones
- <decision tomada> [anc_...]

## Pendientes
- <accion concreta> [anc_...]

## Enlaces a semillas
- <semilla>: <por que conecta>

## Riesgos
- <privacidad, falso positivo, falso negativo, ruido>
```

## Micorriza v0

La micorriza es el paso nocturno de clasificacion y enlace.

Entrada:

- destilados de Anillo 1
- lista de semillas activas
- prioridades del dia

Salida:

- enlaces a semillas
- score de valor
- score de privacidad
- propuesta de siguiente paso
- entradas para el shadowlog

No hace:

- no abre raw sin permiso
- no sube corpus pesado
- no decide borrar originales

## Dipsic v0

Dipsic es la segunda pasada de verificacion.

Comprueba:

- si la sintesis conserva lo importante
- si hay falsos descartes
- si el material fue mal clasificado
- si una ancla necesita revision humana

Puede usar modelo mas potente, pero solo sobre destilado o parafraseo seguro. Si necesita raw, debe pedir permiso.

## Nemo / atractor de sesion

Cada sesion viva puede tener un archivo:

```text
atractor_<YYYYMMDD>_<slug>.md
```

Contrato minimo:

```markdown
# Atractor de sesion

meta_actual:
submetas:
hechos_confirmados:
decisiones:
pendientes:
fuentes_destiladas:
anclas_relevantes:
ultimo_estado:
```

Nemo no sustituye a la memoria. Mantiene direccion.

Su funcion es recordar desde donde venia la tarea, que se decidio, que falta y que fuentes destiladas justifican el siguiente paso.

## Split local / cloud

Local obligatorio:

- Anillo 0
- indice `anchor_id -> source_local_id -> fichero/rango`
- cifrado
- permisos

Local preferente:

- RAG sobre Anillo 1
- busqueda de destilados
- Nemo de sesion

Cloud permitido:

- verificacion sobre destilados
- razonamiento sobre patrones
- PRs, documentacion y reportes sin raw

Cloud prohibido:

- raw intimo
- rutas locales sensibles
- tablas de traduccion completas
- material clinico sin protocolo explicito

## Probe de 10 conversaciones

Antes de escalar:

1. Seleccionar 10 conversaciones no clinicas o suficientemente seguras.
2. Guardar raw en Anillo 0 local.
3. Crear tabla local de anclas.
4. Traducir cada raw a Markdown literal con IDs.
5. Crear destilado por conversacion.
6. Ejecutar micorriza v0 contra 5-10 semillas.
7. Ejecutar Dipsic v0 sobre los destilados.
8. Generar `shadowlog_YYYYMMDD.md`.
9. Crear un `atractor_<sesion>.md`.
10. Revisar manualmente:
    - precision de ancla
    - utilidad del destilado
    - ruido descartado
    - falsos negativos

## Criterios de exito

- 10/10 destilados tienen ancla valida.
- 0 rutas absolutas al raw aparecen en destilados.
- 0 raw sale de local.
- al menos 7/10 destilados enlazan a una semilla util.
- Dipsic marca falsos negativos o dudas cuando las hay.
- Nemo puede reconstruir la meta de sesion sin leer raw.

## Relacion con funcion de sueno

MNEMOSINE produce nutrientes seguros.

La funcion de sueno consolida, detecta deriva y registra el estado nocturno.

Orden correcto:

```text
raw local -> anclas -> destilado -> micorriza -> Dipsic -> shadowlog -> funcion_de_sueno
```

No invertir el flujo.
