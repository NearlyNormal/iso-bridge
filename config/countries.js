var COUNTRIES = {
  US: {
    name: 'United States',
    flag: '🇺🇸',
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pacs.009', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'Fedwire', 'CHIPS', 'ACH', 'RTP', 'FedNow'],
    railTags: { 'RTP': 'iso-native', 'FedNow': 'iso-native', 'Fedwire': 'migrating' },
    notes: 'Fedwire migrating to ISO 20022. RTP and FedNow native ISO 20022. CHIPS migration completed March 2025.'
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    formats: ['MT103', 'MT940', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'Lynx', 'ACSS', 'RTR'],
    railTags: { 'Lynx': 'iso-native', 'RTR': 'planned' },
    notes: 'Lynx (large-value) native ISO 20022 since 2021. RTR (real-time rail) in development. Big 5 banks ISO-compliant.'
  },
  BR: {
    name: 'Brazil',
    flag: '🇧🇷',
    formats: ['pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'PIX', 'SITRAF', 'SPB'],
    railTags: { 'PIX': 'iso-native', 'SITRAF': 'iso-native', 'SPB': 'iso-native' },
    notes: 'PIX native ISO 20022, most advanced retail instant payments adoption globally. Cross-border via SWIFT migrating.'
  },
  // ─── Planned (v1.1) ───
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    planned: true,
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pacs.009', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'CHAPS', 'Faster Payments', 'BACS'],
    railTags: { 'CHAPS': 'iso-native' },
    notes: 'CHAPS migrated to ISO 20022 June 2023. Faster Payments migration planned.'
  },
  EU: {
    name: 'European Union',
    flag: '🇪🇺',
    planned: true,
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pacs.009', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'TARGET2', 'SEPA', 'TIPS'],
    railTags: { 'TARGET2': 'iso-native', 'SEPA': 'iso-native' },
    notes: 'TARGET2 migrated to ISO 20022 March 2023. SEPA native ISO 20022.'
  },
  MX: {
    name: 'Mexico',
    flag: '🇲🇽',
    formats: ['MT103', 'MT202', 'MT940', 'pacs.008', 'pacs.009', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'SPEI', 'CoDi'],
    railTags: { 'SPEI': 'proprietary', 'CoDi': 'proprietary' },
    notes: 'SPEI domestic payments use proprietary XML (not ISO 20022). Cross-border via SWIFT, MT and ISO 20022 coexist.'
  },
  SG: {
    name: 'Singapore',
    flag: '🇸🇬',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'FAST', 'MEPS+', 'PayNow'],
    railTags: { 'MEPS+': 'iso-native' },
    notes: 'MEPS+ (large value) ISO 20022 native. FAST real-time payments.'
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'NPP', 'RITS'],
    railTags: { 'NPP': 'iso-native', 'RITS': 'migrating' },
    notes: 'NPP (New Payments Platform) native ISO 20022. RITS migrating.'
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    planned: true,
    formats: ['MT103', 'pacs.008', 'pain.001', 'camt.053'],
    rails: ['SWIFT', 'RTGS', 'NEFT', 'UPI', 'IMPS'],
    railTags: { 'RTGS': 'iso-native', 'UPI': 'iso-native' },
    notes: 'RTGS migrated to ISO 20022. UPI native ISO 20022.'
  }
};
