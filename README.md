iso-bridge: SWIFT MT to ISO 20022 Translation Workbench
========================================================

*Translate payment messages across formats, rails, and borders. Browser-based, no install required.*

---

## The Reality of the Migration

On paper, the SWIFT deadline for ISO 20022 adoption on cross-border payment messages was November 2025. In practice, as anyone working in payments infrastructure knows, the story is considerably more nuanced.

Banking deadlines are not software release dates. They are negotiated realities, shaped by the weight of legacy systems that have processed trillions of dollars reliably for decades, by correspondent banking relationships that move at the speed of contract renegotiation, and by the simple fact that a core banking system replacement is a multi-year programme, not a configuration change. SWIFT has softened its language around the cutover. Large banks have implicit extensions. Mid-size institutions are running translation middleware that converts ISO 20022 back to MT for internal consumption, buying time while the deeper integration work continues.

This is not a criticism. It is how large, regulated, interconnected systems actually evolve. The migration is real, it is irreversible, and it is happening. Just not uniformly, and not on the date printed on any official document.

The practical consequence is that payments developers, integration architects, and treasury technology teams are living in a world where both formats coexist, sometimes within the same transaction chain. A payment that originates as a pacs.008 may be translated to MT103 at a correspondent bank's gateway, processed internally as MT, and translated back to ISO 20022 at the receiving end. Data is lost at each translation. Structured remittance information collapses into free text. Addresses lose their structure. Charge bearer codes approximate rather than map cleanly. The rich data that ISO 20022 was designed to carry arrives truncated, flattened, and sometimes misinterpreted.

Understanding where the formats differ, where translation is lossless and where it is not, and what each country's payment rails actually require today (not what they will require eventually) is genuinely useful operational knowledge that is surprisingly hard to find in one place.

---

## A Country-by-Country Reality

### United States

The US presents the sharpest paradox in global payments. Its newest rails, RTP (The Clearing House) and FedNow (Federal Reserve, launched 2023), are native ISO 20022, built from the ground up on modern message standards. Its oldest large-value rails, Fedwire and CHIPS, are mid-migration, with Fedwire Funds targeting ISO 20022 adoption in 2025. Its highest-volume rail by transaction count, ACH (governed by Nacha), is moving toward ISO 20022 alignment but on a slower, more fragmented timeline.

The result is a US developer who may be writing clean pacs.008 messages for FedNow payments in the morning and debugging legacy MT103 correspondent banking flows in the afternoon. Both are real. Neither is going away immediately.

### Canada

Canada's payment modernisation is more centralised and arguably further along. Lynx, the large-value system that replaced LVTS in 2021, was built natively on ISO 20022. The Real-Time Rail (RTR), still in development under Payments Canada, will also be ISO 20022 native. Canadian banks, particularly the Big 5, have sophisticated technology organisations and are well advanced on SWIFT compliance.

The Canadian complexity lies at the edges. Smaller credit unions and regional financial institutions route through the Big 5 as correspondents. Corporate treasury teams are on ERP upgrade cycles that don't align neatly with payment network deadlines.

### Brazil

Brazil is the most instructive case study globally. PIX, the instant payment system launched by Banco Central do Brasil in November 2020, is built entirely on ISO 20022. It has been adopted by over 140 million Brazilians and processes billions of transactions monthly. Brazilian retail banking clients are already living in an ISO 20022 world. They simply experience it as a payment system that works, with the message standard invisible beneath it.

For cross-border and wholesale payments, Brazilian banks operate under the same SWIFT migration pressures as everyone else. But the domestic ISO 20022 fluency built through PIX means Brazilian fintech developers are often more comfortable with the format than their counterparts elsewhere.

### Mexico

Mexico's domestic payment backbone is SPEI, run by Banco de Mexico. SPEI uses a proprietary XML format. It is structured, but not ISO 20022. There is ongoing discussion of SPEI alignment with ISO 20022, but no firm deadline. For cross-border payments, particularly the enormous US-Mexico remittance corridor (approximately $60 billion USD annually), Mexican banks are subject to SWIFT's ISO 20022 migration timeline.

The practical gap for Mexican developers is the coexistence of SPEI's proprietary XML for domestic flows and ISO 20022 for international ones, with no clean bridge between them.

### United Kingdom and Europe

The UK and EU are arguably the most compliance-driven environments. The FCA, EBA, and ECB have all pushed ISO 20022 adoption aggressively. SEPA (the single euro payments area) has been migrating its credit transfer and direct debit schemes to ISO 20022. TARGET2, the ECB's large-value system, completed its ISO 20022 migration in 2023. UK banks, shaped by both SWIFT deadlines and domestic regulatory pressure, are among the furthest advanced globally.

### Singapore and Asia-Pacific

MAS has been supportive of ISO 20022 adoption and Singapore's payment infrastructure, particularly for cross-border institutional payments, is well aligned. Australia's NPP (New Payments Platform) is native ISO 20022. The Asia-Pacific region is broadly progressive on adoption, though with significant variation between markets.

---

## What iso-bridge Is

