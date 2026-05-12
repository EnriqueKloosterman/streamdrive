const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getDriveClient() {
  let credentials;

  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    try {
      credentials = JSON.parse(jsonStr);
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON');
    }
  } else {
    const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (!filePath) {
      throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_PATH');
    }
    const resolved = path.resolve(__dirname, '..', '..', filePath);
    try {
      credentials = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_PATH');
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

module.exports = { getDriveClient };
