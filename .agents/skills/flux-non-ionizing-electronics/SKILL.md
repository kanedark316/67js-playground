---
name: flux-non-ionizing-electronics
description: Use Flux (MCP) for non-ionizing electronics and PCB work on bone-imaging prototypes. Blocks ionizing X-ray/HV designs. Use when designing boards, BOMs, pin maps, or Flux project changes for ultrasound/microwave RUO hardware.
---

# Flux for non-ionizing electronics

## When to use

- Schematic / PCB / BOM / enclosure-electronics for **non-ionizing** prototypes
- Syncing firmware pin maps to a live Flux design via Flux MCP
- Asking Flux to iterate a board that stays within Project safety boundaries

## Hard refusals

Refuse and stop (do not partial-complete) if asked to design or generate:

- X-ray tubes, ionizing radiation sources, or high-voltage X-ray supplies
- KnovelCam / portable radiography generator internals
- Any “remove shielding but keep X-ray” or “make X-ray non-ionizing” request

Redirect to ultrasound-on-chip / probe modules, microwave/mmWave front-ends, MCU, power, UI, and capture software instead.

## Preferred stack

1. **Flux** via MCP (`https://app.flux.ai/mcp`) for schematics, PCB, BOM, design threads
2. Existing repo electronics skills (KiCad, BOM, PCB) for local file workflows when Flux is unavailable
3. **Blueprint** only for tiny low-voltage maker helpers (3.3–5 V); never medical ionizing paths

## Workflow

1. Confirm modality is non-ionizing and framed as RUO / research (see Project docs on safety claims).
2. If Flux MCP is connected: list/open the Flux project; read components, nets, BOM before changing code.
3. Hand schematic/PCB changes to Flux (design thread); re-read nets after Flux finishes.
4. Keep firmware, connector maps, and docs aligned with the Flux netlist.
5. Never invent FDA clearance or fracture-diagnosis claims in silkscreen, UI, or BOM notes.

## Related docs

- [Flux + Cursor setup](docs/flux-cursor-setup.md) (MCP JSON and OAuth)
- Project Context (when available): `docs/bone-imaging-safety-claims.md`, `docs/non-ionizing-bone-imager-brief.md`, `docs/non-ionizing-bone-imaging-survey.md`
