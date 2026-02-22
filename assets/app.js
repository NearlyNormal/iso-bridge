/* ─── ISO Bridge: Conversion Engine & UI ─── */

var hljsAvailable = (typeof hljs !== 'undefined');

// ─── STATE ───
var currentOutput = null;   // { xml, json, warnings, fieldMap, dataGaps, dataLoss }
var currentView = 'xml';    // 'xml' or 'json'

// ─── CONFIG READERS ───
function getFormatsForCountry(code) {
  var c = COUNTRIES[code];
  return c ? c.formats : [];
}

function getValidTargets(fromFormat) {
  var targets = [];
  for (var i = 0; i < TRANSLATIONS.length; i++) {
    if (TRANSLATIONS[i].from === fromFormat) {
      targets.push(TRANSLATIONS[i].to);
    }
  }
  return targets;
}

function getTranslationPath(from, to) {
  for (var i = 0; i < TRANSLATIONS.length; i++) {
    if (TRANSLATIONS[i].from === from && TRANSLATIONS[i].to === to) {
      return TRANSLATIONS[i];
    }
  }
  return null;
}

function getMapping(ref) {
  // Resolve global variable by name
  if (ref === 'MAPPING_MT103_PACS008') return MAPPING_MT103_PACS008;
  if (ref === 'MAPPING_PACS008_MT103') return MAPPING_PACS008_MT103;
  return null;
}

// ─── FORMAT METADATA ───
var FORMAT_LABELS = {
  'MT103': 'MT103 — Single Customer Credit Transfer',
  'MT202': 'MT202 — Financial Institution Transfer',
  'MT940': 'MT940 — Customer Statement',
  'pacs.008': 'pacs.008 — FI to FI Customer Credit Transfer',
  'pain.001': 'pain.001 — Customer Credit Transfer Initiation',
  'camt.053': 'camt.053 — Bank to Customer Statement'
};

function formatLabel(fmt) {
  return FORMAT_LABELS[fmt] || fmt;
}

// ─── FORMAT CATEGORIES (for dropdown grid) ───
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

// ─── SELECTOR LOGIC ───
function populateCountries() {
  var list = document.getElementById('country-list');
  list.innerHTML = '';
  var codes = Object.keys(COUNTRIES);
  var active = [];
  var planned = [];
  for (var i = 0; i < codes.length; i++) {
    if (COUNTRIES[codes[i]].planned) planned.push(codes[i]);
    else active.push(codes[i]);
  }
  // Active countries
  for (var i = 0; i < active.length; i++) {
    var c = COUNTRIES[active[i]];
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-country', active[i]);
    a.innerHTML = '<span class="country-flag">' + c.flag + '</span>  <span class="country-name">' + escHtml(c.name) + '</span>';
    a.addEventListener('click', onCountryClick);
    li.appendChild(a);
    list.appendChild(li);
  }
  // Divider
  var divLi = document.createElement('li');
  divLi.className = 'uk-nav-divider';
  list.appendChild(divLi);
  // Planned countries (greyed out)
  for (var i = 0; i < planned.length; i++) {
    var c = COUNTRIES[planned[i]];
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.className = 'country-planned';
    a.innerHTML = '<span class="country-flag">' + c.flag + '</span>  <span class="country-name">' + escHtml(c.name) + '</span><span class="country-soon">coming soon</span>';
    li.appendChild(a);
    list.appendChild(li);
  }
}

function onCountryClick(e) {
  e.preventDefault();
  var code = e.currentTarget.getAttribute('data-country');
  if (!code) return;
  // Update hidden input
  document.getElementById('country-select').value = code;
  // Update button text
  var c = COUNTRIES[code];
  document.getElementById('country-btn-text').textContent = c.flag + '  ' + c.name;
  // Mark active
  var links = document.querySelectorAll('#country-list a[data-country]');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.toggle('country-active', links[i].getAttribute('data-country') === code);
  }
  // Close dropdown
  UIkit.dropdown(document.getElementById('country-dropdown')).hide(false);
  // Trigger change logic
  onCountryChange();
}

// ─── FORMAT DROPDOWN GRID BUILDER ───
function buildFormatGrid(containerId, availableFormats, onSelect, role, currentValue) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';

  for (var c = 0; c < FORMAT_CATEGORIES.length; c++) {
    var cat = FORMAT_CATEGORIES[c];

    // Category heading
    var heading = document.createElement('div');
    heading.className = 'format-cat-heading';
    heading.textContent = cat.name;
    container.appendChild(heading);

    // Column sub-headers
    var colHead = document.createElement('div');
    colHead.className = 'format-col-headers';
    colHead.innerHTML = '<span></span><span>Legacy</span><span>Modern</span>';
    container.appendChild(colHead);

    // Rows — always show all, grey out unavailable
    for (var r = 0; r < cat.rows.length; r++) {
      var row = cat.rows[r];
      var legacyAvail = row.legacy && availableFormats.indexOf(row.legacy) !== -1;
      var modernAvail = row.modern && availableFormats.indexOf(row.modern) !== -1;
      var rowActive = legacyAvail || modernAvail;
      var isSelected = currentValue && (row.legacy === currentValue || row.modern === currentValue);

      var rowEl = document.createElement('div');
      rowEl.className = 'format-row';
      if (!rowActive) rowEl.classList.add('format-row-disabled');
      if (isSelected) rowEl.classList.add('format-row-selected');

      // Description
      var descEl = document.createElement('span');
      descEl.className = 'format-row-desc';
      descEl.textContent = row.desc;
      rowEl.appendChild(descEl);

      // Legacy cell
      var legEl = document.createElement('span');
      legEl.className = 'format-row-legacy';
      if (row.legacy) {
        legEl.textContent = row.legacy;
        if (legacyAvail) {
          legEl.classList.add('format-cell-selectable');
          if (currentValue === row.legacy) legEl.classList.add('format-cell-selected');
          legEl.setAttribute('data-format', row.legacy);
          legEl.addEventListener('click', function(e) {
            e.stopPropagation();
            onSelect(this.getAttribute('data-format'));
          });
        } else {
          legEl.classList.add('format-cell-dim');
        }
      } else {
        legEl.textContent = '—';
        legEl.classList.add('format-cell-dim');
      }
      rowEl.appendChild(legEl);

      // Modern cell
      var modEl = document.createElement('span');
      modEl.className = 'format-row-modern';
      if (row.modern) {
        modEl.textContent = row.modern;
        if (modernAvail) {
          modEl.classList.add('format-cell-selectable');
          if (currentValue === row.modern) modEl.classList.add('format-cell-selected');
          modEl.setAttribute('data-format', row.modern);
          modEl.addEventListener('click', function(e) {
            e.stopPropagation();
            onSelect(this.getAttribute('data-format'));
          });
        } else {
          modEl.classList.add('format-cell-dim');
        }
      } else {
        modEl.textContent = '—';
        modEl.classList.add('format-cell-dim');
      }
      rowEl.appendChild(modEl);

      // Clicking the whole row selects whichever is available
      if (rowActive) {
        rowEl.setAttribute('data-legacy', row.legacy || '');
        rowEl.setAttribute('data-modern', row.modern || '');
        rowEl.setAttribute('data-legacy-avail', legacyAvail ? '1' : '0');
        rowEl.setAttribute('data-modern-avail', modernAvail ? '1' : '0');
        rowEl.addEventListener('click', function() {
          var la = this.getAttribute('data-legacy-avail') === '1';
          var ma = this.getAttribute('data-modern-avail') === '1';
          if (la && !ma) onSelect(this.getAttribute('data-legacy'));
          else if (ma && !la) onSelect(this.getAttribute('data-modern'));
          else if (la && ma) {
            if (role === 'from') onSelect(this.getAttribute('data-legacy'));
            else onSelect(this.getAttribute('data-modern'));
          }
        });
      }

      container.appendChild(rowEl);
    }
  }
}

