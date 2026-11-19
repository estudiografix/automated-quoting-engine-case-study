/**
 * @fileoverview Sistema de Automatización de Presupuestos (Jotform -> Sheets -> Slides -> PDF -> WhatsApp)
 * @role Senior Product Designer & DesignOps Builder
 * @version 2.5.0 - Production Release (Sanitized for Public Repository)
 */

/* =========================================
   1. CONFIGURACIÓN CENTRALIZADA (SANITIZADA)
   ========================================= */
const CONFIG = {
  SHEET_NAME: 'AUX',
  TEMPLATE_ID: 'YOUR_GOOGLE_SLIDES_TEMPLATE_ID_HERE',
  ROOT_PATH: ['Presupuestos'],
  WEBAPP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec',
  WA_FALLBACK: '5493870000000' // Teléfono comercial de respaldo (Formato internacional sin +)
};

// Mapeo exacto de columnas en hoja normalizada 'AUX'
const COLS = {
  CLIENTE:   'cliente_nombre',
  NUMERO:    'NRO_GENERADO',
  ESTADO:    'estado',        
  PROCESADO: 'procesado_at',  
  FECHA:     'fecha',
  XID:       'submission_id',
  PDF_URL:   'pdf_url',
  WA_LINK:   'whatsapp_link_envio',
  WEB_LINK:  'webapp_link_envio'
};

const FORCE_TEXT_COLS = ['cuit_cuil', 'telefono', 'vehiculo_patente'];

/* =========================================
   2. TRIGGER Y SETUP
   ========================================= */

function activarAutoPDF_cadaMinuto() {
  const funcName = 'generarPDFsNuevos';
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === funcName) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger(funcName).timeBased().everyMinutes(1).create();
  console.log('Trigger configurado exitosamente.');
}

/* =========================================
   3. FUNCIÓN PRINCIPAL (MAIN LOOP)
   ========================================= */

function generarPDFsNuevos() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) return;

  const data = readSheetFull_(sh);
  if (data.raw.length === 0) return;

  const { headers, raw: rawRows, disp: dispRows, startRow } = data;

  const getIdx = (name) => {
    const i = headers.indexOf(name);
    if (i === -1 && [COLS.PDF_URL, COLS.WA_LINK, COLS.WEB_LINK, COLS.PROCESADO].includes(name)) {
      return ensureColumn_(sh, headers, name);
    }
    return i;
  };

  const iCliente   = getIdx(COLS.CLIENTE);
  const iNumero    = getIdx(COLS.NUMERO);
  const iEstado    = getIdx(COLS.ESTADO);
  const iFecha     = headers.indexOf(COLS.FECHA);
  const iXid       = headers.indexOf(COLS.XID);
  
  const iProcesado = getIdx(COLS.PROCESADO);
  const iPdfUrl    = getIdx(COLS.PDF_URL);
  const iWaLink    = getIdx(COLS.WA_LINK);
  const iWebLink   = getIdx(COLS.WEB_LINK);

  if (iCliente === -1 || iEstado === -1) return;

  const rootFolder = getOrCreatePath_(CONFIG.ROOT_PATH);
  const timestamp  = new Date();
  
  rawRows.forEach((rowRaw, relativeIdx) => {
    const absoluteRow = startRow + relativeIdx;
    
    try {
      const rowDisp = dispRows[relativeIdx];
      const estado    = String(rowRaw[iEstado] || '').trim().toLowerCase();
      const procesado = rowRaw[iProcesado];

      // Solo procesa filas cuyo estado en 'AUX' sea "listo" y aún no tengan marca de tiempo
      if (estado !== 'listo' || procesado) return;

      const cliente = String(rowRaw[iCliente] || '').trim();
      if (!cliente) return;

      const numero = String(rowRaw[iNumero] || '').trim();
      const fecha = (iFecha !== -1 && rowRaw[iFecha]) ? new Date(rowRaw[iFecha]) : new Date();

      let map = rowToMap_(rowRaw, headers, rowDisp);
      map['fecha'] = fecha;
      map = enrichMap_(map); 
      createAliases_(map);

      const pdfMeta = fusionarYExportarPDF_(headers, rowRaw, cliente, numero, fecha, rootFolder, map);

      const telCliente = String(map.telefono || '');
      const waNum = pickWaNumber_(telCliente, CONFIG.WA_FALLBACK);
      const nombre = String(map.cliente_nombre || 'Cliente').trim();
      const nroTxt = numero ? ` ${numero}` : '';
      
      // Mensaje estandarizado para eliminar fricción y errores de tono en el contacto por WhatsApp
      const msg = `Hola ${nombre}, te envío tu presupuesto${nroTxt}: ${pdfMeta.url}`;
      const waUrl = `https://wa.me/${encodeURIComponent(waNum)}?text=${encodeURIComponent(msg)}`;
      
      const xid = (iXid !== -1) ? String(rowDisp[iXid] || rowRaw[iXid] || '').trim() : '';
      const webUrl = xid ? `${CONFIG.WEBAPP_URL}?xid=${encodeURIComponent(xid)}` : '';

      sh.getRange(absoluteRow, iPdfUrl + 1).setValue(pdfMeta.url);
      sh.getRange(absoluteRow, iWaLink + 1).setValue(waUrl);
      sh.getRange(absoluteRow, iWebLink + 1).setValue(webUrl);
      sh.getRange(absoluteRow, iProcesado + 1).setValue(timestamp);

    } catch (e) {
      console.error(`Error FATAL en fila ${absoluteRow}: ${e.message}`, e);
    }
  });
}

