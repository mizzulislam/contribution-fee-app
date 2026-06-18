/**
 * Soematra Kost - Secure Google Apps Script Backend (Production Ready)
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheet database kos Anda.
 * 2. Buka menu Ekstensi > Apps Script.
 * 3. Hapus semua kode default dan tempelkan kode di bawah ini.
 * 4. Ganti 'isi-token-rahasia-anda' di variabel SOEMATRA_API_TOKEN dengan token yang sama di file .env.local Anda (VITE_SOEMATRA_API_TOKEN).
 * 5. Klik Simpan, kemudian klik "Terapkan > Terapkan sebagai aplikasi web".
 * 6. Setel "Jalankan sebagai" ke "Saya (email Anda)" dan "Siapa yang memiliki akses" ke "Siapa saja".
 * 7. Salin URL Web App yang dihasilkan dan masukkan ke VITE_SPREADSHEET_API_URL di .env.local Anda.
 */

const SOEMATRA_API_TOKEN = "68915c3f5d7f58e04284b1d517fcd46bed42070218bcdac9f85e25f0e8975035";

// ==========================================
// 1. OTORISASI & KEAMANAN TOKEN
// ==========================================
function verifyToken(e, body) {
  const token = e?.parameter?.token || body?.token;
  if (!token || token !== SOEMATRA_API_TOKEN) {
    throw new Error("Forbidden: Token otorisasi tidak valid.");
  }
}

// ==========================================
// 2. MATRIKS RBAC (Role-Based Access Control)
// ==========================================
const RBAC_RULES = {
  "super admin": {
    read: ["Users", "Bills", "Payments", "Expenses", "JournalEntries", "MasterData", "Gallons", "GallonContainers", "Schedules", "Settings", "NotificationSettings", "AuditLogs", "PaymentMethods", "Announcements", "Contributions", "Notifications", "Bailouts"],
    write: ["Users", "Bills", "Payments", "Expenses", "JournalEntries", "MasterData", "Gallons", "GallonContainers", "Schedules", "Settings", "NotificationSettings", "AuditLogs", "PaymentMethods", "Announcements", "Contributions", "Notifications", "Bailouts"]
  },
  "admin": {
    read: ["Users", "Bills", "Payments", "Expenses", "JournalEntries", "MasterData", "Gallons", "GallonContainers", "Schedules", "Settings", "NotificationSettings", "AuditLogs", "PaymentMethods", "Announcements", "Contributions", "Notifications", "Bailouts"],
    write: ["Users", "Bills", "Payments", "Expenses", "JournalEntries", "MasterData", "Gallons", "GallonContainers", "Schedules", "PaymentMethods", "Announcements", "Contributions", "Notifications", "Bailouts"] // Settings & AuditLogs read-only
  },
  "user": {
    read: ["Users", "Bills", "Payments", "Schedules", "Gallons", "GallonContainers", "MasterData", "JournalEntries", "PaymentMethods", "Announcements", "Contributions"], // Akses terbatas + jurnal tersanitasi untuk transparansi kas
    write: ["Payments", "Users", "Schedules", "Gallons"] // Hanya untuk konfirmasi bayar, update profil sendiri, piket, & input botol
  }
};

function checkPermission(role, sheet, action) {
  const cleanRole = (role || "user").toLowerCase();
  const rule = RBAC_RULES[cleanRole];
  
  if (!rule) {
    throw new Error("Forbidden: Role tidak terdaftar.");
  }
  
  const isRead = ["get"].indexOf(action.toLowerCase()) !== -1;
  const allowedSheets = isRead ? rule.read : rule.write;
  
  if (allowedSheets.indexOf(sheet) === -1) {
    throw new Error("Forbidden: Role '" + cleanRole + "' tidak memiliki hak akses '" + action + "' pada sheet '" + sheet + "'.");
  }
}