function onCountryChange() {
  var code = document.getElementById('country-select').value;
  var fromInput = document.getElementById('from-select');
  var toInput = document.getElementById('to-select');
  var fromBtn = document.getElementById('from-btn');
  var toBtn = document.getElementById('to-btn');

  fromInput.value = '';
  toInput.value = '';
  document.getElementById('from-btn-text').textContent = 'Source format...';
  document.getElementById('to-btn-text').textContent = 'Target format...';
  fromBtn.classList.remove('has-value');
  toBtn.classList.remove('has-value');
  toBtn.disabled = true;
  document.getElementById('from-grid').innerHTML = '';
  document.getElementById('to-grid').innerHTML = '';
  hideWarning();

  if (!code) {
    fromBtn.disabled = true;
    return;
  }

  var formats = getFormatsForCountry(code);
  // Only show formats that have at least one translation path (as source)
  var availableFrom = [];
  for (var i = 0; i < formats.length; i++) {
    if (getValidTargets(formats[i]).length > 0) {
      availableFrom.push(formats[i]);
    }
  }

  buildFormatGrid('from-grid', availableFrom, function(fmt) {
    fromInput.value = fmt;
    document.getElementById('from-btn-text').textContent = formatLabel(fmt);
    fromBtn.classList.add('has-value');
    UIkit.dropdown(document.getElementById('from-dropdown')).hide(false);
    onFromChange();
  }, 'from');

  fromBtn.disabled = false;
  updateSourceTitle();
}

function onFromChange() {
  var fromVal = document.getElementById('from-select').value;
  var toInput = document.getElementById('to-select');
  var toBtn = document.getElementById('to-btn');
  var countryCode = document.getElementById('country-select').value;
  var countryFormats = getFormatsForCountry(countryCode);

  toInput.value = '';
  document.getElementById('to-btn-text').textContent = 'Target format...';
  toBtn.classList.remove('has-value');
  document.getElementById('to-grid').innerHTML = '';
  hideWarning();

  if (!fromVal) {
    toBtn.disabled = true;
    return;
  }

  var targets = getValidTargets(fromVal);
  var available = [];
  for (var i = 0; i < targets.length; i++) {
    if (countryFormats.indexOf(targets[i]) !== -1) {
      available.push(targets[i]);
    }
  }

  buildFormatGrid('to-grid', available, function(fmt) {
    toInput.value = fmt;
    document.getElementById('to-btn-text').textContent = formatLabel(fmt);
    toBtn.classList.add('has-value');
    UIkit.dropdown(document.getElementById('to-dropdown')).hide(false);
    onToChange();
  }, 'to');

  toBtn.disabled = false;

  // Auto-select if only one target
  if (available.length === 1) {
    toInput.value = available[0];
    document.getElementById('to-btn-text').textContent = formatLabel(available[0]);
    toBtn.classList.add('has-value');
    onToChange();
  }
  updateSourceTitle();
}

function onToChange() {
  var fromVal = document.getElementById('from-select').value;
  var toVal = document.getElementById('to-select').value;

  if (!fromVal || !toVal) {
    hideWarning();
    return;
  }

  var path = getTranslationPath(fromVal, toVal);
  if (path) {
    showWarning(path);
  }
}

function showWarning(path) {
  var el = document.getElementById('translation-warning');
  var text = el.querySelector('.warning-text');

  if (path.lossless) {
    el.className = 'translation-warning';
    text.innerHTML = '<img src="assets/compare.svg" alt="" class="warning-icon-img"> Translation is lossless — all fields map cleanly';
  } else {
    el.className = 'translation-warning';
    text.innerHTML = '<img src="assets/compare.svg" alt="" class="warning-icon-img"> Translation is lossy — ' + path.warnings.length + ' field mapping warning' + (path.warnings.length !== 1 ? 's' : '');
  }
  el.style.display = '';
}

function hideWarning() {
  document.getElementById('translation-warning').style.display = 'none';
}

function updateSourceTitle() {
  var fromVal = document.getElementById('from-select').value;
  var title = document.getElementById('source-title');
  title.textContent = fromVal ? fromVal + ' Input' : 'Source';
}

// ─── XML UTILITIES ───
function getXmlText(parent, tagName) {
  if (!parent) return '';
  // Walk children to find element by local name (namespace-agnostic)
  var children = parent.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.nodeType === 1 && (child.localName === tagName || child.nodeName === tagName)) {
      return child.textContent || '';
    }
  }
  return '';
}

function getXmlEl(parent, tagName) {
  if (!parent) return null;
  var children = parent.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.nodeType === 1 && (child.localName === tagName || child.nodeName === tagName)) {
      return child;
    }
  }
  return null;
}

function getXmlPath(root, path) {
  var parts = path.split('/');
  var node = root;
  for (var i = 0; i < parts.length; i++) {
    node = getXmlEl(node, parts[i]);
    if (!node) return null;
  }
  return node;
}

function getXmlPathText(root, path) {
  var node = getXmlPath(root, path);
  return node ? (node.textContent || '') : '';
}

