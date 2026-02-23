// ─── FORMAT METADATA ───
// Display names and dropdown categories for the UI.
// Samples live in samples/*.js as globals (SAMPLE_MT103, SAMPLE_PACS008, etc.)
// and are discovered automatically by loadSample() — no registry needed.
// Adding a new format pair? Add labels and categories here — no changes to app.js needed.

var FORMAT_LABELS = {
  'MT103': 'MT103 — Single Customer Credit Transfer',
  'MT103RET': 'MT103 RETURN — Payment Return',
  'MT101': 'MT101 — Request for Transfer',
  'MT104': 'MT104 — Direct Debit Request',
  'MT202': 'MT202 — Financial Institution Transfer',
  'MT900': 'MT900 — Confirmation of Debit',
  'MT910': 'MT910 — Confirmation of Credit',
  'MT940': 'MT940 — Customer Statement',
  'MT942': 'MT942 — Interim Transaction Report',
  'pacs.004': 'pacs.004 — Payment Return',
  'pacs.008': 'pacs.008 — FI to FI Customer Credit Transfer',
  'pacs.009': 'pacs.009 — FI to FI Financial Institution Credit Transfer',
  'pain.001': 'pain.001 — Customer Credit Transfer Initiation',
  'pain.008': 'pain.008 — Customer Direct Debit Initiation',
  'camt.052': 'camt.052 — Bank to Customer Account Report (Intraday)',
  'camt.053': 'camt.053 — Bank to Customer Statement',
  'camt.054': 'camt.054 — Bank to Customer Debit Credit Notification'
};

var FORMAT_CATEGORIES = [
  {
    name: 'Customer Payments',
    rows: [
      { desc: 'Customer Credit Transfer', legacy: 'MT103', modern: 'pacs.008' },
      { desc: 'Payment Initiation', legacy: 'MT101', modern: 'pain.001' },
      { desc: 'Payment Return', legacy: 'MT103RET', modern: 'pacs.004' }
    ]
  },
  {
    name: 'Direct Debit',
    rows: [
      { desc: 'Direct Debit Initiation', legacy: 'MT104', modern: 'pain.008' }
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
    name: 'Notifications',
    rows: [
      { desc: 'Debit Notification', legacy: 'MT900', modern: 'camt.054' },
      { desc: 'Credit Notification', legacy: 'MT910', modern: 'camt.054' }
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
