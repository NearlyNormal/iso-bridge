/* ─── ISO Bridge: Conversion Engine & UI ─── */

var hljsAvailable = (typeof hljs !== 'undefined');

// ─── STATE ───
var currentOutput = null;   // { xml, json, warnings, fieldMap, dataGaps, dataLoss }
var currentView = 'xml';    // 'xml' or 'json'

// ─── TRANSFORM REGISTRY ───
var TRANSFORMS = {
  direct: function(val) { return val; },
  drop: function() { return null; },
  joinLines: function(val) { return (val || '').replace(/\n/g, ' '); },

  decode32A: function(val, field, parsed) {
    var ext = parsed.extracted;
    return {
      amount: ext.amount ? ext.amount.toFixed(2) : '0.00',
      currency: ext.currency || 'USD',
      date: ext.valueDate || new Date().toISOString().substring(0, 10),
      _display: (ext.amount ? ext.amount.toFixed(2) : '0.00') + ' ' + (ext.currency || 'USD') + ' (' + (ext.valueDate || '') + ')'
    };
  },

  decode33B: function(val, field, parsed) {
    var ext = parsed.extracted;
    if (!ext.instructedAmount) return null;
    return {
      amount: ext.instructedAmount.toFixed(2),
      currency: ext.instructedCurrency || ext.currency || 'USD',
      _display: ext.instructedAmount.toFixed(2) + ' ' + (ext.instructedCurrency || ext.currency || 'USD')
    };
  },

  chargeBearer: function(val, field, parsed, mapping) {
    var ext = parsed.extracted;
    var mtCharge = ext.chargeBearer || 'SHA';
    var map = (mapping.valueMaps && mapping.valueMaps.chargeBearer) || {};
    return map[mtCharge] || 'SHAR';
  },

  correspondentToSettlement: function(val) {
    return val ? 'COVE' : 'CLRG';
  },

  partyToDebtor: function(val, field, parsed) {
    var debtor = parsed.extracted.orderingCustomer;
    if (!debtor) return { name: '', account: '', address: [] };
    if (typeof debtor === 'string') return { name: debtor, account: '', address: [] };
    return { name: debtor.name || '', account: debtor.account || '', address: debtor.address || [] };
  },

  partyBICToDebtor: function(val, field, parsed) {
    return TRANSFORMS.partyToDebtor(val, field, parsed);
  },

  partyToCreditor: function(val, field, parsed) {
    var creditor = parsed.extracted.beneficiary;
    if (!creditor) return { name: '', account: '', address: [] };
    if (typeof creditor === 'string') return { name: creditor, account: '', address: [] };
    return { name: creditor.name || '', account: creditor.account || '', address: creditor.address || [] };
  },

  // MT202 BIC extractions
  bicDirect: function(val, field, parsed) {
    var f = parsed.fields[field.mtTag];
    if (!f) return '';
    return (f.decoded && typeof f.decoded === 'string') ? f.decoded : f.rawValue.trim();
  },

  // ISO → MT transforms
  truncate16: function(val) {
    return (val || '').substring(0, 16);
  },

  buildTag32A: function(val, field, txInf) {
    var amountEl = getXmlEl(txInf, 'IntrBkSttlmAmt');
    var amount = amountEl ? amountEl.textContent : '0';
    var currency = amountEl ? (amountEl.getAttribute('Ccy') || 'USD') : 'USD';
    var settleDate = getXmlText(txInf, 'IntrBkSttlmDt') || new Date().toISOString().substring(0, 10);
    var dateParts = settleDate.split('-');
    var dateStr = dateParts[0].substring(2) + dateParts[1] + dateParts[2];
    var amtStr = parseFloat(amount).toFixed(2).replace('.', ',');
    return {
      tag: dateStr + currency + amtStr,
      amount: amount,
      currency: currency,
      settleDate: settleDate,
      _display: dateStr + currency + amtStr
    };
  },

  buildTag33B: function(val, field, txInf) {
    var instdAmtEl = getXmlEl(txInf, 'InstdAmt');
    if (!instdAmtEl) return null;
    var instdAmt = instdAmtEl.textContent;
    var instdCcy = instdAmtEl.getAttribute('Ccy') || 'USD';
    return {
      tag: instdCcy + parseFloat(instdAmt).toFixed(2).replace('.', ','),
      _display: instdCcy + parseFloat(instdAmt).toFixed(2).replace('.', ',')
    };
  },

  debtorToParty: function(val, field, txInf) {
    var dbtr = getXmlEl(txInf, 'Dbtr');
    var debtorName = dbtr ? getXmlText(dbtr, 'Nm') : '';
    var dbtrAcct = getXmlPathText(txInf, 'DbtrAcct/Id/IBAN') || getXmlPathText(txInf, 'DbtrAcct/Id/Othr/Id');
    var dbtrAddr = _extractAddress(dbtr);
    var tag = '';
    if (dbtrAcct) tag += '/' + dbtrAcct + '\n';
    if (debtorName) tag += debtorName + '\n';
    for (var i = 0; i < dbtrAddr.length && i < 3; i++) {
      tag += dbtrAddr[i].substring(0, 35) + '\n';
    }
    tag = tag.replace(/\n$/, '');
    return { tag: tag, name: debtorName, account: dbtrAcct, address: dbtrAddr, _display: tag.split('\n')[0] || '' };
  },

  creditorToParty: function(val, field, txInf) {
    var cdtr = getXmlEl(txInf, 'Cdtr');
    var creditorName = cdtr ? getXmlText(cdtr, 'Nm') : '';
    var cdtrAcct = getXmlPathText(txInf, 'CdtrAcct/Id/IBAN') || getXmlPathText(txInf, 'CdtrAcct/Id/Othr/Id');
    var cdtrAddr = _extractAddress(cdtr);
    var tag = '';
    if (cdtrAcct) tag += '/' + cdtrAcct + '\n';
    if (creditorName) tag += creditorName + '\n';
    for (var i = 0; i < cdtrAddr.length && i < 3; i++) {
      tag += cdtrAddr[i].substring(0, 35) + '\n';
    }
    tag = tag.replace(/\n$/, '');
    return { tag: tag, name: creditorName, account: cdtrAcct, address: cdtrAddr, _display: tag.split('\n')[0] || '' };
  },

  chargeBearerReverse: function(val, field, txInf, mapping) {
    var chrgBr = getXmlText(txInf, 'ChrgBr') || 'SHAR';
    var map = (mapping.valueMaps && mapping.valueMaps.chargeBearerReverse) || {};
    return { tag: map[chrgBr] || 'SHA', isoValue: chrgBr, _display: (map[chrgBr] || 'SHA') + ' (from ' + chrgBr + ')' };
  },

  splitLines35: function(val) {
    if (!val) return null;
    var text = val.substring(0, 140);
    var lines = '';
    for (var i = 0; i < text.length; i += 35) {
      if (lines) lines += '\n';
      lines += text.substring(i, i + 35);
    }
    return lines;
  },

  splitLines35x6: function(val) {
    if (!val) return null;
    var text = val.substring(0, 210);
    var lines = '';
    for (var i = 0; i < text.length; i += 35) {
      if (lines) lines += '\n';
      lines += text.substring(i, i + 35);
    }
    return lines;
  },

  splitLines65: function(val) {
    if (!val) return null;
    var text = val.substring(0, 390);
    var lines = '';
    for (var i = 0; i < text.length; i += 65) {
      if (lines) lines += '\n';
      lines += text.substring(i, i + 65);
    }
    return lines;
  },

  // Statement-specific transforms
  accountId: function(val, field, parsed) {
    return parsed.extracted.accountIdentification || '';
  },

  statementNumber: function(val, field, parsed) {
    var sn = parsed.extracted.statementNumber || {};
    return { statementNumber: sn.statementNumber || '1', sequenceNumber: sn.sequenceNumber || '1' };
  },

  balance: function(val, field, parsed) {
    var tag = field.mtTag;
    var f = parsed.fields[tag];
    if (!f) return null;
    if (Array.isArray(f)) {
      var results = [];
      for (var i = 0; i < f.length; i++) results.push(f[i].decoded);
      return results;
    }
    return f.decoded;
  },

  statementLine: function(val, field, parsed) {
    return parsed.extracted.statementLine || [];
  },

  // ISO → MT statement transforms
  accountIdReverse: function(val) { return val; },

  buildStatementNumber: function(val, field, txInf) {
    var elctrncSeqNb = getXmlText(txInf, 'ElctrncSeqNb') || '1';
    var lglSeqNb = getXmlText(txInf, 'LglSeqNb') || '1';
    return { tag: elctrncSeqNb + '/' + lglSeqNb, elctrncSeqNb: elctrncSeqNb, lglSeqNb: lglSeqNb };
  },

  balanceReverse: function() { return null; },
  entryToStatementLine: function() { return null; }
};