// ─── MT103 → pacs.008 CONVERSION ───
function convertMTtoISO(rawText) {
  var parsed = parseMT(rawText);
  if (!parsed.valid && parsed.errors.length > 0) {
    return { error: true, message: 'MT parse errors:\n' + parsed.errors.map(function(e) { return '• ' + e.message; }).join('\n') };
  }

  var ext = parsed.extracted;
  var fields = parsed.fields;
  var mapping = MAPPING_MT103_PACS008;
  var warnings = [];
  var fieldMap = [];

  // Helper: get field value
  function getField(tag) {
    if (fields[tag]) return fields[tag];
    return null;
  }

  function getRawValue(tag) {
    var f = getField(tag);
    return f ? f.rawValue : '';
  }

  // Build values
  var endToEndId = (ext.transactionReference || 'NOTPROVIDED').substring(0, 35);
  var instrId = 'INSTR-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  var msgId = 'BRIDGE-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  var creDtTm = new Date().toISOString().substring(0, 19);
  var sttlmMtd = fields['53A'] ? 'COVE' : 'CLRG';

  // Amount and currency from :32A:
  var amount = ext.amount ? ext.amount.toFixed(2) : '0.00';
  var currency = ext.currency || 'USD';
  var valueDate = ext.valueDate || new Date().toISOString().substring(0, 10);

  // Instructed amount from :33B:
  var instdAmt = ext.instructedAmount;
  var instdCcy = ext.instructedCurrency;

  // Charge bearer
  var chargeMap = mapping.valueMaps.chargeBearer;
  var mtCharge = ext.chargeBearer || 'SHA';
  var isoCharge = chargeMap[mtCharge] || 'SHAR';

  // Party: Ordering Customer → Debtor
  var debtor = ext.orderingCustomer;
  var debtorName = '', debtorAccount = '', debtorAddr = [];
  if (debtor) {
    if (typeof debtor === 'string') {
      debtorName = debtor;
    } else {
      debtorName = debtor.name || '';
      debtorAccount = debtor.account || '';
      debtorAddr = debtor.address || [];
    }
  }

  // Ordering Institution → Debtor Agent
  var debtorAgent = '';
  if (fields['52A']) {
    debtorAgent = (fields['52A'].decoded && typeof fields['52A'].decoded === 'string') ? fields['52A'].decoded : fields['52A'].rawValue.trim();
  }

  // Account With Institution → Creditor Agent
  var creditorAgent = '';
  if (fields['57A']) {
    creditorAgent = (fields['57A'].decoded && typeof fields['57A'].decoded === 'string') ? fields['57A'].decoded : fields['57A'].rawValue.trim();
  }

  // Intermediary
  var intermediary = '';
  if (fields['56A']) {
    intermediary = (fields['56A'].decoded && typeof fields['56A'].decoded === 'string') ? fields['56A'].decoded : fields['56A'].rawValue.trim();
  }

  // Beneficiary → Creditor
  var creditor = ext.beneficiary;
  var creditorName = '', creditorAccount = '', creditorAddr = [];
  if (creditor) {
    if (typeof creditor === 'string') {
      creditorName = creditor;
    } else {
      creditorName = creditor.name || '';
      creditorAccount = creditor.account || '';
      creditorAddr = creditor.address || [];
    }
  }

  // Remittance
  var remittance = ext.remittanceInformation || '';
  if (typeof remittance !== 'string') remittance = '';
  remittance = remittance.replace(/\n/g, ' ');

  // Sender to Receiver Info
  var instrForAgent = ext.senderToReceiverInfo || '';
  if (typeof instrForAgent !== 'string') instrForAgent = '';
  instrForAgent = instrForAgent.replace(/\n/g, ' ');

  // Regulatory reporting
  var regRptg = ext.regulatoryReporting || '';
  if (typeof regRptg !== 'string') regRptg = '';
  regRptg = regRptg.replace(/\n/g, ' ');

  // Build XML
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Document xmlns="' + mapping.isoNamespace + '">\n';
  xml += '  <' + mapping.rootElement + '>\n';

  // GrpHdr
  xml += '    <GrpHdr>\n';
  xml += '      <MsgId>' + escXml(msgId) + '</MsgId>\n';
  xml += '      <CreDtTm>' + creDtTm + '</CreDtTm>\n';
  xml += '      <NbOfTxs>1</NbOfTxs>\n';
  xml += '      <SttlmInf><SttlmMtd>' + sttlmMtd + '</SttlmMtd></SttlmInf>\n';
  xml += '    </GrpHdr>\n';

  // CdtTrfTxInf
  xml += '    <CdtTrfTxInf>\n';

  // PmtId
  xml += '      <PmtId>\n';
  xml += '        <InstrId>' + escXml(instrId) + '</InstrId>\n';
  xml += '        <EndToEndId>' + escXml(endToEndId) + '</EndToEndId>\n';
  xml += '      </PmtId>\n';

  // Amounts
  xml += '      <IntrBkSttlmAmt Ccy="' + escXml(currency) + '">' + amount + '</IntrBkSttlmAmt>\n';
  xml += '      <IntrBkSttlmDt>' + valueDate + '</IntrBkSttlmDt>\n';

  if (instdAmt) {
    xml += '      <InstdAmt Ccy="' + escXml(instdCcy || currency) + '">' + instdAmt.toFixed(2) + '</InstdAmt>\n';
  }

  // Charge bearer
  xml += '      <ChrgBr>' + isoCharge + '</ChrgBr>\n';

  // Intermediary Agent
  if (intermediary) {
    xml += '      <IntrmyAgt1>\n';
    xml += '        <FinInstnId><BICFI>' + escXml(intermediary) + '</BICFI></FinInstnId>\n';
    xml += '      </IntrmyAgt1>\n';
  }

  // Debtor
  xml += '      <Dbtr>\n';
  xml += '        <Nm>' + escXml(debtorName) + '</Nm>\n';
  if (debtorAddr.length > 0) {
    xml += '        <PstlAdr>\n';
    for (var i = 0; i < debtorAddr.length; i++) {
      xml += '          <AdrLine>' + escXml(debtorAddr[i]) + '</AdrLine>\n';
    }
    xml += '        </PstlAdr>\n';
  }
  xml += '      </Dbtr>\n';

  // Debtor Account
  if (debtorAccount) {
    xml += '      <DbtrAcct><Id>';
    if (debtorAccount.match(/^[A-Z]{2}\d{2}/)) {
      xml += '<IBAN>' + escXml(debtorAccount) + '</IBAN>';
    } else {
      xml += '<Othr><Id>' + escXml(debtorAccount) + '</Id></Othr>';
    }
    xml += '</Id></DbtrAcct>\n';
  }

  // Debtor Agent
  if (debtorAgent) {
    xml += '      <DbtrAgt>\n';
    xml += '        <FinInstnId><BICFI>' + escXml(debtorAgent) + '</BICFI></FinInstnId>\n';
    xml += '      </DbtrAgt>\n';
  }

  // Creditor Agent
  if (creditorAgent) {
    xml += '      <CdtrAgt>\n';
    xml += '        <FinInstnId><BICFI>' + escXml(creditorAgent) + '</BICFI></FinInstnId>\n';
    xml += '      </CdtrAgt>\n';
  }

  // Creditor
  xml += '      <Cdtr>\n';
  xml += '        <Nm>' + escXml(creditorName) + '</Nm>\n';
  if (creditorAddr.length > 0) {
    xml += '        <PstlAdr>\n';
    for (var i = 0; i < creditorAddr.length; i++) {
      xml += '          <AdrLine>' + escXml(creditorAddr[i]) + '</AdrLine>\n';
    }
    xml += '        </PstlAdr>\n';
  }
  xml += '      </Cdtr>\n';

  // Creditor Account
  if (creditorAccount) {
    xml += '      <CdtrAcct><Id>';
    if (creditorAccount.match(/^[A-Z]{2}\d{2}/)) {
      xml += '<IBAN>' + escXml(creditorAccount) + '</IBAN>';
    } else {
      xml += '<Othr><Id>' + escXml(creditorAccount) + '</Id></Othr>';
    }
    xml += '</Id></CdtrAcct>\n';
  }

  // Instruction for Creditor Agent
  if (instrForAgent) {
    xml += '      <InstrForCdtrAgt>\n';
    xml += '        <InstrInf>' + escXml(instrForAgent) + '</InstrInf>\n';
    xml += '      </InstrForCdtrAgt>\n';
  }

  // Regulatory Reporting
  if (regRptg) {
    xml += '      <RgltryRptg>\n';
    xml += '        <Dtls><Inf>' + escXml(regRptg) + '</Inf></Dtls>\n';
    xml += '      </RgltryRptg>\n';
  }

  // Remittance
  if (remittance) {
    xml += '      <RmtInf>\n';
    xml += '        <Ustrd>' + escXml(remittance) + '</Ustrd>\n';
    xml += '      </RmtInf>\n';
  }

  xml += '    </CdtTrfTxInf>\n';
  xml += '  </' + mapping.rootElement + '>\n';
  xml += '</Document>';

  // Build field map for diagram
  var mapFields = mapping.fields;
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcField = getField(mf.mtTag);
    var srcVal = srcField ? srcField.rawValue : '';
    var tgtVal = '';

    // Determine target value from the generated XML
    if (mf.mtTag === '20') tgtVal = endToEndId;
    else if (mf.mtTag === '32A') tgtVal = amount + ' ' + currency + ' (' + valueDate + ')';
    else if (mf.mtTag === '33B') tgtVal = instdAmt ? instdAmt.toFixed(2) + ' ' + (instdCcy || currency) : '';
    else if (mf.mtTag === '50K' || mf.mtTag === '50A') tgtVal = debtorName + (debtorAccount ? ' [' + debtorAccount + ']' : '');
    else if (mf.mtTag === '52A') tgtVal = debtorAgent;
    else if (mf.mtTag === '57A') tgtVal = creditorAgent;
    else if (mf.mtTag === '56A') tgtVal = intermediary;
    else if (mf.mtTag === '59') tgtVal = creditorName + (creditorAccount ? ' [' + creditorAccount + ']' : '');
    else if (mf.mtTag === '70') tgtVal = remittance;
    else if (mf.mtTag === '71A') tgtVal = isoCharge + ' (from ' + mtCharge + ')';
    else if (mf.mtTag === '72') tgtVal = instrForAgent;
    else if (mf.mtTag === '77B') tgtVal = regRptg;

    if (srcVal || mf.status !== 'gap') {
      fieldMap.push({
        sourceTag: ':' + mf.mtTag + ':',
        sourceName: mf.mtName,
        sourceValue: srcVal,
        targetPath: mf.isoPath || '(dropped)',
        targetName: mf.isoName || '(no equivalent)',
        targetValue: tgtVal,
        status: srcField ? mf.status : 'gap',
        notes: mf.notes
      });
    }
  }

  // Auto-generated fields
  var autoGen = mapping.autoGenerated;
  for (var i = 0; i < autoGen.length; i++) {
    fieldMap.push({
      sourceTag: '—',
      sourceName: '(auto-generated)',
      sourceValue: '',
      targetPath: autoGen[i].isoPath,
      targetName: autoGen[i].description,
      targetValue: autoGen[i].isoPath === 'GrpHdr/MsgId' ? msgId :
                   autoGen[i].isoPath === 'GrpHdr/CreDtTm' ? creDtTm :
                   autoGen[i].isoPath === 'GrpHdr/NbOfTxs' ? '1' :
                   autoGen[i].isoPath.indexOf('SttlmMtd') !== -1 ? sttlmMtd :
                   instrId,
      status: 'auto',
      notes: autoGen[i].description
    });
  }

  // Collect warnings from translation path
  var path = getTranslationPath('MT103', 'pacs.008');
  if (path) {
    warnings = path.warnings.slice();
  }

  // Add charge bearer specific warning
  if (mtCharge !== 'SHA' && mtCharge !== 'OUR' && mtCharge !== 'BEN') {
    warnings.push('Unrecognized charge bearer "' + mtCharge + '" — defaulted to SHAR');
  }

  // Build JSON representation
  var jsonObj = {
    messageType: 'pacs.008.001.08',
    groupHeader: {
      messageId: msgId,
      creationDateTime: creDtTm,
      numberOfTransactions: 1,
      settlementMethod: sttlmMtd
    },
    creditTransferTransaction: {
      paymentId: { instructionId: instrId, endToEndId: endToEndId },
      interbankSettlementAmount: { currency: currency, amount: parseFloat(amount) },
      interbankSettlementDate: valueDate,
      chargeBearer: isoCharge,
      debtor: { name: debtorName, account: debtorAccount, address: debtorAddr },
      debtorAgent: debtorAgent,
      creditorAgent: creditorAgent,
      creditor: { name: creditorName, account: creditorAccount, address: creditorAddr },
      remittanceInformation: remittance
    },
    _translation: {
      source: 'MT103',
      target: 'pacs.008',
      lossless: false,
      warnings: warnings,
      dataGaps: mapping.dataGaps.map(function(g) { return g.isoPath + ': ' + g.description; })
    }
  };

  if (instdAmt) {
    jsonObj.creditTransferTransaction.instructedAmount = { currency: instdCcy || currency, amount: instdAmt };
  }
  if (intermediary) jsonObj.creditTransferTransaction.intermediaryAgent = intermediary;
  if (instrForAgent) jsonObj.creditTransferTransaction.instructionForCreditorAgent = instrForAgent;

  return {
    error: false,
    xml: xml,
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: mapping.dataGaps,
    dataLoss: []
  };
}

