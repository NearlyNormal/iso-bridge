// ─── FORMAT METADATA ───
// Display names, dropdown categories, and inline samples for the UI.
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
  'MT103': '{1:F01NWBKGB2LAXXX0000000000}\n{2:I103COBADEFFXXXXN}\n{4:\n:20:SHANX-20250101-001\n:23B:CRED\n:32A:250101USD10000,00\n:50K:/GB29NWBK60161331926819\nAcme Corporation\n1 Canada Square\nLondon E14 5AB\n:52A:NWBKGB2L\n:57A:COBADEFF\n:59:/DE89370400440532013000\nGlobal Trade Bank\nNeue Mainzer Str 32\nFrankfurt 60311\n:70:INVOICE REF 2025-INV-0042\n:71A:SHA\n-}',
  'pacs.008': '<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>PACS008-20250115-001</MsgId>\n      <CreDtTm>2025-01-15T09:00:00</CreDtTm>\n      <NbOfTxs>1</NbOfTxs>\n      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <PmtId>\n        <InstrId>INSTR-20250115-001</InstrId>\n        <EndToEndId>E2E-PACS008-001</EndToEndId>\n      </PmtId>\n      <IntrBkSttlmAmt Ccy="USD">10000.00</IntrBkSttlmAmt>\n      <IntrBkSttlmDt>2025-01-15</IntrBkSttlmDt>\n      <ChrgBr>SHAR</ChrgBr>\n      <Dbtr>\n        <Nm>Acme Corporation</Nm>\n        <PstlAdr>\n          <StrtNm>1 Canada Square</StrtNm>\n          <TwnNm>London</TwnNm>\n          <PstCd>E14 5AB</PstCd>\n          <Ctry>GB</Ctry>\n        </PstlAdr>\n      </Dbtr>\n      <DbtrAcct>\n        <Id><IBAN>GB29NWBK60161331926819</IBAN></Id>\n      </DbtrAcct>\n      <DbtrAgt>\n        <FinInstnId><BICFI>NWBKGB2LXXX</BICFI></FinInstnId>\n      </DbtrAgt>\n      <CdtrAgt>\n        <FinInstnId><BICFI>COBADEFFXXX</BICFI></FinInstnId>\n      </CdtrAgt>\n      <Cdtr>\n        <Nm>Global Trade Bank</Nm>\n        <PstlAdr>\n          <StrtNm>Neue Mainzer Str 32</StrtNm>\n          <TwnNm>Frankfurt</TwnNm>\n          <PstCd>60311</PstCd>\n          <Ctry>DE</Ctry>\n        </PstlAdr>\n      </Cdtr>\n      <CdtrAcct>\n        <Id><IBAN>DE89370400440532013000</IBAN></Id>\n      </CdtrAcct>\n      <RmtInf>\n        <Ustrd>INVOICE REF 2025-INV-0042</Ustrd>\n      </RmtInf>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>',
  'MT202': '{1:F01CHASUS33XXXX0000000000}\n{2:I202CITIUS33XXXXN}\n{4:\n:20:FIT-20250215-007\n:21:REL-20250215-007\n:32A:250215USD500000,00\n:52A:CHASUS33\n:57A:CITIUS33\n:58A:DEUTDEFF\n:72:/ACC/FUNDS TRANSFER FOR\n//TREASURY OPERATIONS\n-}',
  'pacs.009': '<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08">\n  <FICdtTrf>\n    <GrpHdr>\n      <MsgId>PACS009-20250215-001</MsgId>\n      <CreDtTm>2025-02-15T10:30:00</CreDtTm>\n      <NbOfTxs>1</NbOfTxs>\n      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <PmtId>\n        <InstrId>INSTR-20250215-001</InstrId>\n        <EndToEndId>E2E-PACS009-001</EndToEndId>\n      </PmtId>\n      <IntrBkSttlmAmt Ccy="USD">500000.00</IntrBkSttlmAmt>\n      <IntrBkSttlmDt>2025-02-15</IntrBkSttlmDt>\n      <Dbtr>\n        <FinInstnId><BICFI>CHASUS33XXX</BICFI></FinInstnId>\n      </Dbtr>\n      <CdtrAgt>\n        <FinInstnId><BICFI>CITIUS33XXX</BICFI></FinInstnId>\n      </CdtrAgt>\n      <Cdtr>\n        <FinInstnId><BICFI>DEUTDEFFXXX</BICFI></FinInstnId>\n      </Cdtr>\n      <InstrForNxtAgt>\n        <InstrInf>FUNDS TRANSFER FOR TREASURY OPERATIONS</InstrInf>\n      </InstrForNxtAgt>\n    </CdtTrfTxInf>\n  </FICdtTrf>\n</Document>',
  'MT940': '{1:F01BANKUS33XXXX0000000000}\n{2:O9400845250215BANKUS33XXXX00000000002502150845N}\n{4:\n:20:STMT-20250215-001\n:25:US33100012345678\n:28C:15/1\n:60F:C250214USD125000,00\n:61:2502150215CD5000,00NTRF12345678//BANKREF001\n:86:PAYMENT FROM ACME CORP - INV 2025-001\n:61:2502150215DD12000,00NTRF87654321//BANKREF002\n:86:WIRE TRANSFER TO SUPPLIER - PO 44821\n:61:2502150215CD750,00NTRFMISC0001//BANKREF003\n:86:INTEREST PAYMENT Q4 2024\n:62F:C250215USD118750,00\n:64:C250215USD118750,00\n-}',
  'camt.053': '<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">\n  <BkToCstmrStmt>\n    <GrpHdr>\n      <MsgId>CAMT053-20250215-001</MsgId>\n      <CreDtTm>2025-02-15T18:00:00</CreDtTm>\n    </GrpHdr>\n    <Stmt>\n      <Id>STMT-20250215-001</Id>\n      <ElctrncSeqNb>15</ElctrncSeqNb>\n      <LglSeqNb>1</LglSeqNb>\n      <CreDtTm>2025-02-15T18:00:00</CreDtTm>\n      <Acct><Id><Othr><Id>US33100012345678</Id></Othr></Id></Acct>\n      <Bal>\n        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>\n        <Amt Ccy="USD">125000.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <Dt><Dt>2025-02-14</Dt></Dt>\n      </Bal>\n      <Bal>\n        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>\n        <Amt Ccy="USD">118750.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <Dt><Dt>2025-02-15</Dt></Dt>\n      </Bal>\n      <Bal>\n        <Tp><CdOrPrtry><Cd>CLAV</Cd></CdOrPrtry></Tp>\n        <Amt Ccy="USD">118750.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <Dt><Dt>2025-02-15</Dt></Dt>\n      </Bal>\n      <Ntry>\n        <Amt Ccy="USD">5000.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <Sts><Cd>BOOK</Cd></Sts>\n        <BookgDt><Dt>2025-02-15</Dt></BookgDt>\n        <ValDt><Dt>2025-02-15</Dt></ValDt>\n        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>\n        <NtryDtls><TxDtls>\n          <Refs><AcctSvcrRef>12345678</AcctSvcrRef></Refs>\n          <AddtlTxInf>PAYMENT FROM ACME CORP - INV 2025-001</AddtlTxInf>\n        </TxDtls></NtryDtls>\n      </Ntry>\n      <Ntry>\n        <Amt Ccy="USD">12000.00</Amt>\n        <CdtDbtInd>DBIT</CdtDbtInd>\n        <Sts><Cd>BOOK</Cd></Sts>\n        <BookgDt><Dt>2025-02-15</Dt></BookgDt>\n        <ValDt><Dt>2025-02-15</Dt></ValDt>\n        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>\n        <NtryDtls><TxDtls>\n          <Refs><AcctSvcrRef>87654321</AcctSvcrRef></Refs>\n          <AddtlTxInf>WIRE TRANSFER TO SUPPLIER - PO 44821</AddtlTxInf>\n        </TxDtls></NtryDtls>\n      </Ntry>\n      <Ntry>\n        <Amt Ccy="USD">750.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <Sts><Cd>BOOK</Cd></Sts>\n        <BookgDt><Dt>2025-02-15</Dt></BookgDt>\n        <ValDt><Dt>2025-02-15</Dt></ValDt>\n        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>\n        <NtryDtls><TxDtls>\n          <Refs><AcctSvcrRef>MISC0001</AcctSvcrRef></Refs>\n          <AddtlTxInf>INTEREST PAYMENT Q4 2024</AddtlTxInf>\n        </TxDtls></NtryDtls>\n      </Ntry>\n    </Stmt>\n  </BkToCstmrStmt>\n</Document>'
};
