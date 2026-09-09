const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/indusinnovate/.gemini/antigravity-ide/brain/a692d308-a76f-4621-aa2b-aed0a51807e0/scratch/makuta/Makuta_Developers_COMPLETE_Public_Extraction/Makuta_Developers_COMPLETE_Database.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(JSON.stringify(data.slice(0, 2), null, 2));
