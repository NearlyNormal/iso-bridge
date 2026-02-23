/* ─── ISO Bridge: MT Message Parser ─── */
/* Extracted from swift-parser for standalone use in format translation */
/* No external dependencies — this file is fully self-contained */

// ─── FIELD TAG DICTIONARY ───
var fieldDictionary = {
  '20':  { name: 'Transaction Reference', key: 'transactionReference', format: '16x', mandatory: true },
  '21':  { name: 'Related Reference', key: 'relatedReference', format: '16x' },
  '13C': { name: 'Time Indication', key: 'timeIndication', format: '/8c/4!n1!x4!n' },
  '23B': { name: 'Bank Operation Code', key: 'bankOperationCode', format: '4!a', mandatory: true },
  '23E': { name: 'Instruction Code', key: 'instructionCode', format: '4!c[/30x]' },
  '26T': { name: 'Transaction Type Code', key: 'transactionTypeCode', format: '3!a' },
  '32A': { name: 'Value Date / Currency / Amount', key: 'valueDateCurrencyAmount', format: '6!n3!a15d', compound: true },
  '33B': { name: 'Currency / Instructed Amount', key: 'instructedAmount', format: '3!a15d', compound: true },
  '36':  { name: 'Exchange Rate', key: 'exchangeRate', format: '12d' },
  '50A': { name: 'Ordering Customer (BIC)', key: 'orderingCustomer', format: 'BIC', party: true },
  '50K': { name: 'Ordering Customer (Name & Address)', key: 'orderingCustomer', format: '4*35x', party: true },
  '50F': { name: 'Ordering Customer (Party ID)', key: 'orderingCustomer', format: 'party', party: true },
  '52A': { name: 'Ordering Institution', key: 'orderingInstitution', format: 'BIC', party: true },
  '52D': { name: 'Ordering Institution (Name & Address)', key: 'orderingInstitution', format: '4*35x', party: true },
  '53A': { name: 'Sender Correspondent', key: 'senderCorrespondent', format: 'BIC' },
  '53B': { name: 'Sender Correspondent (Location)', key: 'senderCorrespondent', format: '3*35x' },
  '54A': { name: 'Receiver Correspondent', key: 'receiverCorrespondent', format: 'BIC' },
  '56A': { name: 'Intermediary Institution', key: 'intermediaryInstitution', format: 'BIC' },
  '56D': { name: 'Intermediary Institution (Name & Address)', key: 'intermediaryInstitution', format: '4*35x', party: true },
  '57A': { name: 'Account With Institution', key: 'accountWithInstitution', format: 'BIC', party: true },
  '57D': { name: 'Account With Institution (Name & Address)', key: 'accountWithInstitution', format: '4*35x', party: true },
  '59':  { name: 'Beneficiary Customer', key: 'beneficiary', format: '4*35x', party: true },
  '59A': { name: 'Beneficiary Customer (BIC)', key: 'beneficiary', format: 'BIC', party: true },
  '59F': { name: 'Beneficiary Customer (Party ID)', key: 'beneficiary', format: 'party', party: true },
  '70':  { name: 'Remittance Information', key: 'remittanceInformation', format: '4*35x' },
  '71A': { name: 'Details of Charges', key: 'chargeBearer', format: '3!a' },
  '71F': { name: 'Sender Charges', key: 'senderCharges', format: '3!a15d', compound: true },
  '71G': { name: 'Receiver Charges', key: 'receiverCharges', format: '3!a15d', compound: true },
  '72':  { name: 'Sender to Receiver Information', key: 'senderToReceiverInfo', format: '6*35x' },
  '77B': { name: 'Regulatory Reporting', key: 'regulatoryReporting', format: '3*35x' },
  // MT202 additional fields
  '57B': { name: 'Account With Institution (Location)', key: 'accountWithInstitution', format: '3*35x', party: true },
  '58A': { name: 'Beneficiary Institution', key: 'beneficiaryInstitution', format: 'BIC' },
  // MT940 / MT950 fields
  '25':  { name: 'Account Identification', key: 'accountIdentification', format: '35x' },
  '28C': { name: 'Statement Number / Sequence Number', key: 'statementNumber', format: '5n[/5n]', compound: true },
  '60F': { name: 'Opening Balance (First)', key: 'openingBalance', format: 'balance', compound: true },
  '60M': { name: 'Opening Balance (Intermediate)', key: 'openingBalanceIntermediate', format: 'balance', compound: true },
  '61':  { name: 'Statement Line', key: 'statementLine', format: 'statement_line', compound: true, repeating: true },
  '62F': { name: 'Closing Balance (Booked)', key: 'closingBalance', format: 'balance', compound: true },
  '62M': { name: 'Closing Balance (Intermediate)', key: 'closingBalanceIntermediate', format: 'balance', compound: true },
  '64':  { name: 'Closing Available Balance', key: 'closingAvailableBalance', format: 'balance', compound: true },
  '65':  { name: 'Forward Available Balance', key: 'forwardAvailableBalance', format: 'balance', compound: true, repeating: true },
  '86':  { name: 'Information to Account Owner', key: 'informationToAccountOwner', format: '6*65x', repeating: true },
};