// Helper for address extraction from XML party nodes
function _extractAddress(partyEl) {
  var addr = [];
  if (!partyEl) return addr;
  var pstlAdr = getXmlEl(partyEl, 'PstlAdr');
  if (!pstlAdr) return addr;
  var children = pstlAdr.childNodes;
  for (var i = 0; i < children.length; i++) {
    if (children[i].nodeType === 1 && (children[i].localName === 'AdrLine' || children[i].nodeName === 'AdrLine')) {
      addr.push(children[i].textContent);
    }
  }
  if (addr.length === 0) {
    var strtNm = getXmlText(pstlAdr, 'StrtNm');
    var twnNm = getXmlText(pstlAdr, 'TwnNm');
    var pstCd = getXmlText(pstlAdr, 'PstCd');
    var ctry = getXmlText(pstlAdr, 'Ctry');
    if (strtNm) addr.push(strtNm);
    var cityLine = '';
    if (twnNm) cityLine += twnNm;
    if (pstCd) cityLine += ' ' + pstCd;
    if (ctry) cityLine += ' ' + ctry;
    if (cityLine) addr.push(cityLine.trim());
  }
  return addr;
}

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
  return window[ref] || null;
}

// FORMAT_LABELS, FORMAT_CATEGORIES loaded from config/formats.js

function formatLabel(fmt) {
  return FORMAT_LABELS[fmt] || fmt;
}

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
  document.getElementById('country-btn').classList.add('has-value');
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
  hideNativeISOBanner();

  if (!code) {
    fromBtn.disabled = true;
    return;
  }

  var formats = getFormatsForCountry(code);
  // Only show formats that have at least one translation path with a target also in this country
  var availableFrom = [];
  for (var i = 0; i < formats.length; i++) {
    var targets = getValidTargets(formats[i]);
    var hasCountryTarget = false;
    for (var j = 0; j < targets.length; j++) {
      if (formats.indexOf(targets[j]) !== -1) {
        hasCountryTarget = true;
        break;
      }
    }
    if (hasCountryTarget) {
      availableFrom.push(formats[i]);
    }
  }

  if (availableFrom.length === 0) {
    fromBtn.disabled = true;
    var c = COUNTRIES[code];
    showNativeISOBanner(c.name);
    return;
  }

  hideNativeISOBanner();

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

function showNativeISOBanner(countryName) {
  var el = document.getElementById('native-iso-banner');
  if (el) {
    document.getElementById('native-iso-text').textContent = countryName + ' is already ISO 20022-native';
    el.style.display = '';
  }
  document.querySelector('.format-bar').classList.add('format-bar-disabled');
}

