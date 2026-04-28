# INT-PUENTE-2D

## Identity

- IntentID: `INT-PUENTE-2D`
- Name: Puente de Mando 2D
- Repository: `pc-villalobos/puentedemando`
- Trunk: `pc-villalobos/thousandsunny`
- Trunk manifest: `docs/manifests/INT-PUENTE-2D.md`
- State: active

## Mandate

Maintain the operational cockpit for the Thousand Sunny: webapp UI, GAS bridge,
Bitacora visibility, Telegram relay, and future command interfaces.

## Boundary

PuenteDeMando owns executable interface code. ThousandSunny owns the canonical
intent tree, crew declarations, gardens, and repository graduation criteria.

## Current Contract

Any major bridge behavior change should reference this IntentID in the PR and
leave an entry in Bitacora when it affects architecture or operator workflow.