// ─── pacs.008 → MT103 CONVERSION ───
function convertISOtoMT(xmlText) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parse errors
  var parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { error: true, message: 'XML parse error: ' + parseError.textContent.substring(0, 200) };
  }

  var root = doc.documentElement;
  // Navigate to FIToFICstmrCdtTrf (handle namespace)
  var ftf = getXmlEl(root, 'FIToFICstmrCdtTrf');
  if (!ftf) {
    return { error: true, message: 'Not a pacs.008 message — missing FIToFICstmrCdtTrf element' };
  }

  var grpHdr = getXmlEl(ftf, 'GrpHdr');
  var txInf = getXmlEl(ftf, 'CdtTrfTxInf');
  if (!txInf) {
    return { error: true, message: 'Missing CdtTrfTxInf element' };
  }

  var mapping = MAPPING_PACS008_MT103;
  var warnings = [];
  var fieldMap = [];
  var dataLoss = [];

  // Extract values from XML
  var endToEndId = getXmlPathText(txInf, 'PmtId/EndToEndId');
  var instrId = getXmlPathText(txInf, 'PmtId/InstrId');
  var amountEl = getXmlEl(txInf, 'IntrBkSttlmAmt');
  var amount = amountEl ? amountEl.textContent : '0';
  var currency = amountEl ? (amountEl.getAttribute('Ccy') || 'USD') : 'USD';
  var settleDate = getXmlText(txInf, 'IntrBkSttlmDt') || new Date().toISOString().substring(0, 10);
  var chrgBr = getXmlText(txInf, 'ChrgBr') || 'SHAR';

  // Instructed amount
  var instdAmtEl = getXmlEl(txInf, 'InstdAmt');
  var instdAmt = instdAmtEl ? instdAmtEl.textContent : '';
  var instdCcy = instdAmtEl ? (instdAmtEl.getAttribute('Ccy') || currency) : '';

  // Debtor
  var dbtr = getXmlEl(txInf, 'Dbtr');
  var debtorName = dbtr ? getXmlText(dbtr, 'Nm') : '';
  var dbtrAcct = getXmlPathText(txInf, 'DbtrAcct/Id/IBAN') || getXmlPathText(txInf, 'DbtrAcct/Id/Othr/Id');
  var dbtrAddr = [];
  if (dbtr) {
    var pstlAdr = getXmlEl(dbtr, 'PstlAdr');
    if (pstlAdr) {
      var strtNm = getXmlText(pstlAdr, 'StrtNm');
      var twnNm = getXmlText(pstlAdr, 'TwnNm');
      var pstCd = getXmlText(pstlAdr, 'PstCd');
      var ctry = getXmlText(pstlAdr, 'Ctry');
      // Also check AdrLine
      var children = pstlAdr.childNodes;
      for (var i = 0; i < children.length; i++) {
        if (children[i].nodeType === 1 && (children[i].localName === 'AdrLine' || children[i].nodeName === 'AdrLine')) {
          dbtrAddr.push(children[i].textContent);
        }
      }
      if (dbtrAddr.length === 0) {
        if (strtNm) dbtrAddr.push(strtNm);
        var cityLine = '';
        if (twnNm) cityLine += twnNm;
        if (pstCd) cityLine += ' ' + pstCd;
        if (ctry) cityLine += ' ' + ctry;
        if (cityLine) dbtrAddr.push(cityLine.trim());
      }
    }
  }

  // Debtor Agent
  var debtorAgentBIC = getXmlPathText(txInf, 'DbtrAgt/FinInstnId/BICFI');

  // Creditor Agent
  var creditorAgentBIC = getXmlPathText(txInf, 'CdtrAgt/FinInstnId/BICFI');

  // Creditor
  var cdtr = getXmlEl(txInf, 'Cdtr');
  var creditorName = cdtr ? getXmlText(cdtr, 'Nm') : '';
  var cdtrAcct = getXmlPathText(txInf, 'CdtrAcct/Id/IBAN') || getXmlPathText(txInf, 'CdtrAcct/Id/Othr/Id');
  var cdtrAddr = [];
  if (cdtr) {
    var pstlAdr2 = getXmlEl(cdtr, 'PstlAdr');
    if (pstlAdr2) {
      var children2 = pstlAdr2.childNodes;
      for (var i = 0; i < children2.length; i++) {
        if (children2[i].nodeType === 1 && (children2[i].localName === 'AdrLine' || children2[i].nodeName === 'AdrLine')) {
          cdtrAddr.push(children2[i].textContent);
        }
      }
      if (cdtrAddr.length === 0) {
        var strtNm2 = getXmlText(pstlAdr2, 'StrtNm');
        var twnNm2 = getXmlText(pstlAdr2, 'TwnNm');
        var pstCd2 = getXmlText(pstlAdr2, 'PstCd');
        var ctry2 = getXmlText(pstlAdr2, 'Ctry');
        if (strtNm2) cdtrAddr.push(strtNm2);
        var cityLine2 = '';
        if (twnNm2) cityLine2 += twnNm2;
        if (pstCd2) cityLine2 += ' ' + pstCd2;
        if (ctry2) cityLine2 += ' ' + ctry2;
        if (cityLine2) cdtrAddr.push(cityLine2.trim());
      }
    }
  }

  // Intermediary
  var intrmyBIC = getXmlPathText(txInf, 'IntrmyAgt1/FinInstnId/BICFI');

  // Remittance
  var remittance = getXmlPathText(txInf, 'RmtInf/Ustrd');

  // Instruction for creditor agent
  var instrInfo = getXmlPathText(txInf, 'InstrForCdtrAgt/InstrInf');

  // Charge bearer reverse mapping
  var revChargeMap = mapping.valueMaps.chargeBearerReverse;
  var mtCharge = revChargeMap[chrgBr] || 'SHA';
  if (chrgBr === 'SLEV') {
    warnings.push('SLEV (Service Level) has no exact MT equivalent — defaulted to SHA');
  }

  // Build MT fields
  // Tag :20: Transaction Reference (truncate to 16)
  var tag20 = endToEndId.substring(0, 16);
  if (endToEndId.length > 16) {
    warnings.push('EndToEndId truncated from ' + endToEndId.length + ' to 16 characters for :20:');
  }

  // Tag :23B:
  var tag23B = 'CRED';

  // Tag :32A: value date + currency + amount
  var dateParts = settleDate.split('-');
  var tag32ADate = dateParts[0].substring(2) + dateParts[1] + dateParts[2];
  var tag32AAmount = parseFloat(amount).toFixed(2).replace('.', ',');
  var tag32A = tag32ADate + currency + tag32AAmount;

  // Tag :33B: instructed amount
  var tag33B = '';
  if (instdAmt) {
    tag33B = instdCcy + parseFloat(instdAmt).toFixed(2).replace('.', ',');
  }

  // Tag :50K: ordering customer
  var tag50K = '';
  if (dbtrAcct) tag50K += '/' + dbtrAcct + '\n';
  if (debtorName) tag50K += debtorName + '\n';
  for (var i = 0; i < dbtrAddr.length && i < 3; i++) {
    tag50K += dbtrAddr[i].substring(0, 35) + '\n';
  }
  tag50K = tag50K.replace(/\n$/, '');

  // Tag :52A: ordering institution
  var tag52A = debtorAgentBIC;

  // Tag :56A: intermediary
  var tag56A = intrmyBIC;

  // Tag :57A: account with institution
  var tag57A = creditorAgentBIC;

  // Tag :59: beneficiary
  var tag59 = '';
  if (cdtrAcct) tag59 += '/' + cdtrAcct + '\n';
  if (creditorName) tag59 += creditorName + '\n';
  for (var i = 0; i < cdtrAddr.length && i < 3; i++) {
    tag59 += cdtrAddr[i].substring(0, 35) + '\n';
  }
  tag59 = tag59.replace(/\n$/, '');

  // Tag :70: remittance (split to 4x35)
  var tag70 = '';
  if (remittance) {
    var rem = remittance.substring(0, 140);
    if (remittance.length > 140) {
      warnings.push('Remittance truncated from ' + remittance.length + ' to 140 characters');
    }
    for (var i = 0; i < rem.length; i += 35) {
      if (tag70) tag70 += '\n';
      tag70 += rem.substring(i, i + 35);
    }
  }

  // Tag :71A: charges
  var tag71A = mtCharge;

  // Tag :72: sender to receiver info (split to 6x35)
  var tag72 = '';
  if (instrInfo) {
    var inf = instrInfo.substring(0, 210);
    for (var i = 0; i < inf.length; i += 35) {
      if (tag72) tag72 += '\n';
      tag72 += inf.substring(i, i + 35);
    }
  }

  // Build MT message
  var senderBIC = debtorAgentBIC ? debtorAgentBIC.substring(0, 8).padEnd(12, 'X') : 'BANKUS33XXXX';
  var receiverBIC = creditorAgentBIC ? creditorAgentBIC.substring(0, 8).padEnd(12, 'X') : 'BANKDE33XXXX';

  var mt = '{1:F01' + senderBIC + '0000000000}\n';
  mt += '{2:I103' + receiverBIC + 'N}\n';
  mt += '{4:\n';
  mt += ':20:' + tag20 + '\n';
  mt += ':23B:' + tag23B + '\n';
  mt += ':32A:' + tag32A + '\n';

  if (tag33B) mt += ':33B:' + tag33B + '\n';
  if (tag50K) mt += ':50K:' + tag50K + '\n';
  if (tag52A) mt += ':52A:' + tag52A + '\n';
  if (tag56A) mt += ':56A:' + tag56A + '\n';
  if (tag57A) mt += ':57A:' + tag57A + '\n';
  if (tag59) mt += ':59:' + tag59 + '\n';
  if (tag70) mt += ':70:' + tag70 + '\n';
  mt += ':71A:' + tag71A + '\n';
  if (tag72) mt += ':72:' + tag72 + '\n';
  mt += '-}';

  // Build field map for diagram
  var mapFields = mapping.fields;
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcVal = '';
    var tgtVal = '';

    // Get source value from XML
    if (mf.isoPath === 'CdtTrfTxInf/PmtId/EndToEndId') { srcVal = endToEndId; tgtVal = tag20; }
    else if (mf.isoPath === 'CdtTrfTxInf/IntrBkSttlmAmt') { srcVal = amount + ' ' + currency; tgtVal = tag32A; }
    else if (mf.isoPath === 'CdtTrfTxInf/InstdAmt') { srcVal = instdAmt ? instdAmt + ' ' + instdCcy : ''; tgtVal = tag33B; }
    else if (mf.isoPath === 'CdtTrfTxInf/Dbtr') { srcVal = debtorName; tgtVal = tag50K.split('\n')[0] || ''; }
    else if (mf.isoPath === 'CdtTrfTxInf/DbtrAgt/FinInstnId/BICFI') { srcVal = debtorAgentBIC; tgtVal = tag52A; }
    else if (mf.isoPath === 'CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI') { srcVal = creditorAgentBIC; tgtVal = tag57A; }
    else if (mf.isoPath === 'CdtTrfTxInf/Cdtr') { srcVal = creditorName; tgtVal = tag59.split('\n')[0] || ''; }
    else if (mf.isoPath === 'CdtTrfTxInf/RmtInf/Ustrd') { srcVal = remittance; tgtVal = tag70; }
    else if (mf.isoPath === 'CdtTrfTxInf/ChrgBr') { srcVal = chrgBr; tgtVal = tag71A + ' (from ' + chrgBr + ')'; }
    else if (mf.isoPath === 'CdtTrfTxInf/IntrmyAgt1/FinInstnId/BICFI') { srcVal = intrmyBIC; tgtVal = tag56A; }
    else if (mf.isoPath === 'CdtTrfTxInf/InstrForCdtrAgt/InstrInf') { srcVal = instrInfo; tgtVal = tag72; }

    if (srcVal || tgtVal) {
      fieldMap.push({
        sourceTag: mf.isoPath,
        sourceName: mf.isoName,
        sourceValue: srcVal,
        targetPath: ':' + mf.mtTag + ':',
        targetName: mf.mtName,
        targetValue: tgtVal,
        status: mf.status,
        notes: mf.notes
      });
    }
  }

  // Auto-generated fields
  var autoGen = mapping.autoGenerated;
  for (var i = 0; i < autoGen.length; i++) {
    fieldMap.push({
      sourceTag: '—',
      sourceName: '(auto-generated)',
      sourceValue: '',
      targetPath: autoGen[i].mtField,
      targetName: autoGen[i].description,
      targetValue: autoGen[i].mtField.indexOf('Block 1') !== -1 ? senderBIC :
                   autoGen[i].mtField.indexOf('Block 2') !== -1 ? receiverBIC :
                   tag23B,
      status: 'auto',
      notes: autoGen[i].description
    });
  }

  // Data loss items
  var lossItems = mapping.dataLoss;
  for (var i = 0; i < lossItems.length; i++) {
    var lostVal = getXmlPathText(txInf, lossItems[i].isoPath);
    if (!lostVal && lossItems[i].isoPath === 'CdtTrfTxInf/PmtId/InstrId') lostVal = instrId;
    if (lostVal) {
      dataLoss.push({
        path: lossItems[i].isoPath,
        description: lossItems[i].description,
        lostValue: lostVal
      });
      warnings.push(lossItems[i].description + (lostVal ? ' (value: ' + lostVal.substring(0, 40) + ')' : ''));
    }
  }

  // Path warnings
  var path = getTranslationPath('pacs.008', 'MT103');
  if (path) {
    for (var i = 0; i < path.warnings.length; i++) {
      if (warnings.indexOf(path.warnings[i]) === -1) {
        warnings.push(path.warnings[i]);
      }
    }
  }

  // Build JSON
  var jsonObj = {
    messageType: 'MT103',
    transactionReference: tag20,
    bankOperationCode: tag23B,
    valueDateCurrencyAmount: {
      date: settleDate,
      currency: currency,
      amount: parseFloat(amount)
    },
    chargeBearer: tag71A,
    orderingCustomer: {
      account: dbtrAcct,
      name: debtorName,
      address: dbtrAddr
    },
    beneficiary: {
      account: cdtrAcct,
      name: creditorName,
      address: cdtrAddr
    },
    remittanceInformation: remittance,
    _translation: {
      source: 'pacs.008',
      target: 'MT103',
      lossless: false,
      warnings: warnings,
      dataLoss: dataLoss.map(function(d) { return d.path + ': ' + d.description; })
    }
  };

  if (debtorAgentBIC) jsonObj.orderingInstitution = debtorAgentBIC;
  if (creditorAgentBIC) jsonObj.accountWithInstitution = creditorAgentBIC;

  return {
    error: false,
    mt: mt,
    xml: mt,   // For display consistency
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: [],
    dataLoss: dataLoss
  };
}

