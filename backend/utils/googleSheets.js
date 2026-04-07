const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../google-service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const getSheetData = async (spreadsheetId, range = 'Sheet1') => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values; // returns 2D array [ [header row], [row1], ... ]
};

module.exports = { getSheetData };