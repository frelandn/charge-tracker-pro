const Calculator = {
  adjustPack(id, delta) {
    const el = Config.$(id);
    if (el.disabled) return;
    let currentVal = parseFloat(el.value) || 0;
    let newVal = Math.min(100, Math.max(0, currentVal + delta));
    el.value = newVal;
    Data.saveInputState();
    Calculator.calculate();
  },

  getEfficiencyStyle(eff) {
    if (eff <= 0 || isNaN(eff)) {
      return { border: 'border-slate-700', text: 'text-slate-400', bg: 'bg-slate-800', label: '—' };
    }
    if (eff < 1.2) {
      return { border: 'border-l-4 border-l-emerald-500 border-slate-700', text: 'text-emerald-400', bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', label: 'Great (Eco)' };
    }
    if (eff <= 1.8) {
      return { border: 'border-l-4 border-l-amber-500 border-slate-700', text: 'text-amber-400', bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', label: 'Normal' };
    }
    return { border: 'border-l-4 border-l-rose-500 border-slate-700', text: 'text-rose-400', bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30', label: 'High Draw' };
  },

  handlePackModeChange() {
    const mode = Config.$('packMode').value;
    if (mode === '1') {
      Config.$('capacity').value = '1.5';
      Config.$('packBContainer').classList.add('hidden');
      Config.$('packInputsGrid').classList.replace('grid-cols-2', 'grid-cols-1');
      Config.$('packALabel').innerText = 'Battery %';
    } else {
      Config.$('capacity').value = '3.0';
      Config.$('packBContainer').classList.remove('hidden');
      Config.$('packInputsGrid').classList.replace('grid-cols-1', 'grid-cols-2');
      Config.$('packALabel').innerText = 'Pack A %';
    }
    Data.saveInputState();
    Calculator.calculate();
  },

  handleFullChargeToggle() {
    const isFull = Config.$('isFullCharge').checked;
    
    if (isFull) {
      Config.$('packA').value = 100;
      Config.$('packB').value = 100;
      Config.$('currOdo').value = Config.$('prevOdo').value;

      Config.$('packA').disabled = true;
      Config.$('packB').disabled = true;
      Config.$('currOdo').disabled = true;
      Config.$('prevOdo').disabled = false;

      Config.$('packA').classList.add('opacity-50', 'cursor-not-allowed');
      Config.$('packB').classList.add('opacity-50', 'cursor-not-allowed');
      Config.$('currOdo').classList.add('opacity-50', 'cursor-not-allowed');
      Config.$('prevOdo').classList.remove('opacity-50', 'cursor-not-allowed');

      Config.$('actualKwhContainer').classList.remove('hidden');
    } else {
      Config.$('prevOdo').value = Data.getBaselineOdo();
      
      Config.$('packA').disabled = false;
      Config.$('packB').disabled = false;
      Config.$('currOdo').disabled = false;
      Config.$('prevOdo').disabled = true;

      Config.$('packA').classList.remove('opacity-50', 'cursor-not-allowed');
      Config.$('packB').classList.remove('opacity-50', 'cursor-not-allowed');
      Config.$('currOdo').classList.remove('opacity-50', 'cursor-not-allowed');
      Config.$('prevOdo').classList.add('opacity-50', 'cursor-not-allowed');

      Config.$('actualKwhContainer').classList.add('hidden');
      Config.$('actualKwh').value = '';
    }
    Data.saveInputState();
    Calculator.calculate();
  },

  calculate() {
    const mode = Config.$('packMode').value;
    const capacity = parseFloat(Config.$('capacity').value) || (mode === '1' ? 1.5 : 3.0);
    const eff = (parseFloat(Config.$('efficiency').value) || 88) / 100;
    const rate = parseFloat(Config.$('rate').value) || 15.97;
    const isFull = Config.$('isFullCharge').checked;

    const actualKwhInput = parseFloat(Config.$('actualKwh').value);
    const hasActualKwh = isFull && !isNaN(actualKwhInput) && actualKwhInput > 0;

    const packA = parseFloat(Config.$('packA').value) || 0;
    const packB = mode === '1' ? packA : (parseFloat(Config.$('packB').value) || 0);
    const currentAvgPct = (packA + packB) / 2;

    if (mode === '2' && Math.abs(packA - packB) >= 5) {
      Config.$('bmsWarning').classList.remove('hidden');
    } else {
      Config.$('bmsWarning').classList.add('hidden');
    }

    const startPct = Data.getBaselineBatteryPct();
    Config.$('startPctDisplay').innerText = `${startPct.toFixed(2)}%`;

    const prevOdo = parseFloat(Config.$('prevOdo').value) || 0;
    const currOdo = parseFloat(Config.$('currOdo').value) || 0;

    if (!isFull && currOdo < prevOdo) {
      Config.$('tripDist').innerText = 'Err: ODO';
      Config.$('tripDist').className = 'text-xs font-bold text-rose-400';
    } else {
      Config.$('tripDist').className = 'text-xs font-bold text-slate-200';
    }

    if (isFull) {
      const pctCharged = Math.max(0, 100 - startPct);
      const estChargeWallKwh = ((pctCharged / 100) * capacity) / eff;
      const finalKwh = hasActualKwh ? actualKwhInput : estChargeWallKwh;
      const chargeCost = finalKwh * rate;
      
      Config.$('chargeCost').innerText = `₱${chargeCost.toFixed(2)}`;
      Config.$('consumptionCost').innerText = `₱0.00`;
      Config.$('tripDist').innerText = `0.00 km`;
      Config.$('pctPerKm').innerText = '0.00%';
      Config.$('costPerKm').innerText = '₱0.00/km';
      Config.$('effBenchmarkBadge').innerText = hasActualKwh ? '⚡ Reset (Meter)' : '⚡ Reset';
      Config.$('effBenchmarkBadge').className = 'text-[8px] font-bold mt-0.5 px-1 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      return;
    }

    const pctUsed = Math.max(0, startPct - currentAvgPct);

    const pctNeeded = Math.max(0, 100 - currentAvgPct);
    const estChargeWallKwh = ((pctNeeded / 100) * capacity) / eff;
    const chargeCost = estChargeWallKwh * rate;
    Config.$('chargeCost').innerText = `₱${chargeCost.toFixed(2)}`;

    const consWallKwh = ((pctUsed / 100) * capacity) / eff;
    const consCost = consWallKwh * rate;
    Config.$('consumptionCost').innerText = `₱${consCost.toFixed(2)}`;

    const dist = Math.max(0, currOdo - prevOdo);
    if (currOdo >= prevOdo) {
      Config.$('tripDist').innerText = `${dist.toFixed(2)} km`;
    }

    if (dist > 0 && pctUsed > 0 && currOdo >= prevOdo) {
      const pctPerKmVal = pctUsed / dist;
      Config.$('pctPerKm').innerText = `${pctPerKmVal.toFixed(2)}%`;
      
      const costPerKmVal = consCost / dist;
      Config.$('costPerKm').innerText = `₱${costPerKmVal.toFixed(2)}/km`;

      const style = Calculator.getEfficiencyStyle(pctPerKmVal);
      Config.$('effBenchmarkBadge').innerText = style.label;
      Config.$('effBenchmarkBadge').className = `text-[8px] font-bold mt-0.5 px-1 rounded-sm ${style.bg}`;
    } else {
      Config.$('pctPerKm').innerText = '0.00%';
      Config.$('costPerKm').innerText = '₱0.00/km';
      Config.$('effBenchmarkBadge').innerText = '—';
      Config.$('effBenchmarkBadge').className = 'text-[8px] font-bold mt-0.5 px-1 rounded-sm bg-slate-800 text-slate-400';
    }
  },

  saveLogEntry() {
    const mode = Config.$('packMode').value;
    const prevOdo = parseFloat(Config.$('prevOdo').value) || 0;
    const currOdo = parseFloat(Config.$('currOdo').value) || 0;
    const isFull = Config.$('isFullCharge').checked;

    if (!isFull && currOdo < prevOdo) {
      alert("Current ODO cannot be less than Previous ODO!");
      return;
    }

    const packA = parseFloat(Config.$('packA').value) || 0;
    const packB = mode === '1' ? packA : (parseFloat(Config.$('packB').value) || 0);
    const capacity = parseFloat(Config.$('capacity').value) || (mode === '1' ? 1.5 : 3.0);
    const eff = (parseFloat(Config.$('efficiency').value) || 88) / 100;
    const rate = parseFloat(Config.$('rate').value) || 15.97;

    const actualKwhInput = parseFloat(Config.$('actualKwh').value);
    const hasActualKwh = isFull && !isNaN(actualKwhInput) && actualKwhInput > 0;

    const dist = Math.max(0, currOdo - prevOdo);
    const startPct = Data.getBaselineBatteryPct();
    const currentAvgPct = isFull ? 100 : (packA + packB) / 2;

    let pctUsed = 0;
    let chargeCost = 0;
    let consCost = 0;
    let pctPerKm = "0.00";
    let costPerKm = "0.00";

    if (isFull) {
      const pctCharged = Math.max(0, 100 - startPct);
      const estChargeWallKwh = ((pctCharged / 100) * capacity) / eff;
      const finalKwh = hasActualKwh ? actualKwhInput : estChargeWallKwh;
      chargeCost = (finalKwh * rate).toFixed(2);
    } else {
      pctUsed = Math.max(0, startPct - currentAvgPct);
      pctPerKm = dist > 0 ? (pctUsed / dist).toFixed(2) : "0.00";

      const consWallKwh = ((pctUsed / 100) * capacity) / eff;
      consCost = (consWallKwh * rate).toFixed(2);
      costPerKm = dist > 0 ? (consCost / dist).toFixed(2) : "0.00";

      const estChargeWallKwh = (((100 - currentAvgPct) / 100) * capacity) / eff;
      chargeCost = (estChargeWallKwh * rate).toFixed(2);
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const entry = {
      id: Date.now(),
      date: now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      monthKey: monthKey,
      monthLabel: now.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
      odo: currOdo,
      dist: dist.toFixed(2),
      startPct: startPct,
      endAvgPct: currentAvgPct,
      pctUsed: pctUsed.toFixed(2),
      pctPerKm: pctPerKm,
      cost: chargeCost,
      consCost: consCost,
      costPerKm: costPerKm,
      actualKwh: hasActualKwh ? actualKwhInput : null,
      isFullCharge: isFull,
      packs: mode
    };

    const logs = Data.getLogs();
    logs.unshift(entry);
    Data.saveLogs(logs);

    Config.$('actualKwh').value = '';
    Config.$('isFullCharge').checked = false;

    Config.$('prevOdo').value = currOdo;

    Calculator.handleFullChargeToggle();
    Data.saveInputState();
    UI.renderHistory();
    Charts.render();
    Calculator.calculate();

    UI.showToast("Ride event logged successfully!");
  }
};