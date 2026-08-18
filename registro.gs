/**
 * REGISTRO OFICIAL DE DISEÑADORES — Backend Google Apps Script
 * ============================================================
 * Maneja el guardado seguro, actualización sin duplicados y
 * sanitización de datos enviados desde el formulario web (registro.html).
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    // Intentar adquirir el bloqueo hasta por 10 segundos para evitar colisiones
    hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return ContentService.createTextOutput(JSON.stringify({
        result: "error",
        message: "El servidor está ocupado procesando otros registros. Intenta nuevamente en unos segundos."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        result: "error",
        message: "Datos de formulario inválidos o vacíos."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Si la hoja está vacía, creamos los encabezados automáticamente
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha de envío", "Nombres", "Apellidos", "Género", 
        "Fecha de nacimiento", "Distrito", "Teléfono", 
        "Tarjeta (básico)", "Tarjeta (complejo)",
        "Volante (básico)", "Volante (complejo)", "Portafolio"
      ]);
    }

    // Función de sanitización para prevenir inyección de fórmulas en Google Sheets (=, +, -, @)
    function sanitizeCell(val) {
      if (val === null || val === undefined) return "";
      var str = String(val).trim();
      if (str === "") return "";
      if (/^[=+\-@]/.test(str)) {
        return "'" + str;
      }
      return str;
    }

    var cleanPhone = String(data.telefono || "").replace(/\D/g, "");
    var rows = sheet.getDataRange().getValues();
    var telefonoIndex = 6; // Columna G (Teléfono)
    var rowIndexToUpdate = -1;

    // Buscar si el teléfono ya está registrado (omitimos encabezado en índice 0)
    for (var i = 1; i < rows.length; i++) {
      var existingPhone = String(rows[i][telefonoIndex] || "").replace(/\D/g, "");
      if (existingPhone === cleanPhone && cleanPhone.length > 0) {
        rowIndexToUpdate = i + 1; // Las filas en Sheets son 1-indexed
        break;
      }
    }

    // Fecha exacta en zona horaria de Perú
    var fechaEnvio = Utilities.formatDate(new Date(), "America/Lima", "yyyy-MM-dd HH:mm:ss");

    var rowData = [
      fechaEnvio,
      sanitizeCell(data.nombres),
      sanitizeCell(data.apellidos),
      sanitizeCell(data.genero),
      sanitizeCell(data.fechaNacimiento),
      sanitizeCell(data.distrito),
      "'" + cleanPhone, // Prefijo ' para forzar que Sheets lo trate como texto sin perder formato
      sanitizeCell(data.tarjetaBasico),
      sanitizeCell(data.tarjetaComplejo),
      sanitizeCell(data.volanteBasico),
      sanitizeCell(data.volanteComplejo),
      sanitizeCell(data.portafolio)
    ];

    var updated = false;
    if (rowIndexToUpdate !== -1) {
      // Sobrescribir fila existente
      sheet.getRange(rowIndexToUpdate, 1, 1, rowData.length).setValues([rowData]);
      updated = true;
    } else {
      // Insertar nueva fila al final
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      updated: updated
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function doGet(e) {
  return ContentService.createTextOutput("El endpoint de OFICIAL está activo y listo para recibir envíos (POST).")
    .setMimeType(ContentService.MimeType.TEXT);
}