function hideNativeISOBanner() {
  var el = document.getElementById('native-iso-banner');
  if (el) el.style.display = 'none';
  document.querySelector('.format-bar').classList.remove('format-bar-disabled');
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


// ─── GENERIC MT → ISO CONVERSION ENGINE ───
function convertMTtoISO(rawText, mapping) {
  var parsed = parseMT(rawText);
  if (!parsed.valid && parsed.errors.length > 0) {
    return { error: true, message: 'MT parse errors:\n' + parsed.errors.map(function(e) { return '• ' + e.message; }).join('\n') };
  }

  var ext = parsed.extracted;
  var fields = parsed.fields;
  var warnings = [];
  var fieldMap = [];

  // Generate common IDs
  var msgId = 'BRIDGE-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  var instrId = 'INSTR-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  var creDtTm = new Date().toISOString().substring(0, 19);
  var sttlmMtd = fields['53A'] ? 'COVE' : 'CLRG';

  // Amount/currency from :32A:
  var amount = ext.amount ? ext.amount.toFixed(2) : '0.00';
  var currency = ext.currency || 'USD';
  var valueDate = ext.valueDate || new Date().toISOString().substring(0, 10);

  // Resolve fixed element placeholders
  function resolveFixed(val) {
    if (val === '$MSGID') return msgId;
    if (val === '$NOW') return creDtTm;
    if (val === '$STTLM') return sttlmMtd;
    return val;
  }

  // --- Statement-type handling (MT940 → camt.053) ---
  if (mapping.isStatement) {
    return _convertMT940toISO(parsed, mapping, msgId, creDtTm);
  }

  // --- Payment-type handling (MT103 → pacs.008, MT202 → pacs.009) ---

  // Run transforms on each field to collect values
  var transformedValues = {};
  var mapFields = mapping.fields;
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcField = fields[mf.mtTag];
    var rawVal = srcField ? srcField.rawValue : '';
    var transformFn = TRANSFORMS[mf.transform] || TRANSFORMS.direct;
    var result = transformFn(rawVal, mf, parsed, mapping);
    transformedValues[mf.mtTag] = { raw: rawVal, transformed: result, field: mf, srcField: srcField };
  }

  // Determine endToEndId based on message type
  var endToEndId;
  if (mapping.sourceType === 'MT202') {
    var relRef = ext.relatedReference || ext.transactionReference || 'NOTPROVIDED';
    endToEndId = relRef.substring(0, 35);
  } else {
    endToEndId = (ext.transactionReference || 'NOTPROVIDED').substring(0, 35);
  }

  // Build XML string
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Document xmlns="' + mapping.isoNamespace + '">\n';
  xml += '  <' + mapping.rootElement + '>\n';

  // Group header
  xml += '    <GrpHdr>\n';
  xml += '      <MsgId>' + escXml(msgId) + '</MsgId>\n';
  xml += '      <CreDtTm>' + creDtTm + '</CreDtTm>\n';
  xml += '      <NbOfTxs>1</NbOfTxs>\n';
  xml += '      <SttlmInf><SttlmMtd>' + sttlmMtd + '</SttlmMtd></SttlmInf>\n';
  xml += '    </GrpHdr>\n';

  // Transaction element
  var txEl = mapping.txElement;
  xml += '    <' + txEl + '>\n';

  // PmtId
  xml += '      <PmtId>\n';
  xml += '        <InstrId>' + escXml(instrId) + '</InstrId>\n';
  xml += '        <EndToEndId>' + escXml(endToEndId) + '</EndToEndId>\n';
  xml += '      </PmtId>\n';

  // Amount
  xml += '      <IntrBkSttlmAmt Ccy="' + escXml(currency) + '">' + amount + '</IntrBkSttlmAmt>\n';
  xml += '      <IntrBkSttlmDt>' + valueDate + '</IntrBkSttlmDt>\n';

  // Instructed amount (MT103 only)
  if (ext.instructedAmount) {
    var instdCcy = ext.instructedCurrency || currency;
    xml += '      <InstdAmt Ccy="' + escXml(instdCcy) + '">' + ext.instructedAmount.toFixed(2) + '</InstdAmt>\n';
  }

  // Charge bearer (MT103 only)
  if (transformedValues['71A'] && transformedValues['71A'].transformed) {
    xml += '      <ChrgBr>' + transformedValues['71A'].transformed + '</ChrgBr>\n';
  }

  // Build remaining elements from field mappings
  // Process BIC fields and party fields in order
  var emittedPaths = {};
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var tv = transformedValues[mf.mtTag];
    if (!tv || !mf.isoPath) continue;
    // Skip fields already handled above
    if (mf.mtTag === '20' || mf.mtTag === '21' || mf.mtTag === '32A' || mf.mtTag === '33B' || mf.mtTag === '71A' || mf.mtTag === '23B') continue;
    // Skip settlement method (handled in GrpHdr)
    if (mf.isoPath.indexOf('SttlmMtd') !== -1) continue;

    var val = tv.transformed;
    if (!val && val !== 0) continue;

    // Skip alternative fields that map to the same isoPath (e.g. :50A: when :50K: already emitted Dbtr)
    if (emittedPaths[mf.isoPath]) continue;

    if (mf.transform === 'partyToDebtor' || mf.transform === 'partyBICToDebtor') {
      // Debtor party (MT103)
      emittedPaths[mf.isoPath] = true;
      var party = val;
      xml += '      <Dbtr>\n';
      xml += '        <Nm>' + escXml(party.name) + '</Nm>\n';
      if (party.address && party.address.length > 0) {
        xml += '        <PstlAdr>\n';
        for (var a = 0; a < party.address.length; a++) {
          xml += '          <AdrLine>' + escXml(party.address[a]) + '</AdrLine>\n';
        }
        xml += '        </PstlAdr>\n';
      }
      xml += '      </Dbtr>\n';
      if (party.account) {
        xml += '      <DbtrAcct><Id>';
        if (party.account.match(/^[A-Z]{2}\d{2}/)) {
          xml += '<IBAN>' + escXml(party.account) + '</IBAN>';
        } else {
          xml += '<Othr><Id>' + escXml(party.account) + '</Id></Othr>';
        }
        xml += '</Id></DbtrAcct>\n';
      }
    } else if (mf.transform === 'partyToCreditor') {
      // Creditor party (MT103)
      emittedPaths[mf.isoPath] = true;
      var party = val;
      xml += '      <Cdtr>\n';
      xml += '        <Nm>' + escXml(party.name) + '</Nm>\n';
      if (party.address && party.address.length > 0) {
        xml += '        <PstlAdr>\n';
        for (var a = 0; a < party.address.length; a++) {
          xml += '          <AdrLine>' + escXml(party.address[a]) + '</AdrLine>\n';
        }
        xml += '        </PstlAdr>\n';
      }
      xml += '      </Cdtr>\n';
      if (party.account) {
        xml += '      <CdtrAcct><Id>';
        if (party.account.match(/^[A-Z]{2}\d{2}/)) {
          xml += '<IBAN>' + escXml(party.account) + '</IBAN>';
        } else {
          xml += '<Othr><Id>' + escXml(party.account) + '</Id></Othr>';
        }
        xml += '</Id></CdtrAcct>\n';
      }
    } else if (mf.transform === 'joinLines') {
      // Text field with path like CdtTrfTxInf/RmtInf/Ustrd
      var pathParts = mf.isoPath.split('/');
      // Strip the txElement prefix if present
      var relPath = mf.isoPath;
      if (relPath.indexOf(txEl + '/') === 0) relPath = relPath.substring(txEl.length + 1);
      xml += _buildNestedXml(relPath, escXml(val), '      ');
    } else if (mf.transform === 'direct' || mf.transform === 'bicDirect') {
      // BIC or simple value fields
      var relPath = mf.isoPath;
      if (relPath.indexOf(txEl + '/') === 0) relPath = relPath.substring(txEl.length + 1);
      xml += _buildNestedXml(relPath, escXml(typeof val === 'string' ? val : ''), '      ');
    }
  }

  xml += '    </' + txEl + '>\n';
  xml += '  </' + mapping.rootElement + '>\n';
  xml += '</Document>';

  // Build field map for diagram
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var tv = transformedValues[mf.mtTag];
    var srcVal = tv ? tv.raw : '';
    var tgtVal = '';

    if (tv && tv.transformed != null) {
      var t = tv.transformed;
      if (typeof t === 'object' && t._display) tgtVal = t._display;
      else if (typeof t === 'object' && t.name !== undefined) tgtVal = t.name + (t.account ? ' [' + t.account + ']' : '');
      else if (typeof t === 'string') tgtVal = t;
    }

    // Special display overrides
    if (mf.mtTag === '20') tgtVal = endToEndId;
    if (mf.mtTag === '21') tgtVal = endToEndId;
    if (mf.mtTag === '32A') tgtVal = amount + ' ' + currency + ' (' + valueDate + ')';
    if (mf.mtTag === '71A') {
      var mtCharge = ext.chargeBearer || 'SHA';
      tgtVal = (tv && tv.transformed ? tv.transformed : '') + ' (from ' + mtCharge + ')';
    }

    if (srcVal || mf.status !== 'gap') {
      fieldMap.push({
        sourceTag: ':' + mf.mtTag + ':',
        sourceName: mf.mtName,
        sourceValue: srcVal,
        targetPath: mf.isoPath || '(dropped)',
        targetName: mf.isoName || '(no equivalent)',
        targetValue: tgtVal,
        status: tv && tv.srcField ? mf.status : 'gap',
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
  var path = getTranslationPath(mapping.sourceType, mapping.targetType);
  if (path) warnings = path.warnings.slice();

  // Charge bearer warning (MT103 only)
  if (mapping.sourceType === 'MT103') {
    var mtCharge = ext.chargeBearer || 'SHA';
    if (mtCharge !== 'SHA' && mtCharge !== 'OUR' && mtCharge !== 'BEN') {
      warnings.push('Unrecognized charge bearer "' + mtCharge + '" — defaulted to SHAR');
    }
  }

  // Build JSON
  var jsonObj = _buildMTtoISOJson(mapping, ext, fields, msgId, creDtTm, instrId, endToEndId, sttlmMtd, amount, currency, valueDate, transformedValues, warnings);

  return {
    error: false,
    xml: xml,
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: mapping.dataGaps || [],
    dataLoss: []
  };
}

// Statement-specific MT → ISO conversion (MT940 → camt.053)
function _convertMT940toISO(parsed, mapping, msgId, creDtTm) {
  var ext = parsed.extracted;
  var fields = parsed.fields;
  var warnings = [];
  var fieldMap = [];

  var txRef = ext.transactionReference || 'NOTPROVIDED';
  var stmtId = txRef.substring(0, 35);

  // Account identification
  var accountId = ext.accountIdentification || '';
  var isIBAN = accountId.match(/^[A-Z]{2}\d{2}/);

  // Statement number
  var stmtNum = ext.statementNumber || {};
  var elctrncSeqNb = stmtNum.statementNumber || '1';
  var lglSeqNb = stmtNum.sequenceNumber || '1';

  // Balances
  var openBal = fields['60F'] ? (Array.isArray(fields['60F']) ? fields['60F'][0].decoded : fields['60F'].decoded) : null;
  var closeBal = fields['62F'] ? (Array.isArray(fields['62F']) ? fields['62F'][0].decoded : fields['62F'].decoded) : null;
  var closAvail = fields['64'] ? (Array.isArray(fields['64']) ? fields['64'][0].decoded : fields['64'].decoded) : null;

  // Forward available balances (repeating)
  var fwdAvailBals = [];
  if (fields['65'] && Array.isArray(fields['65'])) {
    for (var i = 0; i < fields['65'].length; i++) fwdAvailBals.push(fields['65'][i].decoded);
  } else if (fields['65']) {
    fwdAvailBals.push(fields['65'].decoded);
  }

  // Statement lines (repeating)
  var stmtLines = ext.statementLine || [];
  if (!Array.isArray(stmtLines)) stmtLines = [stmtLines];

  // Info to account owner (repeating, paired with :61:)
  var infoLines = ext.informationToAccountOwner || [];
  if (!Array.isArray(infoLines)) infoLines = [infoLines];

  // Helper: build balance XML element
  function buildBalXml(bal, typeCode, indent) {
    if (!bal) return '';
    var x = indent + '<Bal>\n';
    x += indent + '  <Tp><CdOrPrtry><Cd>' + typeCode + '</Cd></CdOrPrtry></Tp>\n';
    x += indent + '  <Amt Ccy="' + escXml(bal.currency) + '">' + bal.amount.toFixed(2) + '</Amt>\n';
    x += indent + '  <CdtDbtInd>' + (bal.indicator === 'C' ? 'CRDT' : 'DBIT') + '</CdtDbtInd>\n';
    x += indent + '  <Dt><Dt>' + bal.date + '</Dt></Dt>\n';
    x += indent + '</Bal>\n';
    return x;
  }

  // Build XML
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Document xmlns="' + mapping.isoNamespace + '">\n';
  xml += '  <' + mapping.rootElement + '>\n';

  xml += '    <GrpHdr>\n';
  xml += '      <MsgId>' + escXml(msgId) + '</MsgId>\n';
  xml += '      <CreDtTm>' + creDtTm + '</CreDtTm>\n';
  xml += '    </GrpHdr>\n';

  xml += '    <Stmt>\n';
  xml += '      <Id>' + escXml(stmtId) + '</Id>\n';
  xml += '      <ElctrncSeqNb>' + escXml(elctrncSeqNb) + '</ElctrncSeqNb>\n';
  xml += '      <LglSeqNb>' + escXml(lglSeqNb) + '</LglSeqNb>\n';
  xml += '      <CreDtTm>' + creDtTm + '</CreDtTm>\n';

  // Account
  xml += '      <Acct><Id>';
  if (isIBAN) {
    xml += '<IBAN>' + escXml(accountId) + '</IBAN>';
  } else {
    xml += '<Othr><Id>' + escXml(accountId) + '</Id></Othr>';
  }
  xml += '</Id></Acct>\n';

  // Balances
  xml += buildBalXml(openBal, 'OPBD', '      ');
  xml += buildBalXml(closeBal, 'CLBD', '      ');
  if (closAvail) xml += buildBalXml(closAvail, 'CLAV', '      ');
  for (var i = 0; i < fwdAvailBals.length; i++) {
    xml += buildBalXml(fwdAvailBals[i], 'FWAV', '      ');
  }

  // Entries from :61: lines
  for (var i = 0; i < stmtLines.length; i++) {
    var sl = stmtLines[i];
    var cdtDbt = (sl.dcMark === 'C' || sl.dcMark === 'RC') ? 'CRDT' : 'DBIT';
    var isReversal = (sl.dcMark === 'RC' || sl.dcMark === 'RD');

    xml += '      <Ntry>\n';
    xml += '        <Amt Ccy="' + escXml(openBal ? openBal.currency : 'USD') + '">' + sl.amount.toFixed(2) + '</Amt>\n';
    xml += '        <CdtDbtInd>' + cdtDbt + '</CdtDbtInd>\n';
    if (isReversal) xml += '        <RvslInd>true</RvslInd>\n';
    xml += '        <Sts><Cd>BOOK</Cd></Sts>\n';
    xml += '        <BookgDt><Dt>' + (sl.entryDate || sl.valueDate) + '</Dt></BookgDt>\n';
    xml += '        <ValDt><Dt>' + sl.valueDate + '</Dt></ValDt>\n';
    xml += '        <BkTxCd><Prtry><Cd>' + escXml(sl.transactionType + sl.identificationCode) + '</Cd></Prtry></BkTxCd>\n';

    xml += '        <NtryDtls><TxDtls>\n';
    if (sl.customerReference) {
      xml += '          <Refs><AcctSvcrRef>' + escXml(sl.customerReference) + '</AcctSvcrRef></Refs>\n';
    }
    if (infoLines[i]) {
      var infoText = typeof infoLines[i] === 'string' ? infoLines[i] : '';
      if (infoText) {
        xml += '          <AddtlTxInf>' + escXml(infoText.replace(/\n/g, ' ')) + '</AddtlTxInf>\n';
      }
    }
    xml += '        </TxDtls></NtryDtls>\n';
    xml += '      </Ntry>\n';
  }

  xml += '    </Stmt>\n';
  xml += '  </' + mapping.rootElement + '>\n';
  xml += '</Document>';

  // Build field map
  var mapFields = mapping.fields;
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcField = fields[mf.mtTag];
    var srcVal = '';
    var tgtVal = '';

    if (mf.mtTag === '20') { srcVal = txRef; tgtVal = msgId; }
    else if (mf.mtTag === '25') { srcVal = accountId; tgtVal = accountId; }
    else if (mf.mtTag === '28C') { srcVal = srcField ? srcField.rawValue : ''; tgtVal = elctrncSeqNb + '/' + lglSeqNb; }
    else if (mf.mtTag === '60F') { srcVal = srcField ? (Array.isArray(srcField) ? srcField[0].rawValue : srcField.rawValue) : ''; tgtVal = openBal ? openBal.indicator + ' ' + openBal.date + ' ' + openBal.currency + openBal.amount.toFixed(2) : ''; }
    else if (mf.mtTag === '61') { srcVal = stmtLines.length + ' entries'; tgtVal = stmtLines.length + ' Ntry elements'; }
    else if (mf.mtTag === '86') { srcVal = infoLines.length + ' info blocks'; tgtVal = infoLines.length + ' AddtlTxInf elements'; }
    else if (mf.mtTag === '62F') { srcVal = srcField ? (Array.isArray(srcField) ? srcField[0].rawValue : srcField.rawValue) : ''; tgtVal = closeBal ? closeBal.indicator + ' ' + closeBal.date + ' ' + closeBal.currency + closeBal.amount.toFixed(2) : ''; }
    else if (mf.mtTag === '64') { srcVal = srcField ? (Array.isArray(srcField) ? srcField[0].rawValue : srcField.rawValue) : ''; tgtVal = closAvail ? 'CLAV balance' : ''; }
    else if (mf.mtTag === '65') { srcVal = fwdAvailBals.length + ' balances'; tgtVal = fwdAvailBals.length + ' FWAV elements'; }

    if (srcVal || mf.status !== 'gap') {
      fieldMap.push({
        sourceTag: ':' + mf.mtTag + ':',
        sourceName: mf.mtName,
        sourceValue: srcVal,
        targetPath: mf.isoPath || '(dropped)',
        targetName: mf.isoName || '(no equivalent)',
        targetValue: tgtVal,
        status: (srcField || srcVal) ? mf.status : 'gap',
        notes: mf.notes
      });
    }
  }

  // Auto-generated
  var autoGen = mapping.autoGenerated;
  for (var i = 0; i < autoGen.length; i++) {
    fieldMap.push({
      sourceTag: '—',
      sourceName: '(auto-generated)',
      sourceValue: '',
      targetPath: autoGen[i].isoPath,
      targetName: autoGen[i].description,
      targetValue: autoGen[i].isoPath === 'GrpHdr/CreDtTm' ? creDtTm :
                   autoGen[i].isoPath === 'Stmt/CreDtTm' ? creDtTm :
                   stmtId,
      status: 'auto',
      notes: autoGen[i].description
    });
  }

  var path = getTranslationPath(mapping.sourceType, mapping.targetType);
  if (path) warnings = path.warnings.slice();

  // Build JSON
  var entries = [];
  for (var i = 0; i < stmtLines.length; i++) {
    var sl = stmtLines[i];
    var entry = {
      amount: sl.amount,
      creditDebitIndicator: (sl.dcMark === 'C' || sl.dcMark === 'RC') ? 'CRDT' : 'DBIT',
      status: 'BOOK',
      bookingDate: sl.entryDate || sl.valueDate,
      valueDate: sl.valueDate,
      bankTransactionCode: sl.transactionType + sl.identificationCode,
      customerReference: sl.customerReference
    };
    if (infoLines[i]) entry.additionalInfo = typeof infoLines[i] === 'string' ? infoLines[i] : '';
    entries.push(entry);
  }

  var jsonObj = {
    messageType: mapping.isoNamespace.indexOf('camt.053') !== -1 ? 'camt.053.001.08' : mapping.targetType,
    groupHeader: { messageId: msgId, creationDateTime: creDtTm },
    statement: {
      id: stmtId,
      electronicSequenceNumber: elctrncSeqNb,
      account: accountId,
      openingBalance: openBal,
      closingBalance: closeBal,
      entries: entries
    },
    _translation: {
      source: mapping.sourceType,
      target: mapping.targetType,
      lossless: false,
      warnings: warnings,
      dataGaps: (mapping.dataGaps || []).map(function(g) { return g.isoPath + ': ' + g.description; })
    }
  };

  if (closAvail) jsonObj.statement.closingAvailableBalance = closAvail;
  if (fwdAvailBals.length > 0) jsonObj.statement.forwardAvailableBalances = fwdAvailBals;

  return {
    error: false,
    xml: xml,
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: mapping.dataGaps || [],
    dataLoss: []
  };
}

// Helper: build nested XML from a slash-delimited path
function _buildNestedXml(path, value, indent) {
  var parts = path.split('/');
  var xml = '';
  for (var i = 0; i < parts.length; i++) xml += indent + new Array(i + 1).join('  ') + '<' + parts[i] + '>';
  // Close inner elements inline for leaf, or with newlines for nesting
  if (parts.length === 1) {
    return indent + '<' + parts[0] + '>' + value + '</' + parts[0] + '>\n';
  }
  xml = '';
  var open = '';
  var close = '';
  for (var i = 0; i < parts.length; i++) open += '<' + parts[i] + '>';
  for (var i = parts.length - 1; i >= 0; i--) close += '</' + parts[i] + '>';
  return indent + open + value + close + '\n';
}

// Helper: build JSON object for MT → ISO payment conversions
function _buildMTtoISOJson(mapping, ext, fields, msgId, creDtTm, instrId, endToEndId, sttlmMtd, amount, currency, valueDate, transformedValues, warnings) {
  var isoVersion = mapping.isoNamespace.indexOf('pacs.008') !== -1 ? 'pacs.008.001.08' :
                   mapping.isoNamespace.indexOf('pacs.009') !== -1 ? 'pacs.009.001.08' : mapping.targetType;

  var jsonObj = {
    messageType: isoVersion,
    groupHeader: {
      messageId: msgId,
      creationDateTime: creDtTm,
      numberOfTransactions: 1,
      settlementMethod: sttlmMtd
    },
    creditTransferTransaction: {
      paymentId: { instructionId: instrId, endToEndId: endToEndId },
      interbankSettlementAmount: { currency: currency, amount: parseFloat(amount) },
      interbankSettlementDate: valueDate
    },
    _translation: {
      source: mapping.sourceType,
      target: mapping.targetType,
      lossless: false,
      warnings: warnings,
      dataGaps: (mapping.dataGaps || []).map(function(g) { return g.isoPath + ': ' + g.description; })
    }
  };

  // Add type-specific fields
  if (mapping.sourceType === 'MT103') {
    var debtorTv = transformedValues['50K'] || transformedValues['50A'];
    var creditorTv = transformedValues['59'];
    var debtor = debtorTv ? debtorTv.transformed : {};
    var creditor = creditorTv ? creditorTv.transformed : {};
    jsonObj.creditTransferTransaction.chargeBearer = transformedValues['71A'] ? transformedValues['71A'].transformed : 'SHAR';
    jsonObj.creditTransferTransaction.debtor = { name: debtor.name || '', account: debtor.account || '', address: debtor.address || [] };
    jsonObj.creditTransferTransaction.debtorAgent = fields['52A'] ? fields['52A'].rawValue.trim() : '';
    jsonObj.creditTransferTransaction.creditorAgent = fields['57A'] ? fields['57A'].rawValue.trim() : '';
    jsonObj.creditTransferTransaction.creditor = { name: creditor.name || '', account: creditor.account || '', address: creditor.address || [] };
    var remittance = ext.remittanceInformation || '';
    if (typeof remittance === 'string') jsonObj.creditTransferTransaction.remittanceInformation = remittance.replace(/\n/g, ' ');
    if (ext.instructedAmount) {
      jsonObj.creditTransferTransaction.instructedAmount = { currency: ext.instructedCurrency || currency, amount: ext.instructedAmount };
    }
    var intermediary = fields['56A'] ? fields['56A'].rawValue.trim() : '';
    if (intermediary) jsonObj.creditTransferTransaction.intermediaryAgent = intermediary;
    var instrForAgent = ext.senderToReceiverInfo || '';
    if (typeof instrForAgent === 'string' && instrForAgent) jsonObj.creditTransferTransaction.instructionForCreditorAgent = instrForAgent.replace(/\n/g, ' ');
  } else if (mapping.sourceType === 'MT202') {
    var getBIC = function(tag) {
      var f = fields[tag];
      if (!f) return '';
      return (f.decoded && typeof f.decoded === 'string') ? f.decoded : f.rawValue.trim();
    };
    jsonObj.creditTransferTransaction.debtor = getBIC('52A');
    jsonObj.creditTransferTransaction.creditorAgent = getBIC('57A');
    jsonObj.creditTransferTransaction.creditor = getBIC('58A');
    var senderCorr = getBIC('53A');
    var receiverCorr = getBIC('54A');
    var intermediary = getBIC('56A');
    var instrForAgent = ext.senderToReceiverInfo || '';
    if (senderCorr) jsonObj.creditTransferTransaction.instructingReimbursementAgent = senderCorr;
    if (receiverCorr) jsonObj.creditTransferTransaction.instructedReimbursementAgent = receiverCorr;
    if (intermediary) jsonObj.creditTransferTransaction.intermediaryAgent = intermediary;
    if (typeof instrForAgent === 'string' && instrForAgent) jsonObj.creditTransferTransaction.instructionForNextAgent = instrForAgent.replace(/\n/g, ' ');
  }

  return jsonObj;
}

// ─── GENERIC ISO → MT CONVERSION ENGINE ───
function convertISOtoMT(xmlText, mapping) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, 'text/xml');

  var parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { error: true, message: 'XML parse error: ' + parseError.textContent.substring(0, 200) };
  }

  var root = doc.documentElement;
  var ftf = getXmlEl(root, mapping.isoRootElement);
  if (!ftf) {
    return { error: true, message: 'Not a ' + mapping.sourceType + ' message — missing ' + mapping.isoRootElement + ' element' };
  }

  // Statement-type handling (camt.053 → MT940)
  if (mapping.isStatement) {
    return _convertCamt053toMT940(ftf, mapping);
  }

  // Payment-type handling (pacs.008 → MT103, pacs.009 → MT202)
  var grpHdr = getXmlEl(ftf, 'GrpHdr');
  var txInf = getXmlEl(ftf, mapping.isoTxPath);
  if (!txInf) {
    return { error: true, message: 'Missing ' + mapping.isoTxPath + ' element' };
  }

  var warnings = [];
  var fieldMap = [];
  var dataLoss = [];

  // Extract common values
  var msgId = grpHdr ? getXmlText(grpHdr, 'MsgId') : '';
  var endToEndId = getXmlPathText(txInf, 'PmtId/EndToEndId');
  var instrId = getXmlPathText(txInf, 'PmtId/InstrId');

  // Run transforms on each field
  var mtTags = {};
  var transformResults = {};
  var mapFields = mapping.fields;

  // Strip txPath prefix from isoPath for XML lookups (txInf is already the tx node)
  var txPathPrefix = mapping.isoTxPath + '/';

  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var transformFn = TRANSFORMS[mf.transform] || TRANSFORMS.direct;
    var isoVal = '';

    // Resolve the relative path within txInf
    var relPath = mf.isoPath;
    if (relPath && relPath.indexOf(txPathPrefix) === 0) {
      relPath = relPath.substring(txPathPrefix.length);
    }

    // Extract source value from XML
    if (mf.transform === 'buildTag32A' || mf.transform === 'buildTag33B' ||
        mf.transform === 'debtorToParty' || mf.transform === 'creditorToParty' ||
        mf.transform === 'chargeBearerReverse' || mf.transform === 'buildStatementNumber') {
      // Complex transforms need full txInf context
      var result = transformFn(null, mf, txInf, mapping);
      transformResults[mf.mtTag] = result;
      if (result && result.tag !== undefined) {
        mtTags[mf.mtTag] = result.tag;
      } else if (typeof result === 'string') {
        mtTags[mf.mtTag] = result;
      } else {
        mtTags[mf.mtTag] = result;
      }
    } else if (mf.transform === 'truncate16') {
      isoVal = getXmlPathText(txInf, relPath);
      // For pacs.009 → MT202 :20:, use MsgId or InstrId
      if (mf.mtTag === '20' && mapping.targetType === 'MT202') {
        isoVal = msgId || instrId || 'BRIDGE' + Date.now();
      }
      var truncated = (isoVal || '').substring(0, 16);
      if (isoVal && isoVal.length > 16) {
        warnings.push('Value truncated from ' + isoVal.length + ' to 16 characters for :' + mf.mtTag + ':');
      }
      mtTags[mf.mtTag] = truncated;
      transformResults[mf.mtTag] = truncated;
    } else if (mf.transform === 'splitLines35') {
      isoVal = getXmlPathText(txInf, relPath);
      var split = TRANSFORMS.splitLines35x6(isoVal);
      mtTags[mf.mtTag] = split || '';
      transformResults[mf.mtTag] = split || '';
      if (mf.mtTag === '70' && isoVal && isoVal.length > 140) {
        warnings.push('Remittance truncated from ' + isoVal.length + ' to 140 characters');
      }
    } else if (mf.transform === 'direct') {
      isoVal = getXmlPathText(txInf, relPath);
      mtTags[mf.mtTag] = isoVal;
      transformResults[mf.mtTag] = isoVal;
    } else {
      isoVal = getXmlPathText(txInf, relPath);
      mtTags[mf.mtTag] = isoVal;
      transformResults[mf.mtTag] = isoVal;
    }
  }

  // Build MT envelope
  var senderBIC, receiverBIC;
  var env = mapping.envelope;
  if (env.block1Bic.from) {
    senderBIC = getXmlPathText(txInf, env.block1Bic.from);
    senderBIC = senderBIC ? senderBIC.substring(0, 8).padEnd(12, 'X') : env.block1Bic.fallback;
  } else {
    senderBIC = env.block1Bic.fallback;
  }
  if (env.block2Bic && env.block2Bic.from) {
    receiverBIC = getXmlPathText(txInf, env.block2Bic.from);
    receiverBIC = receiverBIC ? receiverBIC.substring(0, 8).padEnd(12, 'X') : env.block2Bic.fallback;
  } else if (env.block2Bic) {
    receiverBIC = env.block2Bic.fallback;
  } else {
    receiverBIC = 'BANKDE33XXXX';
  }

  // Assemble MT message
  var mt = '{1:F01' + senderBIC + '0000000000}\n';
  mt += '{2:I' + env.block2Type + receiverBIC + 'N}\n';
  mt += '{4:\n';

  // Emit tags in order, with special handling
  var order = mapping.mtFieldOrder;
  for (var i = 0; i < order.length; i++) {
    var tag = order[i];
    var val = mtTags[tag];

    // Special: :23B: is always CRED for MT103
    if (tag === '23B' && mapping.targetType === 'MT103') {
      mt += ':23B:CRED\n';
      continue;
    }

    // Special: :71A: for MT103 — extract tag value from result
    if (tag === '71A' && transformResults['71A']) {
      var chResult = transformResults['71A'];
      mt += ':71A:' + (chResult.tag || chResult || 'SHA') + '\n';
      continue;
    }

    if (val && (typeof val === 'string' ? val.trim() : true)) {
      var tagVal = typeof val === 'string' ? val : (val.tag || '');
      if (tagVal) mt += ':' + tag + ':' + tagVal + '\n';
    }
  }

  mt += '-}';

  // SLEV warning
  if (mapping.targetType === 'MT103') {
    var chrgBr = getXmlText(txInf, 'ChrgBr') || 'SHAR';
    if (chrgBr === 'SLEV') {
      warnings.push('SLEV (Service Level) has no exact MT equivalent — defaulted to SHA');
    }
  }

  // Build field map for diagram
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcVal = '';
    var tgtVal = '';

    // Get source value from XML
    if (mf.transform === 'buildTag32A') {
      var tr = transformResults[mf.mtTag];
      srcVal = (tr ? tr.amount : '0') + ' ' + (tr ? tr.currency : 'USD');
      tgtVal = tr ? tr.tag : '';
    } else if (mf.transform === 'buildTag33B') {
      var tr = transformResults[mf.mtTag];
      srcVal = tr ? tr._display : '';
      tgtVal = tr ? tr.tag : '';
    } else if (mf.transform === 'debtorToParty') {
      var tr = transformResults[mf.mtTag];
      srcVal = tr ? tr.name : '';
      tgtVal = tr ? (tr.tag || '').split('\n')[0] || '' : '';
    } else if (mf.transform === 'creditorToParty') {
      var tr = transformResults[mf.mtTag];
      srcVal = tr ? tr.name : '';
      tgtVal = tr ? (tr.tag || '').split('\n')[0] || '' : '';
    } else if (mf.transform === 'chargeBearerReverse') {
      var tr = transformResults[mf.mtTag];
      srcVal = tr ? tr.isoValue : '';
      tgtVal = tr ? tr._display : '';
    } else {
      var fmRelPath = mf.isoPath;
      if (fmRelPath && fmRelPath.indexOf(txPathPrefix) === 0) fmRelPath = fmRelPath.substring(txPathPrefix.length);
      srcVal = getXmlPathText(txInf, fmRelPath);
      tgtVal = mtTags[mf.mtTag] || '';
    }

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
                   (mtTags['23B'] || mtTags['20'] || ''),
      status: 'auto',
      notes: autoGen[i].description
    });
  }

  // Data loss items
  var lossItems = mapping.dataLoss || [];
  for (var i = 0; i < lossItems.length; i++) {
    var lossRelPath = lossItems[i].isoPath;
    if (lossRelPath.indexOf(txPathPrefix) === 0) lossRelPath = lossRelPath.substring(txPathPrefix.length);
    var lostVal = getXmlPathText(txInf, lossRelPath);
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
  var path = getTranslationPath(mapping.sourceType, mapping.targetType);
  if (path) {
    for (var i = 0; i < path.warnings.length; i++) {
      if (warnings.indexOf(path.warnings[i]) === -1) {
        warnings.push(path.warnings[i]);
      }
    }
  }

  // Build JSON
  var jsonObj = _buildISOtoMTJson(mapping, txInf, mtTags, transformResults, senderBIC, receiverBIC, warnings, dataLoss);

  return {
    error: false,
    mt: mt,
    xml: mt,
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: [],
    dataLoss: dataLoss
  };
}

