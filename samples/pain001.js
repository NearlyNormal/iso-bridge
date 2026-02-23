var SAMPLE_PAIN001 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>PAIN001-20250215-001</MsgId>
      <CreDtTm>2025-02-15T09:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>7500.00</CtrlSum>
      <InitgPty><Nm>Consolidated Industries Inc</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BATCH-20250215-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <ReqdExctnDt><Dt>2025-02-17</Dt></ReqdExctnDt>
      <Dbtr>
        <Nm>Consolidated Industries Inc</Nm>
        <PstlAdr>
          <StrtNm>200 Park Avenue</StrtNm>
          <TwnNm>New York</TwnNm>
          <PstCd>10166</PstCd>
          <Ctry>US</Ctry>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct><Id><Othr><Id>US33100098765432</Id></Othr></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BICFI>CORPUS33XXX</BICFI></FinInstnId></DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>PAY-001-2025</EndToEndId>
        </PmtId>
        <Amt><InstdAmt Ccy="USD">7500.00</InstdAmt></Amt>
        <CdtrAgt><FinInstnId><BICFI>NWBKGB2LXXX</BICFI></FinInstnId></CdtrAgt>
        <Cdtr>
          <Nm>Hamilton Trading Ltd</Nm>
          <PstlAdr>
            <StrtNm>47 King William Street</StrtNm>
            <TwnNm>London</TwnNm>
            <PstCd>EC4R 9AF</PstCd>
            <Ctry>GB</Ctry>
          </PstlAdr>
        </Cdtr>
        <CdtrAcct><Id><IBAN>GB29NWBK60161331926819</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>CONTRACT REF CTR-2025-0412</Ustrd></RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
