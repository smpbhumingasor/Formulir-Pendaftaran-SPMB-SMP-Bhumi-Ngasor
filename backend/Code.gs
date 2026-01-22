
/**
 * BACKEND VERSI PRO (DENGAN EMAIL NOTIFIKASI)
 * ID Spreadsheet: 1iBTqITWql4_AXHL0dGYojPdnj2C3vCQp3abCbSpab3E
 * ID Folder: 1xYD8hRam6RYPyfEWYKSKWsdZYpjY60Yh
 */

// GANTI EMAIL INI DENGAN EMAIL ADMIN SEKOLAH (Bisa dipisah koma jika lebih dari 1)
var EMAIL_ADMIN = "smpbhumingasor@gmail.com"; 

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Data Kosong atau Format Salah");
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.openById("1iBTqITWql4_AXHL0dGYojPdnj2C3vCQp3abCbSpab3E");
    var sheet = ss.getSheets()[0];
    var folder = DriveApp.getFolderById("1xYD8hRam6RYPyfEWYKSKWsdZYpjY60Yh");

    function uploadFile(base64Str, mime, name) {
      if (!base64Str || base64Str.length < 50) return ""; 
      try {
        var decoded = Utilities.base64Decode(base64Str);
        var blob = Utilities.newBlob(decoded, mime, name);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return file.getUrl();
      } catch (err) {
        return "Error Upload: " + err.toString(); 
      }
    }

    // Upload Files
    var kk = uploadFile(data.kartuKeluargaBase64, data.kartuKeluargaMime, "KK_" + data.fullName);
    var akta = uploadFile(data.aktaKelahiranBase64, data.aktaKelahiranMime, "AKTA_" + data.fullName);
    var ktp = uploadFile(data.ktpWalimuridBase64, data.ktpWalimuridMime, "KTP_" + data.fullName);
    var foto = uploadFile(data.pasFotoBase64, data.pasFotoMime, "FOTO_" + data.fullName);

    // Save to Sheet
    var rowData = [
      new Date(),                         
      data.regId,                         
      data.infoSource,                    
      data.fullName,                      
      "'" + data.nisn,                    
      data.gender,                        
      data.birthPlace, 
      data.birthDate,  
      data.address,                       
      data.previousSchool,                
      data.fatherName,                    
      data.fatherOccupation,              
      data.motherName,                    
      data.motherOccupation,              
      "'" + data.parentWaNumber,          
      kk,                                 
      akta,                               
      ktp,                                
      foto                                
    ];

    sheet.appendRow(rowData);

    // --- KIRIM EMAIL NOTIFIKASI KE ADMIN ---
    try {
      var subject = "Pendaftar Baru: " + data.fullName + " (" + data.regId + ")";
      var htmlBody = 
        "<h3>Ada Pendaftar Baru SPMB 2026/2027</h3>" +
        "<p>Berikut ringkasan data siswa baru yang masuk:</p>" +
        "<table border='1' cellpadding='5' style='border-collapse:collapse;'>" +
        "<tr><td><strong>ID Pendaftaran</strong></td><td>" + data.regId + "</td></tr>" +
        "<tr><td><strong>Nama Siswa</strong></td><td>" + data.fullName + "</td></tr>" +
        "<tr><td><strong>Asal Sekolah</strong></td><td>" + data.previousSchool + "</td></tr>" +
        "<tr><td><strong>Nama Ayah</strong></td><td>" + data.fatherName + "</td></tr>" +
        "<tr><td><strong>No WA Ortu</strong></td><td><a href='https://wa.me/" + data.parentWaNumber.replace(/[^0-9]/g, '') + "'>" + data.parentWaNumber + "</a></td></tr>" +
        "</table>" +
        "<p>Silakan cek Google Spreadsheet untuk melihat detail dan dokumen lengkap.</p>" +
        "<small>Email ini dikirim otomatis oleh Sistem SPMB SMP Bhumi Ngasor Ar-Ridho.</small>";

      MailApp.sendEmail({
        to: EMAIL_ADMIN,
        subject: subject,
        htmlBody: htmlBody
      });
    } catch (emailErr) {
      // Jangan gagalkan pendaftaran hanya karena email error, cukup log saja
      console.error("Gagal kirim email: " + emailErr);
    }
    // ---------------------------------------

    return ContentService.createTextOutput(JSON.stringify({ result: "success", id: data.regId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    try {
      var ssErr = SpreadsheetApp.openById("1iBTqITWql4_AXHL0dGYojPdnj2C3vCQp3abCbSpab3E");
      ssErr.getSheets()[0].appendRow([new Date(), "ERROR LOG", error.toString()]);
    } catch(e) {}

    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}
