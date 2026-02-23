var TRANSLATIONS = [
  // ─── Customer Payments ───
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

  // ─── Payment Initiation ───
  {
    from: 'MT101',
    to: 'pain.001',
    lossless: false,
    mappingRef: 'MAPPING_MT101_PAIN001',
    warnings: [
      'Message index/total (:28D:) has no pain.001 equivalent — batch sequencing lost',
      'Ordering customer address: MT 4×35 unstructured lines become ISO structured postal address',
      'Charge bearer: SHA maps to SHAR (semantically similar but not identical)',
      'LEI codes cannot be represented in MT101 — not populated in output',
      'Initiating party inferred from ordering customer — may not be the same entity'
    ]
  },
  {
    from: 'pain.001',
    to: 'MT101',
    lossless: false,
    mappingRef: 'MAPPING_PAIN001_MT101',
    warnings: [
      'Initiating party details beyond name have no MT equivalent — dropped',
      'Structured remittance collapsed into free-text :70: field (max 4×35 chars)',
      'LEI codes have no MT equivalent — dropped',
      'Purpose code has no MT101 field — dropped',
      'Structured postal address collapsed to unstructured 4×35 lines',
      'Payment method (TRF) implied by message type — not explicitly represented'
    ]
  },

  // ─── Payment Return ───
  {
    from: 'MT103RET',
    to: 'pacs.004',
    lossless: false,
    mappingRef: 'MAPPING_MT103RETURN_PACS004',
    warnings: [
      'Return reason must be parsed from :72: coded words (/REJT/, /RETN/) — approximation to ISO reason codes',
      'Original message ID not available in MT103 return — auto-generated in output',
      'Ordering customer address: MT 4×35 unstructured lines become ISO structured postal address',
      'Original message type assumed to be pacs.008 — may not be accurate',
      'LEI codes cannot be represented in MT — not populated in output'
    ]
  },
  {
    from: 'pacs.004',
    to: 'MT103RET',
    lossless: false,
    mappingRef: 'MAPPING_PACS004_MT103RETURN',
    warnings: [
      'Structured return reason code approximated as /REJT/ or /RETN/ prefix in :72:',
      'Original group information (message ID, message type) has no MT equivalent — dropped',
      'LEI codes have no MT equivalent — dropped',
      'Structured postal address collapsed to unstructured 4×35 lines',
      'Supplementary data has no MT equivalent — dropped'
    ]
  },

  // ─── Direct Debit ───
  {
    from: 'MT104',
    to: 'pain.008',
    lossless: false,
    mappingRef: 'MAPPING_MT104_PAIN008',
    warnings: [
      'Instruction code (:23E:) has no direct pain.008 equivalent — dropped',
      'Mandate information not available in MT104 — critical gap for SEPA direct debits',
      'Ordering customer address: MT 4×35 unstructured lines become ISO structured postal address',
      'Charge bearer: SHA maps to SHAR (semantically similar but not identical)',
      'LEI codes cannot be represented in MT104 — not populated in output'
    ]
  },
  {
    from: 'pain.008',
    to: 'MT104',
    lossless: false,
    mappingRef: 'MAPPING_PAIN008_MT104',
    warnings: [
      'Mandate-related information (MndtRltdInf) has no MT104 equivalent — dropped entirely',
      'Initiating party details beyond name have no MT equivalent — dropped',
      'Structured remittance collapsed into free-text :70: field (max 4×35 chars)',
      'LEI codes have no MT equivalent — dropped',
      'Purpose code has no MT104 field — dropped',
      'Instruction code defaults to OTHR — original instruction context lost'
    ]
  },

  // ─── FI to FI ───
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

  // ─── Notifications ───
  {
    from: 'MT900',
    to: 'camt.054',
    lossless: false,
    mappingRef: 'MAPPING_MT900_CAMT054',
    warnings: [
      'MT900 is a minimal debit notification — camt.054 supports much richer entry detail',
      'Debtor/creditor party details not available in MT900 — left empty',
      'Structured domain/family transaction codes not available — only proprietary code populated',
      'Remittance information not available in MT900 — left empty in camt.054',
      'Entry status defaults to BOOK — MT900 does not distinguish booked vs pending'
    ]
  },
  {
    from: 'camt.054',
    to: 'MT900',
    lossless: false,
    mappingRef: 'MAPPING_CAMT054_MT900',
    warnings: [
      'Entry status (BOOK/PDNG) cannot be represented in MT900 — dropped',
      'Structured party details (debtor/creditor) in entries cannot be represented — dropped',
      'Structured domain/family codes have no MT900 equivalent — dropped',
      'Remittance information cannot be represented in MT900 — dropped',
      'Only first notification entry is translated — MT900 is a single-entry message'
    ]
  },
  {
    from: 'MT910',
    to: 'camt.054',
    lossless: false,
    mappingRef: 'MAPPING_MT910_CAMT054',
    warnings: [
      'MT910 is a minimal credit notification — camt.054 supports much richer entry detail',
      'Debtor/creditor party details not available in MT910 — left empty',
      'Structured domain/family transaction codes not available — only proprietary code populated',
      'Remittance information not available in MT910 — left empty in camt.054',
      'Entry status defaults to BOOK — MT910 does not distinguish booked vs pending'
    ]
  },
  {
    from: 'camt.054',
    to: 'MT910',
    lossless: false,
    mappingRef: 'MAPPING_CAMT054_MT910',
    warnings: [
      'Entry status (BOOK/PDNG) cannot be represented in MT910 — dropped',
      'Structured party details (debtor/creditor) in entries cannot be represented — dropped',
      'Structured domain/family codes have no MT910 equivalent — dropped',
      'Remittance information cannot be represented in MT910 — dropped',
      'Only first notification entry is translated — MT910 is a single-entry message'
    ]
  },

  // ─── Reporting ───
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
  },
  {
    from: 'MT942',
    to: 'camt.052',
    lossless: false,
    mappingRef: 'MAPPING_MT942_CAMT052',
    warnings: [
      'Floor notification amount (:34F:) has no camt.052 equivalent — dropped',
      'Intraday report period not explicit in MT942 — FrToDt left empty',
      'Entry status (BOOK/PDNG) not available in MT942 — defaults to BOOK',
      'Debtor/creditor party details not available in MT942 :61: — left empty',
      'Structured domain/family transaction codes require SWIFT code mapping — approximated',
      ':61: transaction type/code mapped to generic BkTxCd — not fully structured'
    ]
  },
  {
    from: 'camt.052',
    to: 'MT942',
    lossless: false,
    mappingRef: 'MAPPING_CAMT052_MT942',
    warnings: [
      'Report period (FrToDt) has no MT942 equivalent — dropped',
      'Entry status (BOOK/PDNG) cannot be represented in MT942 — dropped',
      'Structured party details (debtor/creditor) in entries cannot be represented — dropped',
      'Structured domain/family codes collapsed to 4-char transaction type — lossy',
      'Structured remittance dropped — only unstructured text fits in :86:',
      'Agent BICs in entry details cannot be represented in :61: — dropped'
    ]
  }
];
