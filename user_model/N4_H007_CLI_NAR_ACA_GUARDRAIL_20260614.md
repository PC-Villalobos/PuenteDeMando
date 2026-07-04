# [N4-ACT-ETH] H007 — CLI vs NAR/ACA Domain Guardrail

**Estado:** ACTIVE  
**Dominio:** ETH / OPS  
**Promovido:** 2026-06-14  
**Bitácora:** id 1377  

---

## Regla

Los agentes (Claude, Codex, Gemini, Franky) deben distinguir dos dominios separados:

### CLI — HOLD_CLINICO
- Contenido clínico sensible del usuario.
- Acceso: **metadata-only**. Nunca abrir, ingerir ni procesar contenido.
- Gate: `chopper_vivi` (requiere revisión humana explícita).
- Acción por defecto ante duda: no tocar, loguear en Bitácora.

### NAR / ACA — Material narrativo y académico
- Narrativa personal no sensible, material académico, proyectos creativos.
- Acceso: **readable** cuando no marcado como sensible.
- Puede ingresarse en semilla con `deckard_level: N1-N4` según contenido.

---

## Propósito

Evitar que operaciones de ingesta automática (conversation_bridge, promote-n1) contaminen el dominio CLI con procesamiento no autorizado.

## Invariante

H-007 **no expone ni describe** contenido clínico. Nombra la arquitectura de routing, no el contenido.

---

## Evidencia

- `src-20260614-h007-cli-nar-aca` (semilla local)
- `claim-h007-cli-nar-aca-guardrail` (semilla local)
- `src-20260612-drive-repaso`
- `claim-0003`