// Statement-specific ISO → MT conversion (camt.053 → MT940)
function _convertCamt053toMT940(ftf, mapping) {
  var stmt = getXmlEl(ftf, 'Stmt');
  if (!stmt) {
    return { error: true, message: 'Missing Stmt element' };
  }

  var warnings = [];
  var fieldMap = [];
  var dataLoss = [];

  var stmtId = getXmlText(stmt, 'Id') || 'STATEMENT';
  var elctrncSeqNb = getXmlText(stmt, 'ElctrncSeqNb') || '1';
  var lglSeqNb = getXmlText(stmt, 'LglSeqNb') || '1';

  // Account
  var acctId = getXmlPathText(stmt, 'Acct/Id/IBAN') || getXmlPathText(stmt, 'Acct/Id/Othr/Id');

  // Balances — find by type code
  function findBalance(typeCode) {
    var children = stmt.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeType === 1 && (children[i].localName === 'Bal' || children[i].nodeName === 'Bal')) {
        var cd = getXmlPathText(children[i], 'Tp/CdOrPrtry/Cd');
        if (cd === typeCode) {
          var amtEl = getXmlEl(children[i], 'Amt');
          return {
            indicator: getXmlText(children[i], 'CdtDbtInd') === 'CRDT' ? 'C' : 'D',
            date: getXmlPathText(children[i], 'Dt/Dt') || new Date().toISOString().substring(0, 10),
            currency: amtEl ? (amtEl.getAttribute('Ccy') || 'USD') : 'USD',
            amount: amtEl ? parseFloat(amtEl.textContent) || 0 : 0,
          };
        }
      }
    }
    return null;
  }

  function findAllBalances(typeCode) {
    var results = [];
    var children = stmt.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeType === 1 && (children[i].localName === 'Bal' || children[i].nodeName === 'Bal')) {
        var cd = getXmlPathText(children[i], 'Tp/CdOrPrtry/Cd');
        if (cd === typeCode) {
          var amtEl = getXmlEl(children[i], 'Amt');
          results.push({
            indicator: getXmlText(children[i], 'CdtDbtInd') === 'CRDT' ? 'C' : 'D',
            date: getXmlPathText(children[i], 'Dt/Dt') || new Date().toISOString().substring(0, 10),
            currency: amtEl ? (amtEl.getAttribute('Ccy') || 'USD') : 'USD',
            amount: amtEl ? parseFloat(amtEl.textContent) || 0 : 0,
          });
        }
      }
    }
    return results;
  }

  var openBal = findBalance('OPBD');
  var closeBal = findBalance('CLBD');
  var closAvail = findBalance('CLAV');
  var fwdAvailBals = findAllBalances('FWAV');

  function formatBalance(bal) {
    if (!bal) return '';
    var dateParts = bal.date.split('-');
    var dateStr = dateParts[0].substring(2) + dateParts[1] + dateParts[2];
    var amtStr = bal.amount.toFixed(2).replace('.', ',');
    return bal.indicator + dateStr + bal.currency + amtStr;
  }

  // Entries
  var entries = [];
  var ntryNodes = [];
  var stmtChildren = stmt.childNodes;
  for (var i = 0; i < stmtChildren.length; i++) {
    if (stmtChildren[i].nodeType === 1 && (stmtChildren[i].localName === 'Ntry' || stmtChildren[i].nodeName === 'Ntry')) {
      ntryNodes.push(stmtChildren[i]);
    }
  }

  for (var i = 0; i < ntryNodes.length; i++) {
    var ntry = ntryNodes[i];
    var amtEl = getXmlEl(ntry, 'Amt');
    var amt = amtEl ? parseFloat(amtEl.textContent) || 0 : 0;
    var cdtDbt = getXmlText(ntry, 'CdtDbtInd');
    var valDt = getXmlPathText(ntry, 'ValDt/Dt') || getXmlPathText(ntry, 'BookgDt/Dt') || '';
    var bookDt = getXmlPathText(ntry, 'BookgDt/Dt') || '';
    var txCd = getXmlPathText(ntry, 'BkTxCd/Prtry/Cd') || getXmlPathText(ntry, 'BkTxCd/Domn/Fmly/Cd') || 'NTRF';
    var custRef = getXmlPathText(ntry, 'NtryDtls/TxDtls/Refs/AcctSvcrRef') || getXmlPathText(ntry, 'NtryDtls/TxDtls/Refs/EndToEndId') || 'NONREF';
    var addtlInfo = getXmlPathText(ntry, 'NtryDtls/TxDtls/AddtlTxInf');

    var dcMark = cdtDbt === 'CRDT' ? 'C' : 'D';
    var rvslInd = getXmlText(ntry, 'RvslInd');
    if (rvslInd === 'true') dcMark = 'R' + dcMark;

    var valDateParts = valDt.split('-');
    var valDateStr = valDateParts.length === 3 ? valDateParts[0].substring(2) + valDateParts[1] + valDateParts[2] : '';
    var entryDateStr = '';
    if (bookDt && bookDt !== valDt) {
      var bookParts = bookDt.split('-');
      if (bookParts.length === 3) entryDateStr = bookParts[1] + bookParts[2];
    }
    var amtStr = amt.toFixed(2).replace('.', ',');
    var txTypeChar = txCd.charAt(0) || 'N';
    var idCodeStr = txCd.substring(0, 3).padEnd(3, ' ');
    if (txCd.length >= 4) {
      txTypeChar = txCd.charAt(0);
      idCodeStr = txCd.substring(1, 4);
    }

    var tag61 = valDateStr + entryDateStr + dcMark + amtStr + txTypeChar + idCodeStr + custRef.substring(0, 16);

    entries.push({
      tag61: tag61,
      tag86: addtlInfo || '',
      amount: amt,
      dcMark: dcMark,
      valueDate: valDt,
      custRef: custRef
    });
  }

  // Build MT message
  var tag20 = stmtId.substring(0, 16);
  var tag25 = acctId.substring(0, 35);
  var tag28C = elctrncSeqNb + '/' + lglSeqNb;

  var mt = '{1:F01BANKUS33XXXX0000000000}\n';
  mt += '{2:O9400000000000BANKUS33XXXX00000000000000000000N}\n';
  mt += '{4:\n';
  mt += ':20:' + tag20 + '\n';
  mt += ':25:' + tag25 + '\n';
  mt += ':28C:' + tag28C + '\n';
  mt += ':60F:' + formatBalance(openBal) + '\n';

  for (var i = 0; i < entries.length; i++) {
    mt += ':61:' + entries[i].tag61 + '\n';
    if (entries[i].tag86) {
      var info86 = entries[i].tag86.substring(0, 390);
      var lines86 = '';
      for (var j = 0; j < info86.length; j += 65) {
        if (lines86) lines86 += '\n';
        lines86 += info86.substring(j, j + 65);
      }
      mt += ':86:' + lines86 + '\n';
    }
  }

  mt += ':62F:' + formatBalance(closeBal) + '\n';
  if (closAvail) mt += ':64:' + formatBalance(closAvail) + '\n';
  for (var i = 0; i < fwdAvailBals.length; i++) {
    mt += ':65:' + formatBalance(fwdAvailBals[i]) + '\n';
  }
  mt += '-}';

  // Build field map
  var mapFields = mapping.fields;
  for (var i = 0; i < mapFields.length; i++) {
    var mf = mapFields[i];
    var srcVal = '';
    var tgtVal = '';

    if (mf.isoPath === 'Stmt/Id') { srcVal = stmtId; tgtVal = tag20; }
    else if (mf.isoPath === 'Stmt/Acct/Id') { srcVal = acctId; tgtVal = tag25; }
    else if (mf.isoPath === 'Stmt/ElctrncSeqNb') { srcVal = elctrncSeqNb; tgtVal = tag28C; }
    else if (mf.isoPath === 'Stmt/Bal[OPBD]') { srcVal = openBal ? 'OPBD balance' : ''; tgtVal = formatBalance(openBal); }
    else if (mf.isoPath === 'Stmt/Ntry') { srcVal = entries.length + ' entries'; tgtVal = entries.length + ' :61: lines'; }
    else if (mf.isoPath === 'Stmt/Ntry/NtryDtls/TxDtls/AddtlTxInf') { srcVal = entries.filter(function(e) { return e.tag86; }).length + ' info blocks'; tgtVal = 'paired :86: fields'; }
    else if (mf.isoPath === 'Stmt/Bal[CLBD]') { srcVal = closeBal ? 'CLBD balance' : ''; tgtVal = formatBalance(closeBal); }
    else if (mf.isoPath === 'Stmt/Bal[CLAV]') { srcVal = closAvail ? 'CLAV balance' : ''; tgtVal = closAvail ? formatBalance(closAvail) : ''; }
    else if (mf.isoPath === 'Stmt/Bal[FWAV]') { srcVal = fwdAvailBals.length + ' balances'; tgtVal = fwdAvailBals.length + ' :65: fields'; }

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

  // Auto-generated
  var autoGen = mapping.autoGenerated;
  for (var i = 0; i < autoGen.length; i++) {
    fieldMap.push({
      sourceTag: '—',
      sourceName: '(auto-generated)',
      sourceValue: '',
      targetPath: autoGen[i].mtField,
      targetName: autoGen[i].description,
      targetValue: autoGen[i].mtField.indexOf('Block 1') !== -1 ? 'BANKUS33XXXX' : 'O940...',
      status: 'auto',
      notes: autoGen[i].description
    });
  }

  // Data loss
  var lossItems = mapping.dataLoss || [];
  for (var i = 0; i < lossItems.length; i++) {
    var hasLoss = false;
    if (lossItems[i].isoPath === 'Stmt/FrToDt') hasLoss = !!getXmlEl(stmt, 'FrToDt');
    else if (lossItems[i].isoPath === 'Stmt/Ntry/Sts/Cd') hasLoss = ntryNodes.length > 0;
    else if (lossItems[i].isoPath.indexOf('Ntry') !== -1) hasLoss = ntryNodes.length > 0;
    else hasLoss = !!getXmlPathText(stmt, lossItems[i].isoPath.replace('Stmt/', ''));

    if (hasLoss) {
      dataLoss.push({ path: lossItems[i].isoPath, description: lossItems[i].description, lostValue: '(present in source)' });
    }
  }

  var path = getTranslationPath(mapping.sourceType, mapping.targetType);
  if (path) warnings = path.warnings.slice();

  // Build JSON
  var jsonEntries = [];
  for (var i = 0; i < entries.length; i++) {
    jsonEntries.push({
      tag61: entries[i].tag61,
      amount: entries[i].amount,
      creditDebit: entries[i].dcMark,
      valueDate: entries[i].valueDate,
      customerReference: entries[i].custRef,
      additionalInfo: entries[i].tag86
    });
  }

  var jsonObj = {
    messageType: 'MT940',
    transactionReference: tag20,
    accountIdentification: tag25,
    statementNumber: tag28C,
    openingBalance: openBal,
    closingBalance: closeBal,
    entries: jsonEntries,
    _translation: {
      source: mapping.sourceType,
      target: mapping.targetType,
      lossless: false,
      warnings: warnings,
      dataLoss: dataLoss.map(function(d) { return d.path + ': ' + d.description; })
    }
  };

  return {
    error: false,
    mt: mt,
    xml: mt,
    json: jsonObj,
    warnings: warnings,
    fieldMap: fieldMap,
    dataGaps: [],
    dataLoss: dataLoss
  };
}

