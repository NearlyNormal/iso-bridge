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
  }
];