// ─── MAIN TRANSLATION ORCHESTRATOR ───
function translate() {
  var fromVal = document.getElementById('from-select').value;
  var toVal = document.getElementById('to-select').value;
  var rawText = document.getElementById('source-input').value.trim();

  if (!fromVal || !toVal) {
    showToast('Select source and target formats first', true);
    return;
  }
  if (!rawText) {
    showToast('Paste a message or load a sample first', true);
    return;
  }

  var result;
  if (fromVal === 'MT103' && toVal === 'pacs.008') {
    result = convertMTtoISO(rawText);
  } else if (fromVal === 'pacs.008' && toVal === 'MT103') {
    result = convertISOtoMT(rawText);
  } else {
    showToast('Translation path ' + fromVal + ' → ' + toVal + ' not yet supported', true);
    return;
  }

  if (result.error) {
    renderError(result.message);
    return;
  }

  currentOutput = result;
  currentView = (fromVal === 'MT103') ? 'xml' : 'xml'; // default to XML view
  renderOutput(result);
  renderMappingDiagram(result);

  // Show toggle and actions
  document.getElementById('output-toggle').style.display = '';
  document.getElementById('actions-dropdown-wrap').classList.add('visible');

  // Update toggle button states
  var toggleBtns = document.querySelectorAll('.toggle-btn');
  for (var i = 0; i < toggleBtns.length; i++) {
    toggleBtns[i].classList.toggle('active', toggleBtns[i].getAttribute('data-view') === currentView);
  }
}