/* =========================================
   4. LÓGICA DE NEGOCIO (PDF & CARPETAS)
   ========================================= */

function fusionarYExportarPDF_(headers, rowRaw, cliente, numero, fecha, rootFolder, map) {
  const mes = fecha.toLocaleString('es-AR', { month: 'long' });
  const fCliente = getOrCreateByName_(rootFolder, cleanFolderName_(cliente));
  const fMes     = getOrCreateByName_(fCliente, mes);

  const baseName = `Presupuesto_${numero || 'SIN-NRO'}_${sanitize_(cliente)}.pdf`;
  const existing = findOrDedupByName_(fMes, baseName);
  
  if (existing) {
    makePublic_(existing);
    return { id: existing.getId(), url: existing.getUrl(), name: existing.getName() };
  }

  const baseNameTmp = `Presupuesto_${numero || 'SIN-NRO'}_${sanitize_(cliente)}`;
  const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_ID);
  const tmpCopy = templateFile.makeCopy(`${baseNameTmp} (tmp)`, fMes);
  
  let pres = null;
  try {
    pres = SlidesApp.openById(tmpCopy.getId());
    
    // Soporte dual de tokens: {{variable}} (estándar actual) y <<variable>> (retrocompatibilidad)
    replaceAll_(pres, map, ['{{','}}']);
    replaceAll_(pres, map, ['<<','>>']);

    if (map['qr_maps_url']) {
      insertQr_(pres, String(map['qr_maps_url']), '{{QR_MAPS}}');
    }
    try { pres.replaceAllText('{{QR_LINK}}', ''); } catch(_){}

    pres.saveAndClose();
    Utilities.sleep(1500);

    const pdfBlob = exportToPdfWithRetry_(tmpCopy, baseName);
    const pdfFile = fMes.createFile(pdfBlob);
    makePublic_(pdfFile);
    
    return { id: pdfFile.getId(), url: pdfFile.getUrl(), name: pdfFile.getName() };

  } finally {
    if (pres) try { pres.saveAndClose(); } catch(_) {}
    try { tmpCopy.setTrashed(true); } catch(_) {}
  }
}

/* =========================================
   5. HELPERS Y REGLAS DE NORMALIZACIÓN (POKA-YOKE)
   ========================================= */

function insertQr_(presentation, url, placeholder) {
  if (!url) return;
  try {
    const slides = presentation.getSlides();
    for (const slide of slides) {
      const shapes = slide.getShapes();
      for (const shape of shapes) {
        const txt = shape.getText ? shape.getText().asString().trim() : '';
        if (txt === placeholder) {
          const x = shape.getLeft(), y = shape.getTop(), w = shape.getWidth(), h = shape.getHeight();
          const targetPx = Math.max(800, Math.min(1600, Math.ceil(Math.max(w, h) * 8)));
          const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?format=png&ecc=H&qzone=4&size=' + targetPx + 'x' + targetPx + '&data=' + encodeURIComponent(url);
          const imgBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName('qr.png');
          
          const img = slide.insertImage(imgBlob);
          img.setLeft(x).setTop(y).setWidth(w).setHeight(h);
          try { img.setLinkUrl(url); } catch (_) {}
          shape.remove();
        }
      }
    }
  } catch (e) { console.warn("Error QR:", e); }
}

function readSheetFull_(sh) {
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn(), startRow = 2; 
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (lastRow < 2) return { headers, raw: [], disp: [], startRow: 2 };
  const numRows = (lastRow - startRow) + 1;
  const raw = sh.getRange(startRow, 1, numRows, lastCol).getValues();
  const disp = sh.getRange(startRow, 1, numRows, lastCol).getDisplayValues();
  return { headers, raw, disp, startRow };
}

function ensureColumn_(sh, headers, name) {
  const newCol = sh.getLastColumn() + 1;
  sh.getRange(1, newCol).setValue(name);
  headers.push(name);
  return headers.length - 1;
}

function rowToMap_(rowRaw, headers, rowDisp) {
  const o = {};
  headers.forEach((h, i) => {
    let v = rowDisp ? rowDisp[i] : rowRaw[i];
    if (v == null) v = '';
    o[h] = v;
  });
  return o;
}

function createAliases_(map) {
  for (let i = 1; i <= 12; i++) {
    if (map[`importe_${i}`]) map[`im_${i}`] = map[`importe_${i}`]; else if (!map[`im_${i}`]) map[`im_${i}`] = '';
    if (map[`unitario_${i}`]) map[`un_${i}`] = map[`unitario_${i}`]; else if (!map[`un_${i}`]) map[`un_${i}`] = '';
  }
}