// ─── MESSAGE TYPE SCHEMAS ───
// Named mtSchemaRegistry to avoid conflicts with iso20022-validator's global schemaRegistry
var mtSchemaRegistry = {
  'MT103': {
    name: 'Single Customer Credit Transfer',
    mandatory: ['20', '23B', '32A', '50A|50K|50F', '59|59A|59F', '71A'],
    optional: ['13C', '21', '23E', '26T', '33B', '36', '52A|52D', '53A|53B', '54A', '56A|56D', '57A|57D', '70', '71F', '71G', '72', '77B'],
  },
  'MT202': {
    name: 'General Financial Institution Transfer',
    mandatory: ['20', '21', '32A', '58A'],
    optional: ['13C', '52A', '52D', '53A', '53B', '54A', '56A', '56D', '57A', '57B', '57D', '72'],
  },
  'MT940': {
    name: 'Customer Statement Message',
    mandatory: ['20', '25', '28C', '60F', '62F'],
    optional: ['21', '60M', '61', '62M', '64', '65', '86'],
    repeating: ['61', '86', '65'],
  },
  'MT950': {
    name: 'Statement Message',
    mandatory: ['20', '25', '28C', '60F', '62F'],
    optional: ['60M', '61', '62M', '64'],
    repeating: ['61'],
  }
};

// ─── HTML ESCAPE UTILITY ───
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── ENVELOPE PARSER ───
function parseEnvelope(rawText) {
  var result = { header1: null, header2: null, header3: null, textBlock: '', trailer: null, detectedType: null };

  // Block 1: Basic Header {1:...}
  var m1 = rawText.match(/\{1:([^}]+)\}/);
  if (m1) {
    var h = m1[1];
    result.header1 = {
      appId: h.charAt(0),
      serviceId: h.substring(1, 3),
      senderBIC: h.substring(3, 15),
      sessionNumber: h.substring(15, 19),
      sequenceNumber: h.substring(19, 25),
    };
  }

  // Block 2: Application Header {2:...}
  var m2 = rawText.match(/\{2:([^}]+)\}/);
  if (m2) {
    var ah = m2[1];
    var direction = ah.charAt(0); // I = Input, O = Output
    if (direction === 'I') {
      var msgType = ah.substring(1, 4);
      result.header2 = {
        direction: 'Input',
        messageType: msgType,
        receiverBIC: ah.substring(4, 16),
        priority: ah.charAt(16) || 'N',
      };
      result.detectedType = 'MT' + msgType;
    } else if (direction === 'O') {
      var msgType = ah.substring(1, 4);
      result.header2 = {
        direction: 'Output',
        messageType: msgType,
        inputTime: ah.substring(4, 8),
        inputDate: ah.substring(8, 14),
        senderBIC: ah.substring(14, 26),
        outputDate: ah.substring(26, 32),
        outputTime: ah.substring(32, 36),
        priority: ah.charAt(36) || 'N',
      };
      result.detectedType = 'MT' + msgType;
    }
  }

  // Block 3: User Header (optional) {3:...}
  var m3 = rawText.match(/\{3:([^}]+)\}/);
  if (m3) {
    result.header3 = m3[1];
  }

  // Block 4: Text Block {4:\n...\n-}
  var m4 = rawText.match(/\{4:\s*\n([\s\S]*?)\n-\}/);
  if (m4) {
    result.textBlock = m4[1];
  } else {
    // Fallback: try without envelope, assume raw text block
    var stripped = rawText.replace(/\{[12345]:[^}]*\}/g, '').trim();
    if (stripped.indexOf(':') === 0 || stripped.match(/^:\d{2}[A-Z]?:/)) {
      result.textBlock = stripped;
    }
  }

  // Block 5: Trailer (optional) {5:...}
  var m5 = rawText.match(/\{5:([^}]+)\}/);
  if (m5) {
    result.trailer = m5[1];
  }

  return result;
}