// ─── RENDER OUTPUT ───
function renderOutput(result) {
  var container = document.getElementById('results-content');
  var html = '';

  // Summary banner
  var warnCount = result.warnings.length;
  var lossCount = result.dataLoss ? result.dataLoss.length : 0;

  if (warnCount === 0 && lossCount === 0) {
    html += '<div class="validation-summary summary-valid"><img src="assets/validate.svg" alt="" style="width:20px;height:20px;opacity:0.7"> Translation complete — no warnings</div>';
  } else {
    html += '<div class="validation-summary summary-info"><img src="assets/info.svg" alt="" style="width:20px;height:20px;opacity:0.7"> Translation complete — ' + warnCount + ' warning' + (warnCount !== 1 ? 's' : '');
    if (lossCount > 0) html += ', ' + lossCount + ' data loss item' + (lossCount !== 1 ? 's' : '');
    html += '</div>';
  }

  html += '<div class="results-body-inner">';

  // Output code block
  if (currentView === 'xml') {
    var outputText = result.xml || result.mt || '';
    var lang = (result.mt && !result.xml.startsWith('<?xml')) ? 'plaintext' : 'xml';
    var highlighted = outputText;
    if (hljsAvailable) {
      try { highlighted = hljs.highlight(outputText, { language: lang }).value; } catch(e) { highlighted = escHtml(outputText); }
    } else {
      highlighted = escHtml(outputText);
    }
    html += '<div class="json-preview"><button class="json-copy-btn" onclick="copyOutput()"><img src="assets/copy.svg" alt=""> Copy</button><pre><code>' + highlighted + '</code></pre></div>';
  } else {
    // JSON view
    var jsonStr = JSON.stringify(result.json, null, 2);
    var highlighted = jsonStr;
    if (hljsAvailable) {
      try { highlighted = hljs.highlight(jsonStr, { language: 'json' }).value; } catch(e) { highlighted = escHtml(jsonStr); }
    } else {
      highlighted = escHtml(jsonStr);
    }
    html += '<div class="json-preview"><button class="json-copy-btn" onclick="copyJson()"><img src="assets/copy.svg" alt=""> Copy</button><pre><code>' + highlighted + '</code></pre></div>';
  }

  // Conversion notes
  if (warnCount > 0) {
    html += '<div class="conversion-notes">';
    html += '<div class="section-header">Conversion Warnings <span class="section-count">' + warnCount + '</span></div>';
    for (var i = 0; i < result.warnings.length; i++) {
      html += '<div class="note-item"><img src="assets/warning.svg" alt="" class="note-icon-img"><span class="note-text">' + escHtml(result.warnings[i]) + '</span></div>';
    }
    html += '</div>';
  }

  // Data gaps
  if (result.dataGaps && result.dataGaps.length > 0) {
    html += '<div class="conversion-notes">';
    html += '<div class="section-header">Data Gaps <span class="section-count">' + result.dataGaps.length + '</span></div>';
    for (var i = 0; i < result.dataGaps.length; i++) {
      var g = result.dataGaps[i];
      html += '<div class="note-item"><img src="assets/error.svg" alt="" class="note-icon-img note-icon-error"><span class="note-text"><code>' + escHtml(g.isoPath) + '</code> — ' + escHtml(g.description) + '</span></div>';
    }
    html += '</div>';
  }

  // Data loss
  if (result.dataLoss && result.dataLoss.length > 0) {
    html += '<div class="conversion-notes">';
    html += '<div class="section-header">Data Loss <span class="section-count">' + result.dataLoss.length + '</span></div>';
    for (var i = 0; i < result.dataLoss.length; i++) {
      var d = result.dataLoss[i];
      html += '<div class="note-item"><img src="assets/error.svg" alt="" class="note-icon-img note-icon-error"><span class="note-text"><code>' + escHtml(d.path) + '</code> — ' + escHtml(d.description) + '</span></div>';
    }
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderError(message) {
  var container = document.getElementById('results-content');
  container.innerHTML = '<div class="validation-summary summary-invalid"><img src="assets/info.svg" alt="" style="width:20px;height:20px;opacity:0.7"> Translation failed</div>' +
    '<div class="results-body-inner"><div class="error-item type-error"><span class="ei-icon">&#10005;</span><span>' + escHtml(message) + '</span></div></div>';

  document.getElementById('mapping-section').style.display = 'none';
}

// ─── FIELD MAPPING DIAGRAM ───
function renderMappingDiagram(result) {
  var section = document.getElementById('mapping-section');
  var tbody = document.getElementById('mapping-tbody');
  var subtitle = document.getElementById('mapping-subtitle');
  var extras = document.getElementById('mapping-extras');

  var fromVal = document.getElementById('from-select').value;
  var toVal = document.getElementById('to-select').value;
  subtitle.textContent = fromVal + ' → ' + toVal + ' · ' + result.fieldMap.length + ' fields';

  var html = '';
  for (var i = 0; i < result.fieldMap.length; i++) {
    var fm = result.fieldMap[i];
    var statusClass = 'status-' + fm.status;
    var statusLabel = fm.status === 'clean' ? 'Clean' :
                      fm.status === 'transformed' ? 'Transformed' :
                      fm.status === 'gap' ? 'Gap' :
                      fm.status === 'auto' ? 'Auto' : fm.status;

    html += '<tr>';
    html += '<td><code>' + escHtml(fm.sourceTag) + '</code><div class="mapping-note">' + escHtml(fm.sourceName) + '</div></td>';
    html += '<td>' + escHtml(truncate(fm.sourceValue, 50)) + '</td>';
    html += '<td style="text-align:center;color:var(--text-muted)">&rarr;</td>';
    html += '<td><code>' + escHtml(fm.targetPath) + '</code><div class="mapping-note">' + escHtml(fm.targetName) + '</div></td>';
    html += '<td>' + escHtml(truncate(fm.targetValue, 50)) + '</td>';
    html += '<td><span class="mapping-status ' + statusClass + '">' + statusLabel + '</span></td>';
    html += '</tr>';
  }

  tbody.innerHTML = html;
  section.style.display = '';

  // Legend
  extras.innerHTML = '<div class="mapping-legend">' +
    '<div class="mapping-legend-heading">Legend</div>' +
    '<div class="mapping-legend-list">' +
      '<div class="mapping-legend-item"><span class="mapping-status status-clean">Clean</span><span class="legend-desc">Direct 1:1 mapping</span></div>' +
      '<div class="mapping-legend-item"><span class="mapping-status status-transformed">Transformed</span><span class="legend-desc">Value changed during conversion</span></div>' +
      '<div class="mapping-legend-item"><span class="mapping-status status-gap">Gap</span><span class="legend-desc">No equivalent in target format</span></div>' +
      '<div class="mapping-legend-item"><span class="mapping-status status-auto">Auto</span><span class="legend-desc">Auto-generated (no source field)</span></div>' +
    '</div>' +
    '</div>';
}

// ─── UI WIRING ───
function initUI() {
  populateCountries();

  // Rebuild format grids on dropdown open to reflect current selection
  UIkit.util.on('#from-dropdown', 'beforeshow', function() {
    var code = document.getElementById('country-select').value;
    if (!code) return;
    var formats = getFormatsForCountry(code);
    var availableFrom = [];
    for (var i = 0; i < formats.length; i++) {
      if (getValidTargets(formats[i]).length > 0) availableFrom.push(formats[i]);
    }
    var currentFrom = document.getElementById('from-select').value;
    buildFormatGrid('from-grid', availableFrom, function(fmt) {
      document.getElementById('from-select').value = fmt;
      document.getElementById('from-btn-text').textContent = formatLabel(fmt);
      document.getElementById('from-btn').classList.add('has-value');
      UIkit.dropdown(document.getElementById('from-dropdown')).hide(false);
      onFromChange();
    }, 'from', currentFrom);
  });

  UIkit.util.on('#to-dropdown', 'beforeshow', function() {
    var fromVal = document.getElementById('from-select').value;
    var countryCode = document.getElementById('country-select').value;
    if (!fromVal || !countryCode) return;
    var countryFormats = getFormatsForCountry(countryCode);
    var targets = getValidTargets(fromVal);
    var available = [];
    for (var i = 0; i < targets.length; i++) {
      if (countryFormats.indexOf(targets[i]) !== -1) available.push(targets[i]);
    }
    var currentTo = document.getElementById('to-select').value;
    buildFormatGrid('to-grid', available, function(fmt) {
      document.getElementById('to-select').value = fmt;
      document.getElementById('to-btn-text').textContent = formatLabel(fmt);
      document.getElementById('to-btn').classList.add('has-value');
      UIkit.dropdown(document.getElementById('to-dropdown')).hide(false);
      onToChange();
    }, 'to', currentTo);
  });

  // from-select and to-select are now hidden inputs, driven by custom dropdowns
  document.getElementById('translate-btn').addEventListener('click', translate);

  // Glossary modal
  document.getElementById('glossary-btn').addEventListener('click', function() {
    UIkit.modal('#glossary-modal').show();
  });

  // Load sample
  document.getElementById('load-sample-btn').addEventListener('click', function() {
    var fromVal = document.getElementById('from-select').value;
    if (!fromVal) {
      showToast('Select a source format first', true);
      return;
    }
    loadSample(fromVal);
  });

  // File upload
  document.getElementById('file-upload').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      document.getElementById('source-input').value = ev.target.result;
      highlightSource();
      showToast('File loaded: ' + file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Output toggle
  var toggleBtns = document.querySelectorAll('.toggle-btn');
  for (var i = 0; i < toggleBtns.length; i++) {
    toggleBtns[i].addEventListener('click', function() {
      currentView = this.getAttribute('data-view');
      for (var j = 0; j < toggleBtns.length; j++) {
        toggleBtns[j].classList.toggle('active', toggleBtns[j].getAttribute('data-view') === currentView);
      }
      if (currentOutput) renderOutput(currentOutput);
    });
  }

  // Actions
  document.getElementById('copy-output-btn').addEventListener('click', function(e) {
    e.preventDefault();
    copyOutput();
  });
  document.getElementById('copy-json-btn').addEventListener('click', function(e) {
    e.preventDefault();
    copyJson();
  });
  document.getElementById('download-btn').addEventListener('click', function(e) {
    e.preventDefault();
    downloadOutput();
  });

  // Source highlighting sync
  var sourceInput = document.getElementById('source-input');
  sourceInput.addEventListener('input', highlightSource);
  sourceInput.addEventListener('scroll', function() {
    document.getElementById('source-highlighted').scrollTop = sourceInput.scrollTop;
    document.getElementById('source-highlighted').scrollLeft = sourceInput.scrollLeft;
  });

  // Keyboard shortcut: Ctrl/Cmd+Enter to translate
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      translate();
    }
  });
}

