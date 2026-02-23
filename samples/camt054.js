var SAMPLE_CAMT054 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr>
      <MsgId>CAMT054-20250215-001</MsgId>
      <CreDtTm>2025-02-15T10:30:00</CreDtTm>
    </GrpHdr>
    <Ntfctn>
      <Id>DBT-20250215-001</Id>
      <CreDtTm>2025-02-15T10:30:00</CreDtTm>
      <Acct><Id><Othr><Id>US33100012345678</Id></Othr></Id></Acct>
      <Ntry>
        <Amt Ccy="USD">25000.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs>
            <AcctSvcrRef>PACS008-REF-0042</AcctSvcrRef>
          </Refs>
          <RltdAgts>
            <DbtrAgt><FinInstnId><BICFI>CITIUS33XXX</BICFI></FinInstnId></DbtrAgt>
          </RltdAgts>
        </TxDtls></NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`;
