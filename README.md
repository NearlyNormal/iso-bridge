# ISO Bridge: Payments Format Workbench

> Translate between SWIFT MT and ISO 20022 formats. Country-aware, with honest data loss warnings.

The global payments industry is migrating from SWIFT MT to ISO 20022, but the transition is uneven. Different countries are at different stages, different payment rails use different formats, and translation between formats is inherently lossy. ISO Bridge answers the question the other two toolkit tools can't: **"How do I move from the format I'm in to the format I need to be in?"**

## What this tool does

Pick a country, pick a source format, pick a destination format, paste your message, and get the translated output with honest warnings about what data is lost in translation.

- **Country-aware filtering** — only shows formats and rails relevant to the selected country
- **Connected selectors** — FROM filters TO; impossible combinations can't be selected
- **Lossy/lossless warnings upfront** — before you paste anything, you know if data will be lost
- **Field-by-field mapping diagram** — every source field, its target, and whether the mapping is clean, transformed, or lossy
- **XML and JSON output** — toggle between views, copy to clipboard, download

## How it differs from the other tools

| Tool | Question it answers |
|------|-------------------|
| [SWIFT MT Parser](../swift-parser/) | "What does this MT message mean?" |
| [ISO 20022 Validator](../iso20022-validator/) | "Is this ISO XML valid?" |
| **ISO Bridge** (this tool) | "How do I get from here to there?" |

## Supported translation paths (v1.0)

| From | To | Lossless? | Notes |
|------|----|-----------|-------|
| MT103 | pacs.008 | No | Remittance truncated, address restructured, SHA→SHAR |
| pacs.008 | MT103 | No | LEI dropped, structured data collapsed, InstrId lost |

## Country coverage (v1.0)

| Country | Formats | Rails | Status |
|---------|---------|-------|--------|
| 🇺🇸 United States | MT103, MT202, MT940, pacs.008, pain.001, camt.053 | SWIFT, Fedwire, CHIPS, ACH, RTP, FedNow | Fedwire migrating |
| 🇨🇦 Canada | MT103, MT940, pacs.008, pain.001, camt.053 | SWIFT, Lynx, ACSS, RTR | Lynx native ISO |
| 🇧🇷 Brazil | pacs.008, pain.001, camt.053 | SWIFT, PIX, SITRAF, SPB | PIX native ISO |

## Quick start

1. Open `index.html` in a browser (no build step required)
2. Select a country (e.g., United States)
3. Select source format (e.g., MT103) and target (e.g., pacs.008)
4. Load a sample or paste your own message
5. Click **Translate**

## Data loss: what gets lost in each direction

### MT103 → pacs.008
- Remittance information: MT :70: (4×35 chars free text) → ISO RmtInf/Ustrd
- Address: MT unstructured 4×35 → ISO structured postal address (lossy mapping)
- Charge bearer: SHA → SHAR (semantically similar, not identical)
- No equivalent for LEI, InstrId, Purpose code (auto-generated or left empty)

### pacs.008 → MT103
- LEI codes dropped (no MT field)
- InstructionId dropped (no MT field)
- Structured remittance collapsed to free text (max 140 chars)
- Structured address collapsed to 4×35 unstructured lines
- EndToEndId truncated from 35 to 16 characters
- Purpose code, regulatory reporting structure, supplementary data dropped

## Tech stack

- **UIKit 3.25.12** — layout, dropdowns, modals
- **IBM Plex Mono + Sans** — typography
- **Highlight.js 11.9.0** — syntax highlighting (XML, JSON)
- **Vanilla JS** — no framework, no build step
- **Config-driven** — all data in `config/`, extensible without touching engine code

## Architecture

```
config/countries.js     → Country registry (formats, rails, notes)
config/translations.js  → Translation paths (from/to, lossy flags, warnings)
config/mappings/*.js    → Field-by-field mapping definitions
assets/mt-parser.js     → MT message parsing engine
assets/app.js           → Conversion engine + UI wiring
```

Adding a country, translation path, or field mapping means editing a config file — never touching the engine.

## Roadmap (v1.1)

- MT202 ↔ pacs.009
- MT940/MT950 ↔ camt.053
- More countries (GB, EU, MX, SG, AU)
- Field mapping reference tab
- Message builder (generate ISO XML from form)
