var SAMPLE_PAIN008 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>PAIN008-20250215-001</MsgId>
      <CreDtTm>2025-02-15T09:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>4200.00</CtrlSum>
      <InitgPty><Nm>Consolidated Industries Inc</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>DD-20250215-001</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <ReqdColltnDt><Dt>2025-02-17</Dt></ReqdColltnDt>
      <Cdtr>
        <Nm>Consolidated Industries Inc</Nm>
        <PstlAdr>
          <StrtNm>200 Park Avenue</StrtNm>
          <TwnNm>New York</TwnNm>
          <PstCd>10166</PstCd>
          <Ctry>US</Ctry>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct><Id><Othr><Id>US33100098765432</Id></Othr></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BICFI>CHASUS33XXX</BICFI></FinInstnId></CdtrAgt>
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>DDPAY-001-2025</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="USD">4200.00</InstdAmt>
        <DbtrAgt><FinInstnId><BICFI>DEUTDEFFXXX</BICFI></FinInstnId></DbtrAgt>
        <Dbtr>
          <Nm>Mueller GmbH</Nm>
          <PstlAdr>
            <StrtNm>Berliner Str 45</StrtNm>
            <TwnNm>Frankfurt</TwnNm>
            <PstCd>60311</PstCd>
            <Ctry>DE</Ctry>
          </PstlAdr>
        </Dbtr>
        <DbtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></DbtrAcct>
        <RmtInf><Ustrd>SUBSCRIPTION FEB 2025 REF DD-0412</Ustrd></RmtInf>
      </DrctDbtTxInf>
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