// ─── FIELD SPLITTER ───
// Supports repeating tags (e.g. :61:, :86:, :65: in MT940)
function splitFields(textBlock) {
  var fields = [];
  var lines = textBlock.split('\n');
  var currentTag = null;
  var currentValue = '';
  var currentLine = 0;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var tagMatch = line.match(/^:(\d{2}[A-Z]?):(.*)/);
    if (tagMatch) {
      if (currentTag !== null) {
        fields.push({ tag: currentTag, value: currentValue.trim(), lineNumber: currentLine });
      }
      currentTag = tagMatch[1];
      currentValue = tagMatch[2];
      currentLine = i + 1;
    } else if (currentTag !== null) {
      currentValue += '\n' + line;
    }
  }

  if (currentTag !== null) {
    fields.push({ tag: currentTag, value: currentValue.trim(), lineNumber: currentLine });
  }

  return fields;
}

// ─── COMPOUND FIELD DECODERS ───
function decode32A(value) {
  // Format: YYMMDD + CCY(3) + Amount (with comma as decimal separator)
  var cleaned = value.replace(/\n/g, '').trim();
  var dateStr = cleaned.substring(0, 6);
  var ccy = cleaned.substring(6, 9);
  var amtStr = cleaned.substring(9).replace(',', '.');

  var yy = parseInt(dateStr.substring(0, 2), 10);
  var mm = dateStr.substring(2, 4);
  var dd = dateStr.substring(4, 6);
  var fullYear = (yy > 79 ? 1900 : 2000) + yy;

  return {
    date: fullYear + '-' + mm + '-' + dd,
    currency: ccy,
    amount: parseFloat(amtStr) || 0,
  };
}

function decode33B(value) {
  var cleaned = value.replace(/\n/g, '').trim();
  var ccy = cleaned.substring(0, 3);
  var amtStr = cleaned.substring(3).replace(',', '.');
  return {
    currency: ccy,
    amount: parseFloat(amtStr) || 0,
  };
}

function decodeParty(value) {
  var lines = value.split('\n');
  var account = null;
  var nameLines = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (i === 0 && line.charAt(0) === '/') {
      account = line.substring(1);
    } else if (line.length > 0) {
      nameLines.push(line);
    }
  }

  var result = {};
  if (account) result.account = account;
  if (nameLines.length > 0) result.name = nameLines[0];
  if (nameLines.length > 1) result.address = nameLines.slice(1);
  return result;
}

