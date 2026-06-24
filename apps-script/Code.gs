const SCRIPT_PROPS = {
  FOLDER_ID: 'MIND_BATTERY_FOLDER_ID',
  SHARED_SECRET: 'MIND_BATTERY_SHARED_SECRET'
};

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const folderId = normalizeDriveId(props.getProperty(SCRIPT_PROPS.FOLDER_ID));
    const sharedSecret = props.getProperty(SCRIPT_PROPS.SHARED_SECRET) || '';

    if (!folderId) {
      return jsonResponse({
        ok: false,
        error: 'Script property MIND_BATTERY_FOLDER_ID is not set.'
      });
    }

    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');

    if (sharedSecret && payload.secret !== sharedSecret) {
      return jsonResponse({
        ok: false,
        error: 'Invalid shared secret.'
      });
    }

    if (!payload.secureCode) {
      return jsonResponse({
        ok: false,
        error: 'secureCode is required.'
      });
    }

    const filename = sanitizeFilename(payload.filename || defaultFilename());
    const folder = getUploadFolder(folderId);
    const file = folder.createFile(filename, payload.secureCode, MimeType.PLAIN_TEXT);
    file.setDescription('MIND-BATTERY secure clinical data block');

    return jsonResponse({
      ok: true,
      fileId: file.getId(),
      filename: file.getName(),
      fileUrl: file.getUrl()
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'mind-battery-drive-upload'
  });
}

function jsonResponse(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeFilename(filename) {
  const safeName = String(filename || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);

  const fallback = defaultFilename();
  const resolvedName = safeName || fallback;
  return resolvedName.endsWith('.txt') ? resolvedName : `${resolvedName}.txt`;
}

function normalizeDriveId(value) {
  const text = String(value || '').trim();
  const match = text.match(/[-\w]{25,}/);
  return match ? match[0] : text;
}

function getUploadFolder(folderId) {
  try {
    return DriveApp.getFolderById(folderId);
  } catch (err) {
    throw new Error('Drive folder is not accessible. Check MIND_BATTERY_FOLDER_ID and Web App execution account permissions.');
  }
}

function defaultFilename() {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return `MIND_BATTERY_REPORT_${date}.txt`;
}
