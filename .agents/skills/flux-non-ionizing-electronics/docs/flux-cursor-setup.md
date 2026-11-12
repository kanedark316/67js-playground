# Flux + Cursor setup (non-ionizing electronics)

**Use for:** PCB / schematic / BOM work on this Project’s **non-ionizing** bone-imaging prototypes (ultrasound modules, microwave/radar front-ends, MCUs, power, connectors).  
**Do not use for:** X-ray tubes, HV generators, ionizing sources, or copying KnovelCam internals.

## Why Flux (not Blueprint)

| Tool | Fit |
| --- | --- |
| **Flux** | Best for our work: medical-aware electronics, schematics, PCB, BOM; has official **Cursor MCP**. |
| Blueprint | Hobby 3.3–5 V maker only; blocks medical / high-risk. Optional for tiny sensor toys only. |

## Add Flux MCP in Cursor (you do this once)

1. Open **Cursor → Settings → Tools & MCP → New MCP Server**.
2. Add:

```json
{
  "mcpServers": {
    "flux": {
      "url": "https://app.flux.ai/mcp"
    }
  }
}
```

3. Save and complete the Flux OAuth sign-in in the browser.
4. Verify: in chat, ask the agent to **list your Flux projects**.

Docs: [Flux MCP server](https://docs.flux.ai/reference/flux-mcp-server)

Reading projects is free; design threads use Flux ACUs.

## Project skill

Skill file: [`../SKILL.md`](../SKILL.md)

When Flux MCP is connected, agents should follow that skill for hardware design jobs.

## First Flux project suggestion

Create a Flux project named something like **non-ionizing-bone-imager-ruo** with scope:

- Research / RUO only; no diagnostic claims
- Non-ionizing modalities only (US / microwave tracks)
- Soft boundaries from Project Context `docs/bone-imaging-safety-claims.md` when available