iso-bridge is a browser-based translation workbench for payment message formats. It is built for the reality described above: the coexistence period, the lossy translation chains, the need to understand not just what a message says but what gets lost when it moves between formats.

The tool is deliberately simple to use and deliberately transparent about its intelligence. You choose a country. Based on that country, the tool presents the payment formats and rails that are actually relevant. Not every format that has ever existed, but the ones a developer or treasury architect working in that market will actually encounter. You select a source format and a destination format. Before you paste a single message, the tool tells you whether the translation path is lossless or lossy, and what the known mapping gaps are.

You paste a source message on the left. You get the translated output on the right, in XML or JSON. Below the translation, a field mapping table shows every source field, its destination equivalent, and the quality of that mapping: clean, approximate, or data lost.

### v1.0 Translation Paths

| Source | Target | Category | Lossy? |
|--------|--------|----------|--------|
| MT103 | pacs.008.001.08 | Customer Payments | Yes |
| pacs.008.001.08 | MT103 | Customer Payments | Yes |
| MT202 | pacs.009.001.08 | FI to FI Transfers | Yes |
| pacs.009.001.08 | MT202 | FI to FI Transfers | Yes |
| MT940 | camt.053.001.08 | Account Statements | Yes |
| camt.053.001.08 | MT940 | Account Statements | Yes |

### v1.0 Country Coverage

| Country | Active Rails | Formats | Status |
|---------|-------------|---------|--------|
| United States | SWIFT, Fedwire, CHIPS, ACH, RTP, FedNow | MT103, MT202, MT940, pacs.008, pacs.009, pain.001, camt.053 | Active |
| Canada | SWIFT, Lynx, ACSS, RTR | MT103, MT940, pacs.008, pain.001, camt.053 | Active |
| Brazil | SWIFT, PIX, SITRAF, SPB | pacs.008, pain.001, camt.053 | Active (ISO-native) |

Brazil is fully ISO 20022-native. Its domestic rails (PIX, SITRAF) were built on ISO 20022 from the start, so there is no legacy format translation needed. The tool reflects this: selecting Brazil disables the format selectors and displays an informational banner.

Six additional countries (UK, EU, Mexico, Singapore, Australia, India) are defined in the country registry and visible in the UI as planned.

---

## Architecture

Under the hood, the tool is config-driven. The browser interface is the visible layer. The configs are the knowledge base. Both are open source.

### How it works

```
iso-bridge/
├── index.html                          # UI shell
├── assets/
│   ├── app.js                          # Translation engine and UI wiring
│   ├── mt-parser.js                    # MT message parser (extracted from swift-parser)
│   └── style.css                       # Design system
├── config/
│   ├── countries.js                    # Country registry
│   ├── formats.js                      # Format labels, categories, and inline samples
│   ├── translations.js                 # Translation path definitions
│   └── mappings/
│       ├── mt103-pacs008.js            # Field-by-field: MT103 → pacs.008
│       ├── pacs008-mt103.js            # Field-by-field: pacs.008 → MT103
│       ├── mt202-pacs009.js            # Field-by-field: MT202 → pacs.009
│       ├── pacs009-mt202.js            # Field-by-field: pacs.009 → MT202
│       ├── mt940-camt053.js            # Field-by-field: MT940 → camt.053
│       └── camt053-mt940.js            # Field-by-field: camt.053 → MT940
```

The engine (`app.js`) reads from three configuration layers at runtime. It contains no hardcoded knowledge about countries, formats, or field mappings. All of that lives in `config/`.

### Layer 1: Country Registry (`config/countries.js`)

Each country is a simple object that declares which formats and rails are active in that market.

```js
US: {
  name: 'United States',
  flag: '🇺🇸',
  formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pacs.009', 'pain.001', 'camt.053'],
  rails: ['SWIFT', 'Fedwire', 'CHIPS', 'ACH', 'RTP', 'FedNow'],
  notes: 'Fedwire migrating to ISO 20022. RTP and FedNow native ISO 20022.'
}
```

When a user selects a country, the engine reads that country's `formats` array and filters the source/target dropdowns to show only what is relevant. Brazil, for example, has no MT formats in its registry because PIX and domestic rails are already ISO 20022 native.

### Layer 2: Translation Paths (`config/translations.js`)

Each translation path declares a source format, a target format, whether the translation is lossy, and what the known warnings are.

```js
{
  from: 'MT103',
  to: 'pacs.008',
  lossless: false,
  mappingRef: 'MAPPING_MT103_PACS008',
  warnings: [
    'Remittance information truncated: MT :70: field maps to structured RmtInf/Ustrd',
    'Ordering customer address: MT 4x35 unstructured lines become ISO structured postal address',
    'Charge bearer: SHA maps to SHAR (semantically similar but not identical)',
    ...
  ]
}
```

The `mappingRef` string points to a global variable name defined in a mapping file. The engine resolves it at runtime. The `warnings` array is displayed to the user before they even paste a message, so they know what to expect from this translation path.

### Layer 3: Field Mappings (`config/mappings/*.js`)

Each mapping file defines the field-by-field translation between two formats. Every field has explicit metadata about the quality of the mapping.

