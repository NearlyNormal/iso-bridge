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
  }
};
