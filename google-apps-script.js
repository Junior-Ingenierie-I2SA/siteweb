/**
 * Formulaire de contact Junior i2SA → Google Sheet + e-mail.
 * À coller dans Extensions > Apps Script de la Google Sheet (voir README.md).
 */

// Adresse qui reçoit une notification à chaque message
const NOTIFY_EMAIL = "iyedjaziri@gmail.com"; // TODO : remplacer par contact@junior-i2sa.org
const SHEET_NAME = "Messages";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Piège anti-spam rempli : on ignore silencieusement
    if (data.website) return json({ result: "success" });

    const name = clean(data.name, 200);
    const email = clean(data.email, 200);
    const subject = clean(data.subject, 100);
    const message = clean(data.message, 5000);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ result: "error", error: "Champs invalides" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Nom", "E-mail", "Sujet", "Message"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), name, email, subject, message]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `[Site Junior i2SA] ${subject} – ${name}`,
      body: `Nom : ${name}\nE-mail : ${email}\nSujet : ${subject}\n\n${message}\n\n---\nTous les messages : ${ss.getUrl()}`,
    });

    return json({ result: "success" });
  } catch (err) {
    return json({ result: "error", error: String(err) });
  }
}

// Empêche l'injection de formules dans la feuille (=, +, -, @)
function clean(value, max) {
  const s = String(value || "").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
