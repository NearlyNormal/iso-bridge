// ─── FORMAT METADATA ───
// Display names, dropdown categories, and sample references for the UI.
// Samples live in samples/*.js as readable template literals.
// Adding a new format pair? Add entries here — no changes to app.js needed.

var FORMAT_LABELS = {
  'MT103': 'MT103 — Single Customer Credit Transfer',
  'MT202': 'MT202 — Financial Institution Transfer',
  'MT940': 'MT940 — Customer Statement',
  'pacs.008': 'pacs.008 — FI to FI Customer Credit Transfer',
  'pacs.009': 'pacs.009 — FI to FI Financial Institution Credit Transfer',
  'pain.001': 'pain.001 — Customer Credit Transfer Initiation',
  'camt.053': 'camt.053 — Bank to Customer Statement'
};

var FORMAT_CATEGORIES = [
  {
    name: 'Customer Payments',
    rows: [
      { desc: 'Customer Credit Transfer', legacy: 'MT103', modern: 'pacs.008' },
      { desc: 'Payment Initiation', legacy: 'MT101', modern: 'pain.001' }
    ]
  },
  {
    name: 'FI to FI',
    rows: [
      { desc: 'Institution Transfer', legacy: 'MT202', modern: 'pacs.009' },
      { desc: 'Cover Payment', legacy: 'MT202COV', modern: 'pacs.009' }
    ]
  },
  {
    name: 'Reporting',
    rows: [
      { desc: 'Account Statement', legacy: 'MT940', modern: 'camt.053' },
      { desc: 'Interim Statement', legacy: 'MT942', modern: 'camt.052' }
    ]
  }
];

var INLINE_SAMPLES = {
  'MT103': SAMPLE_MT103,
  'pacs.008': SAMPLE_PACS008,
  'MT202': SAMPLE_MT202,
  'pacs.009': SAMPLE_PACS009,
  'MT940': SAMPLE_MT940,
  'camt.053': SAMPLE_CAMT053
};