function decodePartyF(value) {
  // :50F: format — structured party with coded lines
  var lines = value.split('\n');
  var result = {};
  var addressLines = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (i === 0 && line.charAt(0) === '/') {
      result.account = line.substring(1);
    } else if (line.match(/^1\//)) {
      result.name = line.substring(2);
    } else if (line.match(/^2\//)) {
      addressLines.push(line.substring(2));
    } else if (line.match(/^3\//)) {
      result.countryCity = line.substring(2);
    } else if (line.match(/^4\//)) {
      result.dateOfBirth = line.substring(2);
    }
  }

  if (addressLines.length > 0) result.address = addressLines;
  return result;
}

function decodeCharges(value) {
  var cleaned = value.replace(/\n/g, '').trim();
  var ccy = cleaned.substring(0, 3);
  var amtStr = cleaned.substring(3).replace(',', '.');
  return {
    currency: ccy,
    amount: parseFloat(amtStr) || 0,
  };
}

// ─── MT940/MT950 DECODERS ───
function decodeBalance(text) {
  // Format: D/C (1 char) + date (6 digits YYMMDD) + currency (3 chars) + amount (comma decimal)
  var cleaned = text.replace(/\n/g, '').trim();
  var indicator = cleaned.charAt(0); // 'C' or 'D'
  var dateStr = cleaned.substring(1, 7);
  var ccy = cleaned.substring(7, 10);
  var amtStr = cleaned.substring(10).replace(',', '.');

  var yy = parseInt(dateStr.substring(0, 2), 10);
  var mm = dateStr.substring(2, 4);
  var dd = dateStr.substring(4, 6);
  var fullYear = (yy > 79 ? 1900 : 2000) + yy;

  return {
    indicator: indicator,
    date: fullYear + '-' + mm + '-' + dd,
    currency: ccy,
    amount: parseFloat(amtStr) || 0,
  };
}

function decodeStatementLine(text) {
  // :61: format: value date (6n) + [entry date (4n)] + D/C mark (1-2c) + [funds code (1a)] + amount (15d) +
  //   transaction type (1a) + id code (3c) + customer ref (16x) + [//bank ref (16x)] + [supplementary (34x)]
  var cleaned = text.replace(/\n/g, '').trim();
  var pos = 0;

  // Value date: 6 digits YYMMDD
  var valDateStr = cleaned.substring(pos, pos + 6);
  pos += 6;
  var yy = parseInt(valDateStr.substring(0, 2), 10);
  var fullYear = (yy > 79 ? 1900 : 2000) + yy;
  var valueDate = fullYear + '-' + valDateStr.substring(2, 4) + '-' + valDateStr.substring(4, 6);

  // Entry date: optional 4 digits MMDD
  var entryDate = '';
  if (cleaned.substring(pos, pos + 4).match(/^\d{4}$/)) {
    var entMM = cleaned.substring(pos, pos + 2);
    var entDD = cleaned.substring(pos + 2, pos + 4);
    entryDate = fullYear + '-' + entMM + '-' + entDD;
    pos += 4;
  }

  // D/C mark: C, D, RC, RD
  var dcMark = '';
  if (cleaned.charAt(pos) === 'R') {
    dcMark = cleaned.substring(pos, pos + 2);
    pos += 2;
  } else {
    dcMark = cleaned.charAt(pos);
    pos += 1;
  }

  // Funds code: optional single letter (only if next char is a letter before the amount digits)
  var fundsCode = '';
  if (cleaned.charAt(pos).match(/[A-Za-z]/) && !cleaned.charAt(pos).match(/[.,\d]/)) {
    fundsCode = cleaned.charAt(pos);
    pos += 1;
  }

  // Amount: digits with optional comma decimal
  var amtMatch = cleaned.substring(pos).match(/^[\d,]+/);
  var amount = 0;
  if (amtMatch) {
    amount = parseFloat(amtMatch[0].replace(',', '.')) || 0;
    pos += amtMatch[0].length;
  }

  // Transaction type (1 char) + identification code (3 chars)
  var txType = cleaned.charAt(pos) || '';
  var idCode = cleaned.substring(pos + 1, pos + 4) || '';
  pos += 4;

  // Customer reference: up to 16 chars, terminated by // or newline
  var rest = cleaned.substring(pos);
  var custRef = '';
  var bankRef = '';
  var supplementary = '';

  var slashIdx = rest.indexOf('//');
  if (slashIdx !== -1) {
    custRef = rest.substring(0, slashIdx);
    var afterSlash = rest.substring(slashIdx + 2);
    // Bank ref up to 16 chars, then optional \n + supplementary
    var nlIdx = afterSlash.indexOf('\n');
    if (nlIdx !== -1) {
      bankRef = afterSlash.substring(0, nlIdx);
      supplementary = afterSlash.substring(nlIdx + 1);
    } else {
      bankRef = afterSlash.substring(0, 16);
      supplementary = afterSlash.substring(16);
    }
  } else {
    custRef = rest.substring(0, 16);
    supplementary = rest.substring(16);
  }

  return {
    valueDate: valueDate,
    entryDate: entryDate,
    dcMark: dcMark,
    fundsCode: fundsCode,
    amount: amount,
    transactionType: txType,
    identificationCode: idCode,
    customerReference: custRef.trim(),
    bankReference: bankRef.trim(),
    supplementary: supplementary.trim(),
  };
}

function decodeStatementNumber(text) {
  var cleaned = text.replace(/\n/g, '').trim();
  var parts = cleaned.split('/');
  return {
    statementNumber: parts[0] || '',
    sequenceNumber: parts[1] || '',
  };
}

// ─── MAIN PARSE FUNCTION ───
function parseMT(rawText, forceType) {
  var envelope = parseEnvelope(rawText);
  var detectedType = forceType || envelope.detectedType;
  var schema = detectedType ? mtSchemaRegistry[detectedType] : null;

  var result = {
    messageType: detectedType || 'Unknown',
    messageTypeName: schema ? schema.name : '',
    envelope: {},
    fields: {},
    extracted: {},
    errors: [],
    warnings: [],
  };

  // Envelope info
  if (envelope.header1) {
    result.envelope.senderBIC = envelope.header1.senderBIC;
  }
  if (envelope.header2) {
    result.envelope.direction = envelope.header2.direction;
    result.envelope.receiverBIC = envelope.header2.receiverBIC || '';
    result.envelope.priority = envelope.header2.priority;
  }

  if (!envelope.textBlock) {
    result.errors.push({ tag: null, message: 'No text block (Block 4) found. Ensure message contains {4: ... -} block.' });
    result.valid = false;
    return result;
  }

  var fields = splitFields(envelope.textBlock);

  if (fields.length === 0) {
    result.errors.push({ tag: null, message: 'No field tags found in text block.' });
    result.valid = false;
    return result;
  }

  // Collect all tags found
  var foundTags = {};
  var senderChargesArr = [];
  // Track repeating fields (MT940: :61:, :86:, :65:)
  var repeatingTags = schema && schema.repeating ? schema.repeating : [];
  var repeatingData = {}; // tag -> array of decoded values

  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var def = fieldDictionary[f.tag];

    if (!def) {
      result.warnings.push({ tag: f.tag, message: 'Unknown field tag :' + f.tag + ':' });
      result.fields[f.tag] = { tag: f.tag, rawValue: f.value, name: 'Unknown' };
      continue;
    }

    foundTags[f.tag] = true;
    var decoded;
    var isRepeating = repeatingTags.indexOf(f.tag) !== -1;

    // Decode based on tag
    if (f.tag === '32A') {
      decoded = decode32A(f.value);
      result.extracted.valueDate = decoded.date;
      result.extracted.currency = decoded.currency;
      result.extracted.amount = decoded.amount;
    } else if (f.tag === '33B') {
      decoded = decode33B(f.value);
      result.extracted.instructedCurrency = decoded.currency;
      result.extracted.instructedAmount = decoded.amount;
    } else if (f.tag === '71F') {
      decoded = decodeCharges(f.value);
      senderChargesArr.push(decoded);
      decoded = senderChargesArr;
    } else if (f.tag === '71G') {
      decoded = decodeCharges(f.value);
    } else if (f.tag === '60F' || f.tag === '60M' || f.tag === '62F' || f.tag === '62M' || f.tag === '64' || f.tag === '65') {
      decoded = decodeBalance(f.value);
    } else if (f.tag === '61') {
      decoded = decodeStatementLine(f.value);
    } else if (f.tag === '28C') {
      decoded = decodeStatementNumber(f.value);
    } else if (def.party && (def.format === '4*35x' || def.format === 'BIC')) {
      if (def.format === 'BIC') {
        decoded = f.value.trim();
      } else {
        decoded = decodeParty(f.value);
      }
    } else if (def.party && def.format === 'party') {
      decoded = f.tag.endsWith('F') ? decodePartyF(f.value) : decodeParty(f.value);
    } else {
      decoded = f.value.trim();
    }

    // Handle repeating fields: accumulate as arrays
    if (isRepeating) {
      if (!repeatingData[f.tag]) repeatingData[f.tag] = [];
      repeatingData[f.tag].push({
        tag: f.tag,
        name: def.name,
        key: def.key,
        rawValue: f.value,
        decoded: decoded,
        party: def.party || false,
      });
      // Store as array in fields
      result.fields[f.tag] = repeatingData[f.tag];
    } else {
      result.fields[f.tag] = {
        tag: f.tag,
        name: def.name,
        key: def.key,
        rawValue: f.value,
        decoded: decoded,
        party: def.party || false,
      };
    }

    // Map to extracted using key
    if (def.key === 'valueDateCurrencyAmount') {
      // Already extracted above
    } else if (def.key === 'senderCharges') {
      result.extracted.senderCharges = senderChargesArr;
    } else if (isRepeating) {
      result.extracted[def.key] = repeatingData[f.tag].map(function(item) { return item.decoded; });
    } else {
      result.extracted[def.key] = decoded;
    }
  }

  // Validate mandatory fields
  if (schema) {
    for (var m = 0; m < schema.mandatory.length; m++) {
      var mandatoryGroup = schema.mandatory[m];
      var alternatives = mandatoryGroup.split('|');
      var found = false;
      for (var a = 0; a < alternatives.length; a++) {
        if (foundTags[alternatives[a]]) {
          found = true;
          break;
        }
      }
      if (!found) {
        var altNames = alternatives.map(function(t) {
          return ':' + t + ':' + (fieldDictionary[t] ? ' (' + fieldDictionary[t].name + ')' : '');
        }).join(' or ');
        result.errors.push({
          tag: alternatives[0],
          message: 'Missing mandatory field ' + altNames,
        });
      }
    }
  }

  result.valid = result.errors.length === 0;
  result.parsedAt = new Date().toISOString();
  return result;
}
