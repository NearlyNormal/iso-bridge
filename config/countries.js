var COUNTRIES = {
  US: {
    name: 'United States',
    flag: '🇺🇸',
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'Fedwire', 'CHIPS', 'ACH', 'RTP', 'FedNow'],
    notes: 'Fedwire migrating to ISO 20022. RTP and FedNow native ISO 20022. CHIPS migration completed March 2025.'
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    formats: ['MT103', 'MT940', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'Lynx', 'ACSS', 'RTR'],
    notes: 'Lynx (large-value) native ISO 20022 since 2021. RTR (real-time rail) in development. Big 5 banks ISO-compliant.'
  },
  BR: {
    name: 'Brazil',
    flag: '🇧🇷',
    formats: ['pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'PIX', 'SITRAF', 'SPB'],
    notes: 'PIX native ISO 20022 — most advanced retail instant payments adoption globally. Cross-border via SWIFT migrating.'
  },
  // ─── Planned (v1.1) ───
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    planned: true,
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'CHAPS', 'Faster Payments', 'BACS'],
    notes: 'CHAPS migrated to ISO 20022 June 2023. Faster Payments migration planned.'
  },
  EU: {
    name: 'European Union',
    flag: '🇪🇺',
    planned: true,
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'TARGET2', 'SEPA', 'TIPS'],
    notes: 'TARGET2 migrated to ISO 20022 March 2023. SEPA native ISO 20022.'
  },
  MX: {
    name: 'Mexico',
    flag: '🇲🇽',
    planned: true,
    formats: ['pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'SPEI', 'CoDi'],
    notes: 'SPEI real-time payments. CoDi mobile payments overlay.'
  },
  SG: {
    name: 'Singapore',
    flag: '🇸🇬',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'FAST', 'MEPS+', 'PayNow'],
    notes: 'MEPS+ (large value) ISO 20022 native. FAST real-time payments.'
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'NPP', 'RITS'],
    notes: 'NPP (New Payments Platform) native ISO 20022. RITS migrating.'
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'RTGS', 'NEFT', 'UPI', 'IMPS'],
    notes: 'RTGS migrated to ISO 20022. UPI native ISO 20022.'
  }
};
