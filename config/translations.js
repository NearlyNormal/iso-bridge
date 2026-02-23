var TRANSLATIONS = [
  {
    from: 'MT103',
    to: 'pacs.008',
    lossless: false,
    mappingRef: 'MAPPING_MT103_PACS008',
    warnings: [
      'Remittance information truncated: MT :70: field (4×35 chars free text) maps to structured RmtInf/Ustrd',
      'Ordering customer address: MT 4×35 unstructured lines become ISO structured postal address',
      'Charge bearer: SHA maps to SHAR (semantically similar but not identical — SHA is SWIFT-specific)',
      'No InstructionId (InstrId) equivalent in MT103 — auto-generated in output',
      'LEI codes cannot be represented in MT103 — not populated in output'
    ]
  },
  {
    from: 'pacs.008',
    to: 'MT103',
    lossless: false,
    mappingRef: 'MAPPING_PACS008_MT103',
    warnings: [
      'Structured remittance information collapsed into free-text :70: field (max 4×35 chars)',
      'LEI codes have no MT equivalent — dropped silently',
      'Structured postal address collapsed to unstructured 4×35 lines',
      'InstructionId (InstrId) has no MT equivalent — dropped',
      'Purpose code, regulatory reporting, and supplementary data cannot be represented in MT'
    ]
  },
  {
    from: 'MT202',
    to: 'pacs.009',
    lossless: false,
    mappingRef: 'MAPPING_MT202_PACS009',
    warnings: [
      'No InstructionId (InstrId) equivalent in MT202 — auto-generated in output',
      'LEI codes for financial institutions cannot be represented in MT202 — not populated',
      'Purpose code not available in MT202 — left empty in pacs.009',
      'Settlement method inferred from :53A: presence (COVE if present, CLRG otherwise)'
    ]
  },
  {
    from: 'pacs.009',
    to: 'MT202',
    lossless: false,
    mappingRef: 'MAPPING_PACS009_MT202',
    warnings: [
      'InstructionId (InstrId) has no MT equivalent — dropped',
      'LEI codes for financial institutions cannot be represented in MT — dropped',
      'Purpose code has no MT202 field — dropped',
      'Supplementary data has no MT equivalent — dropped',
      'Structured agent information (name, address) collapsed to BIC-only in MT202'
    ]
  },
  {
    from: 'MT940',
    to: 'camt.053',
    lossless: false,
    mappingRef: 'MAPPING_MT940_CAMT053',
    warnings: [
      'Statement date range (FrToDt) not explicit in MT940 — left empty',
      'Entry status (BOOK/PDNG) not available in MT940 — defaults to BOOK',
      'Debtor/creditor party details not available in MT940 :61: — left empty',
      'Structured domain/family transaction codes require SWIFT code mapping — approximated',
      'Structured remittance not available in MT940 — only unstructured from :86:',
      ':61: transaction type/code mapped to generic BkTxCd — not fully structured'
    ]
  },
  {
    from: 'camt.053',
    to: 'MT940',
    lossless: false,
    mappingRef: 'MAPPING_CAMT053_MT940',
    warnings: [
      'Statement date range (FrToDt) has no MT940 equivalent — dropped',
      'Entry status (BOOK/PDNG) cannot be represented in MT940 — dropped',
      'Structured party details (debtor/creditor) in entries cannot be represented — dropped',
      'Structured domain/family codes collapsed to 4-char transaction type — lossy',
      'Structured remittance dropped — only unstructured text fits in :86:',
      'Agent BICs in entry details cannot be represented in :61: — dropped',
      'Supplementary data has no MT equivalent — dropped'
    ]
  }
];