```js
{
  mtTag: '32A',
  mtName: 'Value Date / Currency / Amount',
  isoPath: 'CdtTrfTxInf/IntrBkSttlmAmt',
  isoName: 'Interbank Settlement Amount',
  transform: 'decode32A',
  status: 'transformed',
  notes: 'Compound field split: date to IntrBkSttlmDt, currency to Ccy attribute, amount to element value.'
}
```

The `status` field drives the colour coding in the UI:

| Status | Colour | Meaning |
|--------|--------|---------|
| `clean` | Green | Direct 1:1 mapping, no data loss |
| `transformed` | Amber | Value is converted, format changes, approximation involved |
| `gap` | Red | No equivalent in the target format, data is dropped |
| `auto` | Blue | Auto-generated in the target with no source field |

Mapping files also declare `autoGenerated` fields (ISO elements that have no MT source, like `GrpHdr/MsgId` and `GrpHdr/CreDtTm`) and `dataGaps` (ISO fields that cannot be populated from MT input, like LEI codes and purpose codes).

---

## Adding Support for a New Country

Adding a country requires no changes to the engine. Edit `config/countries.js` and add an entry:

```js
SG: {
  name: 'Singapore',
  flag: '🇸🇬',
  formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
  rails: ['SWIFT', 'FAST', 'MEPS+', 'PayNow'],
  notes: 'MEPS+ (large value) ISO 20022 native. FAST real-time payments.'
}
```

Remove the `planned: true` flag to activate it. The country will appear in the dropdown, and the format selectors will filter based on its `formats` array. If the translation paths for those formats already exist (e.g., MT103 to pacs.008), they work immediately for the new country.

## Adding a New Translation Path

To add a new format pair (e.g., MT950 to camt.052), you only need config files. No changes to the engine (`app.js`).

1. Create `config/mappings/mt950-camt052.js` with a mapping variable containing the field array and engine metadata:
   ```js
   var MAPPING_MT950_CAMT052 = {
     direction: 'mt-to-iso',
     sourceType: 'MT950',
     targetType: 'camt.052',
     fields: [ /* field-by-field mapping */ ],
     autoGenerated: [ /* ISO fields with no MT source */ ],
     dataGaps: [ /* MT fields that cannot be represented */ ],
     // Engine metadata: fixedElements, attributes, elementOrder (MT→ISO)
     // or: envelope, mtFieldOrder, isoRootElement, isoTxPath (ISO→MT)
   };
   ```

2. Add a `<script>` tag in `index.html` to load it:
   ```html
   <script src="config/mappings/mt950-camt052.js"></script>
   ```

3. Add an entry in `config/translations.js`:
   ```js
   {
     from: 'MT950',
     to: 'camt.052',
     lossless: false,
     mappingRef: 'MAPPING_MT950_CAMT052',
     warnings: ['...']
   }
   ```

4. Add format labels and samples in `config/formats.js`:
   - Add display names to `FORMAT_LABELS` (e.g., `'MT950': 'MT950 — Interim Statement'`)
   - Add a dropdown category row to `FORMAT_CATEGORIES` if needed
   - Add sample messages to `INLINE_SAMPLES` for the "Load Sample" button

The engine discovers the new path automatically. The generic `convertMTtoISO` and `convertISOtoMT` functions use the mapping config's `direction`, `fields`, transforms, and structural metadata to drive the conversion. Any country whose `formats` array includes both source and target formats will show the path in its format selectors.

---

## The Configs as Documentation

This architecture means the tool is useful beyond the browser interface. The country configurations and translation mapping specifications are human-readable, version-controlled documentation that a cash management technology team, a trade finance integration architect, or a treasury systems group can use directly. As a reference. As internal documentation. As the basis for their own integration work.

The configs are not magic. They are the distilled, structured knowledge of what the migration actually requires, expressed in a form that both a browser tool and a developer can consume.

---

## Part of the Payments Toolkit

iso-bridge is one of three tools that work together:

- **[SWIFT MT Parser](../swift-parser/)** decodes MT messages into structured JSON with field-level explanations
- **[ISO 20022 Validator](../iso20022-validator/)** validates XML against schemas and country scheme profiles
- **ISO Bridge** (this tool) translates between formats with honest data loss warnings

Each tool addresses a different question. The parser asks "what does this message say?" The validator asks "is this message correct?" The bridge asks "how do I get from this format to that one, and what do I lose along the way?"

---

## Tech Stack

- Vanilla HTML/CSS/JavaScript. No build step. No dependencies to install.
- [UIKit 3](https://getuikit.com/) for layout and components
- [IBM Plex](https://www.ibm.com/plex/) (Mono + Sans) for typography
- [Highlight.js](https://highlightjs.org/) for syntax highlighting
- All parsing, mapping, and XML generation runs in the browser

---

## Roadmap

### v1.1

- UK, EU, Mexico, Singapore, Australia, India country activation
- MT950 / camt.052 (interim statements)
- Field mapping reference tab (standalone browsable reference)
- Message builder (generate ISO XML from form inputs)
