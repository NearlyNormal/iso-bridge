var SAMPLE_PACS004 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.09">
  <PmtRtr>
    <GrpHdr>
      <MsgId>PACS004-20250215-001</MsgId>
      <CreDtTm>2025-02-15T11:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
    </GrpHdr>
    <TxInf>
      <RtrId>RET-20250215-001</RtrId>
      <OrgnlGrpInf>
        <OrgnlMsgId>PACS008-20250101-001</OrgnlMsgId>
        <OrgnlMsgNmId>pacs.008.001.08</OrgnlMsgNmId>
      </OrgnlGrpInf>
      <OrgnlEndToEndId>SHANX-20250101-001</OrgnlEndToEndId>
      <RtrdIntrBkSttlmAmt Ccy="USD">10000.00</RtrdIntrBkSttlmAmt>
      <IntrBkSttlmDt>2025-02-15</IntrBkSttlmDt>
      <RtrRsnInf>
        <Rsn><Cd>AM04</Cd></Rsn>
        <AddtlInf>INSUFFICIENT FUNDS</AddtlInf>
      </RtrRsnInf>
      <OrgnlTxRef>
        <Dbtr>
          <Nm>Acme Corporation</Nm>
          <PstlAdr><Ctry>GB</Ctry></PstlAdr>
        </Dbtr>
        <DbtrAgt>
          <FinInstnId><BICFI>NWBKGB2LXXX</BICFI></FinInstnId>
        </DbtrAgt>
        <CdtrAgt>
          <FinInstnId><BICFI>COBADEFFXXX</BICFI></FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Global Trade Bank</Nm>
          <PstlAdr><Ctry>DE</Ctry></PstlAdr>
        </Cdtr>
      </OrgnlTxRef>
    </TxInf>
  </PmtRtr>
</Document>`;