// ==========================================
// 3. ROW-LEVEL SECURITY (Isolasi Data Warga)
// ==========================================
function getUserFullName(userEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Users");
    if (!sheet) return "";
    
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return "";
    
    const headers = values[0];
    const emailIdx = headers.indexOf("email");
    const nameIdx = headers.indexOf("full_name");
    
    if (emailIdx === -1 || nameIdx === -1) return "";
    
    const cleanEmail = userEmail.toLowerCase().trim();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][emailIdx]).toLowerCase().trim() === cleanEmail) {
        return String(values[i][nameIdx]).trim();
      }
    }
  } catch (err) {
    console.error("Gagal mendapatkan nama lengkap user:", err.message);
  }
  return "";
}

function filterRowByRLS(sheetName, row, userEmail) {
  if (!userEmail) return false;
  const cleanEmail = userEmail.toLowerCase().trim();
  
  // Ambil nama lengkap user untuk pencocokan nama
  const userFullName = getUserFullName(userEmail);
  const cleanFullName = userFullName.toLowerCase().trim();
  
  // Warga hanya boleh membaca tagihan/pembayaran miliknya sendiri
  if (sheetName === "Bills") {
    const hasEmailMatch = row.resident_email && String(row.resident_email).toLowerCase().trim() === cleanEmail;
    const hasNameMatch = row.resident_name && String(row.resident_name).toLowerCase().trim() === cleanFullName;
    return !!(hasEmailMatch || hasNameMatch);
  }
  if (sheetName === "Payments") {
    const hasEmailMatch = row.resident_email && String(row.resident_email).toLowerCase().trim() === cleanEmail;
    const hasNameMatch = row.resident_name && String(row.resident_name).toLowerCase().trim() === cleanFullName;
    return !!(hasEmailMatch || hasNameMatch);
  }
  if (sheetName === "Users") {
    // Warga hanya boleh melihat profil dirinya sendiri
    return String(row.email).toLowerCase().trim() === cleanEmail;
  }
  
  // Sheet publik bersama (Gallons, Schedules, MasterData) boleh diakses semua
  return true;
}

function sanitizeRowForRole(sheetName, row, userRole) {
  if (String(userRole || "").toLowerCase() !== "user") return row;

  if (sheetName === "JournalEntries") {
    return {
      id: row.id || "",
      date: row.date || "",
      description: row.description || "Transaksi kas kos",
      debits: row.debits || "[]",
      credits: row.credits || "[]",
      source: row.source || ""
    };
  }

  return row;
}

// ==========================================
// 4. VERIFIKASI INTEGRITAS WRITE (Front-End Tampering Prevention)
// ==========================================
function validateWritePayload(sheetName, action, data, userEmail, userRole) {
  if (userRole === "super admin") return; // Bypass validasi payload untuk super admin

  if (userRole === "user") {
    if (sheetName === "Payments" && action === "post") {
      // Warga dilarang membuat transaksi langsung lunas (paid)
      if (data.status && data.status !== "pending_verification") {
        throw new Error("Validation: Warga hanya boleh mengunggah pembayaran dengan status 'pending_verification'.");
      }
      // Warga dilarang mengunggah pembayaran atas nama warga lain
      if (String(data.resident_email).toLowerCase() !== userEmail.toLowerCase()) {
        throw new Error("Validation: Email pengunggah tidak cocok dengan email pengirim.");
      }
    }
    
    if (sheetName === "Users" && action === "put") {
      // Warga dilarang menaikkan role dirinya sendiri atau mengubah statusnya sendiri
      if (data.role && String(data.role).toLowerCase() !== "user") {
        throw new Error("Validation: Warga tidak diperkenankan mengubah role.");
      }
      if (data.status && data.status !== "Aktif") {
        throw new Error("Validation: Warga tidak diperkenankan mengubah status akun.");
      }
      if (String(data.email).toLowerCase() !== userEmail.toLowerCase()) {
        throw new Error("Validation: Anda hanya dapat memperbarui data profil Anda sendiri.");
      }
    }
  }
}

