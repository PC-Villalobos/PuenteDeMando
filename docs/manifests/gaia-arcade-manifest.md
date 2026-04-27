# Gaia Arcade Manifest

## Identity

- Project: Gaia Evolution Arcade
- IntentID: `INT-GAIA-ARCADE`
- Repository of record: `PC-Villalobos/ThousandSunny`
- Code path: `games/gaia-arcade/`
- Branch: `claude/gaia-evolution-arcade-game-26U2V`
- Responsible nakama: Usopp / Codex
- PuenteDeMando role: manifest only

## Scope

This manifest records the arcade prototype scaffold only. PuenteDeMando
does not own the Roblox code, does not execute Drive operations, and does
not publish Roblox assets.

The first playable proof is limited to:

- seed era 1: `01-sabana`
- seed era 2: `02-piedra`
- seed era 3: `03-fuego`
- generic loop modules for lives, checkpoints, progression, HUD, and
  monetization hooks

## Contract

Loop code and lore content stay separate.

- Loop: `src/shared`, `src/server`, `src/client`
- Lore/content: `levels/*`

New eras should land as content packages unless the seed proves that the
loop contract is missing a real arcade primitive.

## Monetization guardrail

The game-over UI must expose three visible options with equal weight:

1. wait for regeneration
2. start over
3. continue with Robux

No pressure timer, no hidden free option, and no paid-only recovery path.
Developer product receipt processing belongs server-side in
`MonetizationService`.

## Status

- State: scaffolded
- Destructive actions: none
- Drive actions: none
- Roblox publish: not performed
- Next step: open in Roblox Studio with Rojo and validate the seed HUD
