const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('/Volumes/SSD/fiverr/millmedia-portal/Gecko understudy.xlsx');

// Get the sheet names
console.log('Available sheets:', workbook.SheetNames);

// Find the "Free subs (NEW!)" sheet
const sheetName = workbook.SheetNames.find(name => name.includes('Free subs'));

if (sheetName) {
  console.log(`\n=== Content of sheet: ${sheetName} ===\n`);
  
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log('Sheet data:', JSON.stringify(jsonData, null, 2));
} else {
  console.log('Sheet "Free subs (NEW!)" not found');
}