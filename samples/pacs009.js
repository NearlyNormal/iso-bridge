var SAMPLE_PACS009 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08">
  <FICdtTrf>
    <GrpHdr>
      <MsgId>PACS009-20250215-001</MsgId>
      <CreDtTm>2025-02-15T10:30:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTR-20250215-001</InstrId>
        <EndToEndId>E2E-PACS009-001</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">500000.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2025-02-15</IntrBkSttlmDt>
      <Dbtr>
        <FinInstnId><BICFI>CHASUS33XXX</BICFI></FinInstnId>
      </Dbtr>
      <CdtrAgt>
        <FinInstnId><BICFI>CITIUS33XXX</BICFI></FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <FinInstnId><BICFI>DEUTDEFFXXX</BICFI></FinInstnId>
      </Cdtr>
      <InstrForNxtAgt>
        <InstrInf>FUNDS TRANSFER FOR TREASURY OPERATIONS</InstrInf>
      </InstrForNxtAgt>
    </CdtTrfTxInf>
  </FICdtTrf>
</Document>`;
