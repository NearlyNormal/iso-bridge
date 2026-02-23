var SAMPLE_CAMT052 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.052.001.08">
  <BkToCstmrAcctRpt>
    <GrpHdr>
      <MsgId>CAMT052-20250215-001</MsgId>
      <CreDtTm>2025-02-15T12:00:00</CreDtTm>
    </GrpHdr>
    <Rpt>
      <Id>INTR-20250215-001</Id>
      <CreDtTm>2025-02-15T12:00:00</CreDtTm>
      <Acct><Id><Othr><Id>US33100012345678</Id></Othr></Id></Acct>
      <Ntry>
        <Amt Ccy="USD">8500.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs><AcctSvcrRef>20250215001</AcctSvcrRef></Refs>
          <AddtlTxInf>INCOMING WIRE - ACME CORP TRADE SETTLEMENT</AddtlTxInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="USD">3200.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs><AcctSvcrRef>20250215002</AcctSvcrRef></Refs>
          <AddtlTxInf>OUTGOING PAYMENT - SUPPLIER INV 2025-0088</AddtlTxInf>
        </TxDtls></NtryDtls>
      </Ntry>
    </Rpt>
  </BkToCstmrAcctRpt>
</Document>`;