// ─── SYNTAX HIGHLIGHTING ───
function highlightSource() {
  var input = document.getElementById('source-input');
  var code = document.getElementById('source-code');
  var text = input.value;

  if (!text) {
    code.innerHTML = '';
    return;
  }

  if (hljsAvailable) {
    var lang = text.trim().startsWith('<?xml') || text.trim().startsWith('<') ? 'xml' : 'plaintext';
    try {
      code.innerHTML = hljs.highlight(text, { language: lang }).value;
    } catch(e) {
      code.textContent = text;
    }
  } else {
    code.textContent = text;
  }
}

// ─── SAMPLE LOADER ───
var INLINE_SAMPLES = {
  'MT103': '{1:F01NWBKGB2LAXXX0000000000}\n{2:I103COBADEFFXXXXN}\n{4:\n:20:SHANX-20250101-001\n:23B:CRED\n:32A:250101USD10000,00\n:50K:/GB29NWBK60161331926819\nAcme Corporation\n1 Canada Square\nLondon E14 5AB\n:52A:NWBKGB2L\n:57A:COBADEFF\n:59:/DE89370400440532013000\nGlobal Trade Bank\nNeue Mainzer Str 32\nFrankfurt 60311\n:70:INVOICE REF 2025-INV-0042\n:71A:SHA\n-}',
  'pacs.008': '<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>PACS008-20250115-001</MsgId>\n      <CreDtTm>2025-01-15T09:00:00</CreDtTm>\n      <NbOfTxs>1</NbOfTxs>\n      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <PmtId>\n        <InstrId>INSTR-20250115-001</InstrId>\n        <EndToEndId>E2E-PACS008-001</EndToEndId>\n      </PmtId>\n      <IntrBkSttlmAmt Ccy="USD">10000.00</IntrBkSttlmAmt>\n      <IntrBkSttlmDt>2025-01-15</IntrBkSttlmDt>\n      <ChrgBr>SHAR</ChrgBr>\n      <Dbtr>\n        <Nm>Acme Corporation</Nm>\n        <PstlAdr>\n          <StrtNm>1 Canada Square</StrtNm>\n          <TwnNm>London</TwnNm>\n          <PstCd>E14 5AB</PstCd>\n          <Ctry>GB</Ctry>\n        </PstlAdr>\n      </Dbtr>\n      <DbtrAcct>\n        <Id><IBAN>GB29NWBK60161331926819</IBAN></Id>\n      </DbtrAcct>\n      <DbtrAgt>\n        <FinInstnId><BICFI>NWBKGB2LXXX</BICFI></FinInstnId>\n      </DbtrAgt>\n      <CdtrAgt>\n        <FinInstnId><BICFI>COBADEFFXXX</BICFI></FinInstnId>\n      </CdtrAgt>\n      <Cdtr>\n        <Nm>Global Trade Bank</Nm>\n        <PstlAdr>\n          <StrtNm>Neue Mainzer Str 32</StrtNm>\n          <TwnNm>Frankfurt</TwnNm>\n          <PstCd>60311</PstCd>\n          <Ctry>DE</Ctry>\n        </PstlAdr>\n      </Cdtr>\n      <CdtrAcct>\n        <Id><IBAN>DE89370400440532013000</IBAN></Id>\n      </CdtrAcct>\n      <RmtInf>\n        <Ustrd>INVOICE REF 2025-INV-0042</Ustrd>\n      </RmtInf>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>'
};

