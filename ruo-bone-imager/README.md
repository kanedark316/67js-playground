# RUO Bone Imager (Phase 1)

Research Use Only web app for **non-ionizing** bone-interface ultrasound research on phantoms.

**RESEARCH USE ONLY — Not for diagnostic procedures.**  
Non-ionizing investigational acquisition. Not a substitute for X-ray or clinical judgment.

This package is a standalone Vite + React + TypeScript app under `ruo-bone-imager/`. It does **not** change the 67js playground runtime.

## What shipped (S0 / S2 / E8)

| Slice | Coverage |
| --- | --- |
| **S0** | RUO splash + always-on banner; session create/open (localStorage); meta fields (`protocol_id` default `PHANTOM-TIBIA-v1`, optional `dual_mod_id`); sample B-mode / cine fixture; export ZIP + JSON stub |
| **S2** | Cortical polyline tool; gap caliper (mm from `mm_per_px`); annotations JSON in export; QC form (coupling / landmark / motion / cortical_line_qc) |
| **E8** | Shared forbidden-phrase list from Project safety doc; unit tests; `npm run lint:claims` / `npm test` gate; GitHub Actions workflow |

**Out of scope here:** live US probe drivers, microwave hardware, ionizing sources.

## Run locally

```sh
cd ruo-bone-imager
npm install
npm run dev
```

Open the printed local URL (typically `http://127.0.0.1:5173`).

```sh
npm test      # claim lint (pretest) + node:test suite
npm run build # typecheck + production build
```

## Fixtures

Sample synthetic B-mode frames live in `public/fixtures/cine/frame-0.svg` … `frame-3.svg` (and `public/fixtures/sample-bmode.svg`). Demo works without a probe.

## Phantom / protocol reference

Primary protocol ID: `PHANTOM-TIBIA-v1`  
Optional dual-mod meta: `DUAL-MW-US-E3-v1`

Project store specification (reference path, not shipped in this repo):

`/cursor/stores/bc-3a2bf0c6-1fe9-49e3-ab8f-6122e8889051/docs/phantom-tibia-v1-spec.md`

Related Project docs: `bone-imaging-software-sketch.md`, `bone-imaging-safety-claims.md`, `track-a-us-qus-design.md`, `non-ionizing-bone-imager-prd.md`.

## Claim lint (E8)

Forbidden UI/marketing phrases are listed in `src/claim-lint/forbiddenPhrases.ts` (aligned with Project `bone-imaging-safety-claims.md`). CI runs:

```sh
npm run lint:claims
npm test
```

## RUO disclaimer

For research and investigational data collection only. The system acquires non-ionizing sensor data related to bone interfaces and may display fixture views and operator annotations. It is not cleared or validated as a diagnostic device for fracture detection, and must not be used as the sole basis for clinical decisions.
