const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if(file.endsWith('.tsx') || file.endsWith('.ts')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

files.forEach(f => {
  if (f.includes('Dashboard.tsx') || f.includes('JournalEntryForm.tsx') || f.includes('GeneralJournalView.tsx') || f.includes('FinancialSummaryView.tsx') || f.includes('ProfileSettings.tsx')) return;
  
  const code = fs.readFileSync(f, 'utf8');
  let newCode = code.replace(/const formatCurrency = \((.*?): number\) => \{\s*return new Intl\.NumberFormat\('id-ID', \{ style: 'currency', currency: 'IDR', minimumFractionDigits: 0 \}\)\.format\((.*?)\)\s*\}/g, 
`const formatCurrency = ($1: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format($2)}</span>
      </div>
    )
  }`);
  
  // Update "2 kolom di samping kolom nominal" to justify center.
  // Generally, this means changing `<td className="px-6 py-4">` to `<td className="px-6 py-4 text-center">`
  // But wait, it's safer if I don't auto-replace all tds. I will do that part manually.
  
  if (code !== newCode) {
    fs.writeFileSync(f, newCode);
    console.log('Updated formatCurrency in ' + f);
  }
});