// Helper: build JSON for ISO → MT payment conversions
function _buildISOtoMTJson(mapping, txInf, mtTags, transformResults, senderBIC, receiverBIC, warnings, dataLoss) {
  if (mapping.targetType === 'MT103') {
    var tr32A = transformResults['32A'] || {};
    var trDbtr = transformResults['50K'] || {};
    var trCdtr = transformResults['59'] || {};
    var jsonObj = {
      messageType: 'MT103',
      transactionReference: mtTags['20'] || '',
      bankOperationCode: 'CRED',
      valueDateCurrencyAmount: {
        date: tr32A.settleDate || '',
        currency: tr32A.currency || 'USD',
        amount: parseFloat(tr32A.amount || '0')
      },
      chargeBearer: mtTags['71A'] || 'SHA',
      orderingCustomer: {
        account: trDbtr.account || '',
        name: trDbtr.name || '',
        address: trDbtr.address || []
      },
      beneficiary: {
        account: trCdtr.account || '',
        name: trCdtr.name || '',
        address: trCdtr.address || []
      },
      remittanceInformation: getXmlPathText(txInf, 'RmtInf/Ustrd'),
      _translation: {
        source: mapping.sourceType,
        target: mapping.targetType,
        lossless: false,
        warnings: warnings,
        dataLoss: dataLoss.map(function(d) { return d.path + ': ' + d.description; })
      }
    };
    var debtorAgentBIC = getXmlPathText(txInf, 'DbtrAgt/FinInstnId/BICFI');
    var creditorAgentBIC = getXmlPathText(txInf, 'CdtrAgt/FinInstnId/BICFI');
    if (debtorAgentBIC) jsonObj.orderingInstitution = debtorAgentBIC;
    if (creditorAgentBIC) jsonObj.accountWithInstitution = creditorAgentBIC;
    return jsonObj;
  } else if (mapping.targetType === 'MT202') {
    var tr32A = transformResults['32A'] || {};
    var jsonObj = {
      messageType: 'MT202',
      transactionReference: mtTags['20'] || '',
      relatedReference: mtTags['21'] || '',
      valueDateCurrencyAmount: {
        date: tr32A.settleDate || '',
        currency: tr32A.currency || 'USD',
        amount: parseFloat(tr32A.amount || '0')
      },
      beneficiaryInstitution: getXmlPathText(txInf, 'Cdtr/FinInstnId/BICFI'),
      _translation: {
        source: mapping.sourceType,
        target: mapping.targetType,
        lossless: false,
        warnings: warnings,
        dataLoss: dataLoss.map(function(d) { return d.path + ': ' + d.description; })
      }
    };
    var debtorBIC = getXmlPathText(txInf, 'Dbtr/FinInstnId/BICFI');
    var creditorAgentBIC = getXmlPathText(txInf, 'CdtrAgt/FinInstnId/BICFI');
    if (debtorBIC) jsonObj.orderingInstitution = debtorBIC;
    if (creditorAgentBIC) jsonObj.accountWithInstitution = creditorAgentBIC;
    return jsonObj;
  }
  return { messageType: mapping.targetType };
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

  var path = getTranslationPath(fromVal, toVal);
  if (!path) {
    showToast('Translation path ' + fromVal + ' → ' + toVal + ' not yet supported', true);
    return;
  }

  var mapping = getMapping(path.mappingRef);
  if (!mapping) {
    showToast('Mapping configuration not found: ' + path.mappingRef, true);
    return;
  }

  var result;
  if (mapping.direction === 'mt-to-iso') {
    result = convertMTtoISO(rawText, mapping);
  } else {
    result = convertISOtoMT(rawText, mapping);
  }

  if (result.error) {
    renderError(result.message);
    return;
  }

  currentOutput = result;
  currentView = 'xml';
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
      html += '<div class="note-item"><img src="assets/error.svg" alt="" class="note-icon-img note-icon-error"><span class="note-text"><code>' + escHtml(g.isoPath) + '</code><br>' + escHtml(g.description) + '</span></div>';
    }
    html += '</div>';
  }

  // Data loss
  if (result.dataLoss && result.dataLoss.length > 0) {
    html += '<div class="conversion-notes">';
    html += '<div class="section-header">Data Loss <span class="section-count">' + result.dataLoss.length + '</span></div>';
    for (var i = 0; i < result.dataLoss.length; i++) {
      var d = result.dataLoss[i];
      html += '<div class="note-item"><img src="assets/error.svg" alt="" class="note-icon-img note-icon-error"><span class="note-text"><code>' + escHtml(d.path) + '</code><br>' + escHtml(d.description) + '</span></div>';
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
      var targets = getValidTargets(formats[i]);
      var hasCountryTarget = false;
      for (var j = 0; j < targets.length; j++) {
        if (formats.indexOf(targets[j]) !== -1) { hasCountryTarget = true; break; }
      }
      if (hasCountryTarget) availableFrom.push(formats[i]);
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
// INLINE_SAMPLES loaded from config/formats.js

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
