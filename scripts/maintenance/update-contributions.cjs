const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/contributions/ContributionsList.tsx', 'utf8');

// 1. Add useAutoCalc to initial states
code = code.replace(/isEstimasiManual: false, manualEstimasiGalon: 10/g, 'isEstimasiManual: false, manualEstimasiGalon: 10, useAutoCalc: false');

// 2. Add calcLabels below isGalon
const calcLabelsCode = `  const isGalon = newContribution.title.toLowerCase().includes('galon')
  const isListrik = newContribution.title.toLowerCase().includes('listrik')

  const calcLabels = isGalon ? {
    title: 'Kalkulator Iuran Otomatis',
    method1: 'Berdasarkan Intensitas Minum',
    method2: 'Data Historis',
    intensityLabel: 'Intensitas Minum (Per Orang)',
    unitLabel: 'Ukuran Galon (Liter)',
    priceLabel: 'Harga per Galon (Rp)',
    estimateLabel: 'Estimasi Galon Habis',
    unitName: 'Galon/bulan',
    usageName: 'Liter/bulan',
    icon: <Droplets className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Air',
    estimateResultLabel: 'Estimasi Galon',
    tooltip: 'Default: 8 org = 10 galon'
  } : isListrik ? {
    title: 'Kalkulator Listrik Otomatis',
    method1: 'Berdasarkan Intensitas Listrik',
    method2: 'Data Historis',
    intensityLabel: 'Intensitas (kWh/Hari per Orang)',
    unitLabel: 'Kapasitas Token (kWh)',
    priceLabel: 'Tarif per Token (Rp)',
    estimateLabel: 'Estimasi Token Habis',
    unitName: 'Token/bulan',
    usageName: 'kWh/bulan',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Listrik',
    estimateResultLabel: 'Estimasi Token',
    tooltip: 'Berdasarkan data historis'
  } : {
    title: 'Kalkulator Iuran Otomatis',
    method1: 'Berdasarkan Intensitas',
    method2: 'Data Historis / Flat',
    intensityLabel: 'Intensitas Pemakaian (Per Orang)',
    unitLabel: 'Ukuran Satuan (Unit)',
    priceLabel: 'Harga per Satuan (Rp)',
    estimateLabel: 'Estimasi Satuan Habis',
    unitName: 'Unit/bulan',
    usageName: 'Unit/bulan',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Pemakaian',
    estimateResultLabel: 'Estimasi Pemakaian',
    tooltip: 'Berdasarkan data historis'
  }`;

code = code.replace(/const isGalon = newContribution\.title\.toLowerCase\(\)\.includes\('galon'\)/, calcLabelsCode);

// 3. Update save handlers
code = code.replace(/amount: isGalon \? autoNominal/g, 'amount: newContribution.useAutoCalc ? autoNominal');

// 4. Update the form UI to conditionally render the manual nominal vs calc
code = code.replace(/\{isGalon && \(/, `
              <div className="flex items-center justify-between mb-2 mt-6">
                <label className="flex items-center text-sm font-bold text-gray-900 cursor-pointer">
                  <input type="checkbox" className="mr-2.5 text-emerald-600 focus:ring-emerald-500 rounded w-4 h-4 border-gray-300" checked={newContribution.useAutoCalc} onChange={(e) => setNewContribution({...newContribution, useAutoCalc: e.target.checked})} />
                  Gunakan Kalkulator Iuran Otomatis
                </label>
              </div>
              
              {!newContribution.useAutoCalc && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                  <input required={!newContribution.useAutoCalc} type="number" className="form-input" value={newContribution.amount} onChange={e => setNewContribution({...newContribution, amount: e.target.value === '' ? '' : Number(e.target.value)})} />
                </div>
              )}

              {newContribution.useAutoCalc && (`);

// We need to replace texts in the calculator with calcLabels
code = code.replace(/Kalkulator Iuran Otomatis/, '{calcLabels.title}');
code = code.replace(/>Berdasarkan Intensitas Minum</, '>{calcLabels.method1}<');
code = code.replace(/>Data Historis</, '>{calcLabels.method2}<');
code = code.replace(/>Intensitas Minum \(Per Orang\)</, '>{calcLabels.intensityLabel}<');
code = code.replace(/>Ukuran Galon \(Liter\)</, '>{calcLabels.unitLabel}<');
code = code.replace(/>Estimasi Galon Habis</, '>{calcLabels.estimateLabel}<');
code = code.replace(/>Harga per Galon \(Rp\)</, '>{calcLabels.priceLabel}<');

// the drops/history icon
code = code.replace(/\{newContribution\.calcMode === 'intensity' \? <Droplets className="w-3\.5 h-3\.5" \/> : <History className="w-3\.5 h-3\.5" \/>\}/, '{newContribution.calcMode === "intensity" ? calcLabels.icon : <History className="w-3.5 h-3.5" />}');

// the summary texts
code = code.replace(/>Total Kebutuhan Air</, '>{calcLabels.totalNeedLabel}<');
code = code.replace(/Liter\/bulan/g, '{calcLabels.usageName}');
code = code.replace(/>Estimasi Galon</g, '>{calcLabels.estimateResultLabel}<');
code = code.replace(/Galon\/bulan/g, '{calcLabels.unitName}');
code = code.replace(/Default: 8 org = 10 galon/, '{calcLabels.tooltip}');

// Remove the old {!isGalon && ... Nominal ...} logic
code = code.replace(/\{!isGalon && \([\s\S]*?Nominal \(Rp\)[\s\S]*?setNewContribution[\s\S]*?\)\}/, '');

fs.writeFileSync('src/pages/dashboard/contributions/ContributionsList.tsx', code);
console.log('Done replacing UI logic');