function loadSample(format) {
  var text = INLINE_SAMPLES[format];
  if (!text) {
    showToast('No sample available for ' + format, true);
    return;
  }
  document.getElementById('source-input').value = text;
  highlightSource();
  showToast('Sample loaded: ' + format);
}

// ─── CLIPBOARD / DOWNLOAD ───
function copyOutput() {
  if (!currentOutput) return;
  var text = currentOutput.xml || currentOutput.mt || '';
  navigator.clipboard.writeText(text).then(function() {
    showToast('Output copied to clipboard');
  });
}

function copyJson() {
  if (!currentOutput) return;
  var text = JSON.stringify(currentOutput.json, null, 2);
  navigator.clipboard.writeText(text).then(function() {
    showToast('JSON copied to clipboard');
  });
}

function downloadOutput() {
  if (!currentOutput) return;
  var fromVal = document.getElementById('from-select').value;
  var toVal = document.getElementById('to-select').value;
  var text = currentOutput.xml || currentOutput.mt || '';
  var ext = toVal.startsWith('pacs') || toVal.startsWith('pain') || toVal.startsWith('camt') ? '.xml' : '.txt';
  var filename = 'bridge-' + fromVal + '-to-' + toVal + ext;

  var blob = new Blob([text], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File downloaded: ' + filename);
}

// ─── UTILITIES ───
function escXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function truncate(str, max) {
  if (!str) return '';
  str = String(str).replace(/\n/g, ' ');
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function showToast(msg, isError) {
  var existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast-msg';
  if (isError) toast.style.background = 'var(--error)';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2500);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', initUI);