function enrichMap_(map) {
  if (map['fecha']) {
    try {
      const d = (map['fecha'] instanceof Date) ? map['fecha'] : new Date(map['fecha']);
      map['fecha'] = Utilities.formatDate(d, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
    } catch (_) { map['fecha'] = String(map['fecha']); }
  }

  for (let i = 1; i <= 12; i++) {
    ['cant_', 'descripcion_', 'unitario_', 'importe_'].forEach(p => { if (!map[p + i]) map[p + i] = ''; });
  }

  // Normalización inteligente de unidades: distingue venta a granel (Litros -> "L") vs envasado ("un.")
  // Incluye tolerancia a errores de tipeo frecuentes en mostrador (ej. "litos", "ltrs", "lts")
  for (let i = 1; i <= 12; i++) {
    const k = 'cant_' + i;
    if (map[k]) {
      let s = String(map[k]).trim().replace(/,/g, '.');
      const regexLitros = /\s*(?:litros?|litos?|ltrs?|lts?|lt?)\.?$/i;
      if (regexLitros.test(s)) { s = s.replace(regexLitros, ' L'); }
      else { if (!isNaN(parseFloat(s))) s = s + ' un.'; }
      map[k] = s;
    }
  }

  for (let i = 1; i <= 12; i++) {
    if (map['importe_' + i]) map['importe_' + i] = formatMoneyNoRound_(map['importe_' + i]);
    if (map['unitario_' + i]) map['unitario_' + i] = formatMoneyNoRound_(map['unitario_' + i]);
  }
  if (map['TOTAL']) map['TOTAL'] = formatMoneyNoRound_(map['TOTAL']);
  
  FORCE_TEXT_COLS.forEach(c => { if (map[c]) map[c] = String(map[c]); });
  if (map['vehiculo_km']) map['vehiculo_km'] = String(map['vehiculo_km']);

  return map;
}

function formatMoneyNoRound_(v) {
  if (v == null || v === '') return '';
  const orig = String(v).trim();
  const m = orig.match(/(-?\d{1,3}(?:[.\s]\d{3})*|-?\d+)(?:[.,](\d+))?/);
  if (!m) return '$ ' + (parseFloat(orig.replace(/[^\d.-]/g,'')) || 0);

  let intRaw = m[1].replace(/[.\s]/g, '');
  let decRaw = m[2] || '';
  const intFmt = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const showDec = decRaw && !/^0+$/.test(decRaw);
  const isSmallNumber = Math.abs(parseInt(intRaw)) < 1000;

  if (showDec) return '$ ' + intFmt + ',' + decRaw;
  else if (isSmallNumber) return '$ ' + intFmt + ',00';
  else return '$ ' + intFmt;
}

function getOrCreatePath_(arr) {
  let p = DriveApp.getRootFolder();
  arr.forEach(n => p = getOrCreateByName_(p, n));
  return p;
}
function getOrCreateByName_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function cleanFolderName_(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
function sanitize_(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_').trim();
}
function replaceAll_(pres, map, delims) {
  const [open, close] = delims;
  Object.keys(map).forEach(k => { try { pres.replaceAllText(open + k + close, String(map[k] ?? '')); } catch (_) {} });
}
function exportToPdfWithRetry_(file, name) {
  let blob = null;
  for (let i = 0; i < 3; i++) {
    try {
      blob = file.getAs(MimeType.PDF).setName(name);
      if (blob.getBytes().length > 0) return blob;
    } catch (_) {}
    Utilities.sleep(1000);
  }
  throw new Error('Falló exportación PDF');
}
function makePublic_(file) { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {} }
function findOrDedupByName_(folder, name) {
  const it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}
function pickWaNumber_(tel, fallback) {
  if (!tel) return fallback;
  let s = String(tel).replace(/[^\d]/g, '');
  if (s.startsWith('549')) return s;
  if (s.startsWith('54') && s.length === 12) return '549' + s.slice(2);
  if (s.length >= 10) return '549' + s; 
  return fallback;
}
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Presupuestos Expert')
    .addItem('Procesar nuevos (Manual)', 'generarPDFsNuevos')
    .addItem('Configurar Trigger (1 min)', 'activarAutoPDF_cadaMinuto')
    .addItem('Diagnóstico Hoja', 'diagnosticarHojaAUX')
    .addToUi();
}
function diagnosticarHojaAUX() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) { console.log("No encuentro la hoja AUX"); return; }
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const formulas = sh.getRange(2, 1, 1, lastCol).getFormulas()[0];
  const values = sh.getRange(2, 1, 1, lastCol).getDisplayValues()[0];
  let reporte = "=== DIAGNÓSTICO ===\n\n";
  headers.forEach((h, i) => { if (h) reporte += `COLUMNA: ${h}\n   Fórmula: ${formulas[i] || "(Manual)"}\n   Valor: ${values[i]}\n----------------\n`; });
  console.log(reporte);
}
