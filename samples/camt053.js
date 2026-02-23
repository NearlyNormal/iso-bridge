var SAMPLE_CAMT053 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>CAMT053-20250215-001</MsgId>
      <CreDtTm>2025-02-15T18:00:00</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-20250215-001</Id>
      <ElctrncSeqNb>15</ElctrncSeqNb>
      <LglSeqNb>1</LglSeqNb>
      <CreDtTm>2025-02-15T18:00:00</CreDtTm>
      <Acct><Id><Othr><Id>US33100012345678</Id></Othr></Id></Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">125000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2025-02-14</Dt></Dt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">118750.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2025-02-15</Dt></Dt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLAV</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">118750.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2025-02-15</Dt></Dt>
      </Bal>
      <Ntry>
        <Amt Ccy="USD">5000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs><AcctSvcrRef>12345678</AcctSvcrRef></Refs>
          <AddtlTxInf>PAYMENT FROM ACME CORP - INV 2025-001</AddtlTxInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="USD">12000.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs><AcctSvcrRef>87654321</AcctSvcrRef></Refs>
          <AddtlTxInf>WIRE TRANSFER TO SUPPLIER - PO 44821</AddtlTxInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="USD">750.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-02-15</Dt></BookgDt>
        <ValDt><Dt>2025-02-15</Dt></ValDt>
        <BkTxCd><Prtry><Cd>NTRF</Cd></Prtry></BkTxCd>
        <NtryDtls><TxDtls>
          <Refs><AcctSvcrRef>MISC0001</AcctSvcrRef></Refs>
          <AddtlTxInf>INTEREST PAYMENT Q4 2024</AddtlTxInf>
        </TxDtls></NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;
