function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Previene colisiones si dos personas envían al mismo tiempo

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la hoja está vacía, creamos los encabezados automáticamente
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha Envíi", "Ticket ID", "Nombres", "Apellidos", "Género", 
        "Fecha Nacimiento", "Distrito", "Teléfono", 
        "Tarjeta Básico", "Tarjeta Intermedio", "Tarjeta Avanzado",
        "Volante Básico", "Volante Intermedio", "Volante Avanzado", "Portafolio"
      ]);
    }

    var rows = sheet.getDataRange().getValues();
    var telefonoIndex = 7; // Columna H (Teléfono)
    var rowIndexToUpdate = -1;

    // Buscar si el teléfono ya está registrado (omitimos la fila 0 de encabezados)
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][telefonoIndex]) === String(data.telefono)) {
        rowIndexToUpdate = i + 1; // Las filas en Sheets empiezan en 1
        break;
      }
    }

    var rowData = [
      new Date(),
      data.ticketId,
      data.nombres,
      data.apellidos,
      data.genero,
      data.fechaNacimiento,
      data.distrito,
      "'" + data.telefono, // Apostrofe para forzar formato texto en el teléfono
      data.tarjetaBasico,
      data.tarjetaIntermedio,
      data.tarjetaAvanzado,
      data.volanteBasico,
      data.volanteIntermedio,
      data.volanteAvanzado,
      data.portafolio
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

    return ContentService.createTextOutput(JSON.stringify({ result: "success", updated: updated }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("El endpoint está activo y listo para recibir envíos (POST).")
    .setMimeType(ContentService.MimeType.TEXT);
}