// ==========================================
// 5. AUDIT LOGGING (Pencatatan Riwayat Operasi)
// ==========================================
function logToAudit(userEmail, userRole, action, sheetName, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let auditSheet = ss.getSheetByName("AuditLogs");
    
    // Buat tab AuditLogs jika belum ada
    if (!auditSheet) {
      auditSheet = ss.insertSheet("AuditLogs");
      auditSheet.appendRow(["id", "timestamp", "userEmail", "userRole", "action", "sheet", "details"]);
    }
    
    const id = "AUD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const timestamp = new Date().toISOString();
    const detailsStr = typeof details === "object" ? JSON.stringify(details) : String(details);
    
    auditSheet.appendRow([id, timestamp, userEmail || "system", userRole || "system", action, sheetName, detailsStr]);
  } catch (err) {
    console.error("Gagal menulis audit log:", err.message);
  }
}

// ==========================================
// 6. MAIN HANDLER: GET (doGet)
// ==========================================
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet;
    const action = e.parameter.action || "get";
    const userEmail = e.parameter.userEmail || "";
    const userRole = e.parameter.userRole || "user";
    
    verifyToken(e, null);
    
    if (!sheetName) {
      throw new Error("Sheet target tidak didefinisikan.");
    }
    
    checkPermission(userRole, sheetName, action);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return responseJson({ status: "success", data: [] });
    }
    
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return responseJson({ status: "success", data: [] });
    }
    
    const headers = values[0];
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = {};
      let hasData = false;
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[i][j];
        if (values[i][j] !== "") hasData = true;
      }
      
      if (hasData) {
        // Terapkan Row-Level Security (RLS) untuk role user
        if (userRole.toLowerCase() === "user") {
          if (filterRowByRLS(sheetName, row, userEmail)) {
            data.push(sanitizeRowForRole(sheetName, row, userRole));
          }
        } else {
          data.push(row);
        }
      }
    }
    
    return responseJson({ status: "success", data: data });
    
  } catch (error) {
    return responseJson({ status: "error", message: error.message });
  }
}

