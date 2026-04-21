# Cowork Context Bridge

Contract that lets every cabin of the Thousand Sunny share state while
`sync_pull_state` is broken.

## Problem

As of 2026-04-21 `sync_pull_state` fails with `SYNC_VIEW_TOKEN invalido`.
Cowork and Telegram therefore cannot see what happens inside any cabin
(Claude Desktop, Claude Code, Codex, Antigravity) unless each cabin
copies state manually. Manual copy is the failure mode the captain
named explicitly: it makes the whole system feel ornamental.

## Canonical state

Until `sync_pull_state` is fixed, all cabins read and write state from
the local sumidero:

```text
thousand-sunny-hub/state/
|-- shared-state.json        # machine state
|-- STATE_OF_THE_SHIP.md     # prose briefing
|-- PROJECT_REGISTRY.md      # active projects
`-- event-stream.jsonl       # append-only event log
```

Default captain path:
`C:\Users\usuario\Documents\Claude\Projects\IA como extensión cognitiva personal (Gemini, Claude y ChatGPT)\thousand-sunny-hub\`

## Writers

Only two agents write arbitrary state to the sumidero:

- **Codex** - via `shared-checkpoint.js` and the `npm run checkpoint` CLI.
  Default checkpointer.
- **Antigravity** - same CLI, invoked from its runner; also responsible
  for mirroring to GAS (see below).

Claude Code and Claude Desktop sessions write checkpoints by calling the
same CLI with `--actor claude-code` or `--actor claude-desktop`. They do
not write arbitrary state directly.

## Readers

- **Cowork webapp** (`thousand-sunny-bridge-v2.html`) - reads either
  from the Bitacora Sheet (presence layer) or from a mirrored copy of
  `shared-state.json` uploaded to Drive by Antigravity.
- **Telegram bot** - reads from the Bitacora Sheet as today.
- **Claude Code / Claude Desktop / Codex / Antigravity** - use
  `npm run pull -- --summary` as the canonical read interface. Raw
  filesystem reads from the sumidero are fallback only.

## Mirror to GAS (Antigravity's job)

Antigravity runs a periodic job that reads `shared-state.json` and posts
a compact summary to the Bitacora Sheet via the existing GAS endpoint:

```text
GET <GAS_URL>?action=mensaje&ruta=mirror&text=<compact summary>
```

The `ruta=mirror` marker lets Cowork and Telegram filter mirror events
from captain-authored messages. No new GAS endpoint is required.

## Bypassing `sync_pull_state`

Any consumer that previously called `sync_pull_state` and hit
`SYNC_VIEW_TOKEN invalido` should, until the token issue is resolved:

1. Run `npm run pull -- --summary`, or
2. If that interface is unavailable, read `state/shared-state.json`
   directly (filesystem), or
3. Read the last message with `ruta=mirror` from the Bitacora Sheet.

No new token is required for the bypass. When `sync_pull_state` is
fixed, the bypass can be deleted and consumers switched back.

## Checkpoint shape (for mirrors and PR bodies)

Sessions that cannot reach the sumidero emit a checkpoint inline so it
can be mirrored later. The shape:

```json
{
  "title": "short title",
  "summary": "what changed and why",
  "project": "thousand_sunny_operativo",
  "actor": "claude-code | claude-desktop | codex | antigravity",
  "tags": ["tag"],
  "nextActions": ["next step"],
  "blockers": ["blocker if any"]
}
```

This matches the arguments accepted by `npm run checkpoint` in the hub,
so a mirror is a one-to-one translation.

## Restoring the original flow

The original flow assumes a valid `SYNC_VIEW_TOKEN` minted by GAS and
passed to `sync_pull_state`. Fixing it is a separate work item; the
bypass is deliberately minimal so it can be deleted without dragging
consumer code along.
