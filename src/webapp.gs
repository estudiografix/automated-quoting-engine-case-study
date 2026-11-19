/**
 * @fileoverview Backend de la WebApp Post-Envío (doGet + Polling Asíncrono) v6.0 - Self-Healing Name
 * @role Senior Product Designer & DesignOps Builder
 */

const WEB_CONF = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE', 
  SHEET_NAME: 'AUX',
  TEMPLATE_HTML: 'postenvio',
  COL_ATENDIDO: 'atendido', 
  COL_CLIENTE:  'cliente_nombre',
  COL_PDF:      'pdf_url',
  COL_WA:       'whatsapp_link_envio'
};

function doGet(e) {
  const p = e?.parameter || {};
  const xid = p.xid ? String(p.xid).trim() : '';
  
  let viewData = {
    nombre:   p.nombre || '',
    atendido: p.atendido || '',
    pdf:      p.pdf ? String(p.pdf).trim() : '',
    wa:       p.wa  ? String(p.wa).trim()  : '',
    msg:      p.msg ? String(p.msg).trim() : ''
  };

  if (xid) {
    try {
      const dataFound = lookupDataByXid_(xid);
      if (dataFound) {
        viewData.nombre   = viewData.nombre   || dataFound.nombreCliente;
        viewData.atendido = viewData.atendido || dataFound.atendido;
        viewData.pdf      = viewData.pdf      || dataFound.pdf;
        viewData.wa       = viewData.wa       || dataFound.wa;
        viewData.msg      = viewData.msg      || dataFound.msg;
      }
    } catch (err) {
      console.warn("Lectura inicial fallida:", err);
    }
  }

  const nombrePantalla = (viewData.atendido && viewData.atendido !== '') ? viewData.atendido : 'Equipo';

  let waFinalUrl = '';
  if (viewData.wa) {
    waFinalUrl = `https://wa.me/${encodeURIComponent(viewData.wa)}`;
    if (viewData.msg) waFinalUrl += `?text=${encodeURIComponent(viewData.msg)}`;
  }

  const t = HtmlService.createTemplateFromFile(WEB_CONF.TEMPLATE_HTML);
  t.nombre = nombrePantalla;
  t.pdfUrl = viewData.pdf; 
  t.waUrl  = waFinalUrl;
  t.xid    = xid; 

  return t.evaluate()
          .setTitle('Presupuesto Listo')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint consultado cada 4 segundos por el frontend (postenvio.html)
 * hasta que el trigger de Apps Script termina de generar el PDF en Google Drive.
 */
function pollData(xid) {
  try {
    const data = lookupDataByXid_(xid);
    
    if (!data || !data.pdf || data.pdf === '') {
      return { ready: false };
    }

    let waFinalUrl = '';
    if (data.wa) {
      waFinalUrl = `https://wa.me/${encodeURIComponent(data.wa)}`;
      if (data.msg) waFinalUrl += `?text=${encodeURIComponent(data.msg)}`;
    }

    // Self-Healing UI: devuelve el nombre del operador una vez que la hoja AUX terminó de procesar
    const nombreFinal = (data.atendido && data.atendido !== '') ? data.atendido : 'Equipo';

    return {
      ready: true,
      pdfUrl: data.pdf,
      waUrl: waFinalUrl,
      nombre: nombreFinal
    };
  } catch (e) {
    return { ready: false };
  }
}

function lookupDataByXid_(xid) {
  if (!xid) return null;
  
  const ss = SpreadsheetApp.openById(WEB_CONF.SHEET_ID);
  const sh = ss.getSheetByName(WEB_CONF.SHEET_NAME);
  if (!sh) return null;

  const finder = sh.createTextFinder(xid).matchEntireCell(true);
  const result = finder.findNext();
  if (!result) return null;

  const rowIdx = result.getRow();
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const rowValues = sh.getRange(rowIdx, 1, 1, lastCol).getDisplayValues()[0];
  
  const headersNorm = headers.map(h => String(h).trim().toLowerCase());

  const getVal = (colName) => {
    const idx = headersNorm.indexOf(colName.toLowerCase());
    return (idx !== -1) ? rowValues[idx] : '';
  };

  const nombreCliente = getVal(WEB_CONF.COL_CLIENTE);
  const atendido      = getVal(WEB_CONF.COL_ATENDIDO);
  const pdf           = getVal(WEB_CONF.COL_PDF);
  const waLink        = getVal(WEB_CONF.COL_WA);

  let wa = '', msg = '';
  if (waLink) {
    const match = waLink.match(/wa\.me\/([^?]+)(?:\?text=(.*))?/);
    if (match) {
      wa = decodeURIComponent(match[1]);
      msg = match[2] ? decodeURIComponent(match[2]) : '';
    }
  }

  return { nombreCliente, atendido, pdf, wa, msg };
}