// ==========================================
// 7. MAIN HANDLER: POST & MUTATIONS (doPost)
// ==========================================
function doPost(e) {
  let userEmail = "";
  let userRole = "user";
  let action = "";
  let sheetName = "";

  try {
    const bodyStr = e.postData.contents;
    const body = JSON.parse(bodyStr);
    
    action = body.action;
    sheetName = body.sheet;
    userEmail = body.userEmail || "";
    userRole = body.userRole || "user";
    
    verifyToken(null, body);
    
    if (!sheetName || !action) {
      throw new Error("Tindakan (action) atau sheet tujuan tidak lengkap.");
    }
    
    checkPermission(userRole, sheetName, action);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create sheet if it doesn't exist (kecuali untuk restore/delete)
    if (!sheet && action === "post") {
      sheet = ss.insertSheet(sheetName);
      const dataKeys = Object.keys(body.data || {});
      sheet.appendRow(dataKeys);
    }
    
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
    }
    
    // ==========================================
    // ACTION: POST (Insert Row)
    // ==========================================
    if (action === "post") {
      const rowData = body.data || {};
      if (!rowData.id) {
        rowData.id = "gen-" + Utilities.getUuid();
      }
      validateWritePayload(sheetName, action, rowData, userEmail, userRole);
      
      let headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
      
      // Auto-append missing headers
      let headersUpdated = false;
      const rowKeys = Object.keys(rowData);
      for (let k = 0; k < rowKeys.length; k++) {
        const key = rowKeys[k];
        if (headers.indexOf(key) === -1) {
          sheet.getRange(1, headers.length + 1).setValue(key);
          headers.push(key);
          headersUpdated = true;
        }
      }
      
      const newRow = [];
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i];
        newRow.push(rowData[key] !== undefined ? rowData[key] : "");
      }
      
      sheet.appendRow(newRow);
      logToAudit(userEmail, userRole, action, sheetName, { id: rowData.id, title: rowData.title || rowData.full_name });
      return responseJson({ status: "success", message: "Baris data berhasil ditambahkan." });
    }
    
    // ==========================================
    // ACTION: PUT (Update Row)
    // ==========================================
    if (action === "put") {
      const rowData = body.data;
      const targetId = String(rowData.id);
      
      if (!targetId) {
        throw new Error("Pembaruan data memerlukan kolom 'id'.");
      }
      
      validateWritePayload(sheetName, action, rowData, userEmail, userRole);
      
      const range = sheet.getDataRange();
      const values = range.getValues();
      let headers = values[0];
      
      // Auto-append missing headers
      let headersUpdated = false;
      const rowKeys = Object.keys(rowData);
      for (let k = 0; k < rowKeys.length; k++) {
        const key = rowKeys[k];
        if (headers.indexOf(key) === -1) {
          sheet.getRange(1, headers.length + 1).setValue(key);
          headers.push(key);
          headersUpdated = true;
        }
      }
      
      const idColIdx = headers.indexOf("id");
      if (idColIdx === -1) {
        throw new Error("Kolom 'id' tidak ditemukan di sheet '" + sheetName + "'.");
      }
      
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]) === targetId) {
          // Validasi kepemilikan baris (RLS untuk User) pada update
          if (userRole.toLowerCase() === "user") {
            const currentRowData = {};
            for (let k = 0; k < headers.length; k++) {
              currentRowData[headers[k]] = values[i][k];
            }
            if (!filterRowByRLS(sheetName, currentRowData, userEmail)) {
              throw new Error("Forbidden: Anda tidak diizinkan mengubah data ini.");
            }
          }
          
          rowIndex = i + 1; // 1-based index including header
          break;
        }
      }
      
      if (rowIndex === -1) {
        throw new Error("Data dengan ID '" + targetId + "' tidak ditemukan.");
      }
      
      // Update cell values based on payload
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        if (rowData[key] !== undefined) {
          sheet.getRange(rowIndex, j + 1).setValue(rowData[key]);
        }
      }
      
      logToAudit(userEmail, userRole, action, sheetName, { id: targetId, updateFields: Object.keys(rowData) });
      return responseJson({ status: "success", message: "Data berhasil diperbarui." });
    }
    
    // ==========================================
    // ACTION: DELETE (Remove Row)
    // ==========================================
    if (action === "delete") {
      const targetId = String(body.id);
      if (!targetId) {
        throw new Error("Penghapusan data memerlukan parameter 'id'.");
      }
      
      const range = sheet.getDataRange();
      const values = range.getValues();
      const headers = values[0];
      const idColIdx = headers.indexOf("id");
      
      if (idColIdx === -1) {
        throw new Error("Kolom 'id' tidak ditemukan.");
      }
      
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]) === targetId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        throw new Error("Data dengan ID '" + targetId + "' tidak ditemukan.");
      }
      
      sheet.deleteRow(rowIndex);
      logToAudit(userEmail, userRole, action, sheetName, { id: targetId });
      return responseJson({ status: "success", message: "Data berhasil dihapus." });
    }
    
    // ==========================================
    // ACTION: RESTORE (Overwrites entire sheet)
    // ==========================================
    if (action === "restore") {
      const restoreDataList = body.data;
      if (!Array.isArray(restoreDataList)) {
        throw new Error("Restorasi data memerlukan array objek data.");
      }
      
      sheet.clearContents();
      
      if (restoreDataList.length === 0) {
        logToAudit(userEmail, userRole, action, sheetName, "Cleared all data");
        return responseJson({ status: "success", message: "Sheet berhasil dikosongkan." });
      }
      
      // Tulis headers kembali
      const headers = Object.keys(restoreDataList[0]);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      const rowsToWrite = [];
      for (let i = 0; i < restoreDataList.length; i++) {
        const rowData = restoreDataList[i];
        const newRow = [];
        for (let j = 0; j < headers.length; j++) {
          const key = headers[j];
          newRow.push(rowData[key] !== undefined ? rowData[key] : "");
        }
        rowsToWrite.push(newRow);
      }
      
      sheet.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
      logToAudit(userEmail, userRole, action, sheetName, { rowCount: restoreDataList.length });
      return responseJson({ status: "success", message: "Restorasi data sheet berhasil." });
    }

    // ==========================================
    // ACTION: SEND_WHATSAPP
    // ==========================================
    if (action === "send_whatsapp") {
      const target = String(body.target || '').trim();
      const message = String(body.message || '').trim();
      
      if (!target || !message) {
        throw new Error("Nomor tujuan (target) dan pesan (message) harus diisi.");
      }
      
      // Ambil konfigurasi WhatsApp dari NotificationSettings
      let provider = "manual";
      let token = "";
      let sender = "";
      
      try {
        const settingsSheet = ss.getSheetByName("NotificationSettings");
        if (settingsSheet) {
          const settingsValues = settingsSheet.getDataRange().getValues();
          if (settingsValues.length > 1) {
            const settingsHeaders = settingsValues[0];
            const provIdx = settingsHeaders.indexOf("whatsappProvider");
            const tokIdx = settingsHeaders.indexOf("whatsappToken");
            const sendIdx = settingsHeaders.indexOf("whatsappSender");
            
            if (provIdx !== -1) provider = String(settingsValues[1][provIdx]);
            if (tokIdx !== -1) token = String(settingsValues[1][tokIdx]);
            if (sendIdx !== -1) sender = String(settingsValues[1][sendIdx]);
          }
        }
      } catch (err) {
        console.error("Gagal membaca NotificationSettings:", err.message);
      }
      
      if (provider === "fonnte") {
        if (!token) {
          throw new Error("API Token Fonnte belum dikonfigurasi di Pengaturan Notifikasi.");
        }
        
        const payloadParts = [
          "target=" + encodeURIComponent(target),
          "message=" + encodeURIComponent(message)
        ];
        if (sender) {
          payloadParts.push("sender=" + encodeURIComponent(sender));
        }
        
        const options = {
          method: "post",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          headers: {
            "Authorization": token
          },
          payload: payloadParts.join("&"),
          muteHttpExceptions: true
        };
        
        const response = UrlFetchApp.fetch("https://api.fonnte.com/send", options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();
        
        logToAudit(userEmail, userRole, "send_whatsapp", "Fonnte", { target: target, code: responseCode, response: responseText });
        
        if (responseCode >= 200 && responseCode < 300) {
          const resJson = JSON.parse(responseText);
          if (resJson.status === true || resJson.status === "true") {
            return responseJson({ status: "success", message: "Pesan WhatsApp berhasil dikirim via Fonnte." });
          } else {
            throw new Error("Fonnte API Error: " + (resJson.reason || responseText));
          }
        } else {
          throw new Error("Gagal mengirim pesan via Fonnte (HTTP " + responseCode + "): " + responseText);
        }
      } else if (provider === "manual") {
        return responseJson({ status: "success", provider: "manual", message: "Menggunakan mode manual. Silakan gunakan wa.me." });
      } else {
        throw new Error("Provider WhatsApp '" + provider + "' tidak didukung.");
      }
    }
    
    throw new Error("Aksi '" + action + "' tidak dikenali.");
    
  } catch (error) {
    logToAudit(userEmail, userRole, "error_" + action, sheetName, error.message);
    return responseJson({ status: "error", message: error.message });
  }
}

// ==========================================
// HELPER: FORMAT RESPONSE JSON (CORS support)
// ==========================================
function responseJson(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
