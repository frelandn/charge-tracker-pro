const UI = {
  toggleGuide() {
    Config.$('guideModal').classList.toggle('hidden');
  },

  showToast(message) {
    const toast = Config.$('toast');
    Config.$('toastMsg').innerText = message;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100', '-translate-y-1');

    setTimeout(() => {
      toast.classList.remove('opacity-100', '-translate-y-1');
      toast.classList.add('opacity-0');
    }, 2500);
  },

  switchTab(tab) {
    const activeClass = "py-2 text-[11px] font-bold rounded-md transition text-emerald-400 bg-slate-900 border border-slate-700";
    const inactiveClass = "py-2 text-[11px] font-bold rounded-md transition text-slate-400 hover:text-slate-200";

    Config.$('tabContentCalc').classList.add('hidden');
    Config.$('tabContentHistory').classList.add('hidden');
    Config.$('tabContentChart').classList.add('hidden');

    Config.$('tabBtnCalc').className = inactiveClass;
    Config.$('tabBtnHistory').className = inactiveClass;
    Config.$('tabBtnChart').className = inactiveClass;

    if (tab === 'calc') {
      Config.$('tabContentCalc').classList.remove('hidden');
      Config.$('tabBtnCalc').className = activeClass;
    } else if (tab === 'history') {
      Config.$('tabContentHistory').classList.remove('hidden');
      Config.$('tabBtnHistory').className = activeClass;
      UI.renderHistory();
    } else if (tab === 'chart') {
      Config.$('tabContentChart').classList.remove('hidden');
      Config.$('tabBtnChart').className = activeClass;
      Charts.render();
    }
  },

  updateAggregateElements(distText, costText, effText, costRateText) {
    document.querySelectorAll('.totalDistanceVal').forEach(el => el.innerText = distText);
    document.querySelectorAll('.totalConsCostVal').forEach(el => el.innerText = costText);
    document.querySelectorAll('.avgEffVal').forEach(el => el.innerText = effText);
    document.querySelectorAll('.avgCostPerKmVal').forEach(el => el.innerText = costRateText);
  },

  renderHistory() {
    const logs = Data.getLogs();
    const container = Config.$('historyLog');
    const monthContainer = Config.$('monthlyBreakdown');
    container.innerHTML = '';
    monthContainer.innerHTML = '';

    if (logs.length === 0) {
      container.innerHTML = `<p class="text-slate-500 text-center py-4">No rides logged yet.</p>`;
      monthContainer.innerHTML = `<p class="text-slate-500 text-center py-2">No monthly history yet.</p>`;
      UI.updateAggregateElements('0.00 km', '₱0.00', '0.00 %/km', '₱0.00/km');
      return;
    }

    let totalDist = 0;
    let totalConsSpent = 0;
    let effSum = 0;
    let validEffCount = 0;
    const monthlyData = {};

    logs.forEach(log => {
      const consCostVal = parseFloat(log.consCost !== undefined ? log.consCost : log.cost) || 0;
      const effVal = parseFloat(log.pctPerKm) || 0;
      const distVal = parseFloat(log.dist) || 0;
      const costPerKmVal = parseFloat(log.costPerKm !== undefined ? log.costPerKm : (distVal > 0 ? consCostVal / distVal : 0)) || 0;

      totalDist += distVal;
      totalConsSpent += consCostVal;
      
      if (effVal > 0 && !log.isFullCharge) {
        effSum += effVal;
        validEffCount++;
      }

      const mKey = log.monthKey || 'Unknown';
      const mLabel = log.monthLabel || 'Prior Logs';
      if (!monthlyData[mKey]) {
        monthlyData[mKey] = { label: mLabel, dist: 0, cost: 0 };
      }
      monthlyData[mKey].dist += distVal;
      monthlyData[mKey].cost += consCostVal;

      const card = document.createElement('div');

      if (log.isFullCharge) {
        const pctAdded = (100 - log.startPct).toFixed(2);
        const meterBadge = log.actualKwh ? `<span class="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded font-bold">🔌 ${log.actualKwh} kWh Meter</span>` : '';
        card.className = `bg-slate-900 p-2.5 rounded border border-emerald-500/40 flex justify-between items-center border-l-4 border-l-emerald-400`;
        card.innerHTML = `
          <div>
            <div class="font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
              ${log.date} • ${log.odo} km 
              <span class="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">⚡ Recharged to 100%</span>
              ${meterBadge}
            </div>
            <div class="text-slate-300 mt-0.5">Charged: <span class="text-emerald-400 font-bold">+${pctAdded}%</span> | Cost: <span class="text-emerald-400 font-bold">₱${parseFloat(log.cost).toFixed(2)}</span></div>
            <div class="text-slate-500 text-[10px]">Reset baseline battery to 100.00%</div>
          </div>
          <button onclick="Data.deleteLog(${log.id})" class="text-rose-400 hover:text-rose-300 font-bold px-2 text-sm">✕</button>
        `;
      } else {
        const style = Calculator.getEfficiencyStyle(effVal);
        card.className = `bg-slate-900 p-2.5 rounded border flex justify-between items-center ${style.border}`;
        card.innerHTML = `
          <div>
            <div class="font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
              ${log.date} • ${log.odo} km 
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${style.bg}">${style.label}</span>
            </div>
            <div class="text-slate-400">Trip: <span class="text-emerald-400">${distVal.toFixed(2)} km</span> | Cons: <span class="text-sky-400">₱${consCostVal.toFixed(2)}</span> (<span class="text-amber-400">₱${costPerKmVal.toFixed(2)}/km</span>)</div>
            <div class="text-slate-500">Eff: <span class="${style.text} font-bold">${effVal.toFixed(2)}%/km</span> (Used ${parseFloat(log.pctUsed).toFixed(2)}% from ${log.startPct.toFixed(2)}% → ${log.endAvgPct.toFixed(2)}%)</div>
          </div>
          <button onclick="Data.deleteLog(${log.id})" class="text-rose-400 hover:text-rose-300 font-bold px-2 text-sm">✕</button>
        `;
      }
      container.appendChild(card);
    });

    const avgEff = validEffCount > 0 ? (effSum / validEffCount).toFixed(2) : '0.00';
    const avgCostRate = totalDist > 0 ? (totalConsSpent / totalDist).toFixed(2) : '0.00';

    UI.updateAggregateElements(
      `${totalDist.toFixed(2)} km`,
      `₱${totalConsSpent.toFixed(2)}`,
      `${avgEff} %/km`,
      `₱${avgCostRate}/km`
    );

    Object.keys(monthlyData).sort().reverse().forEach(key => {
      const m = monthlyData[key];
      const mCostPerKm = m.dist > 0 ? (m.cost / m.dist).toFixed(2) : '0.00';
      const row = document.createElement('div');
      row.className = "bg-slate-900/80 p-2 rounded border border-slate-700/80 flex justify-between items-center";
      row.innerHTML = `
        <span class="font-bold text-slate-300">${m.label}</span>
        <div class="text-right">
          <span class="text-emerald-400 font-bold">${m.dist.toFixed(2)} km</span> | 
          <span class="text-sky-400 font-bold">₱${m.cost.toFixed(2)}</span> 
          <span class="text-slate-500 text-[10px]">(₱${mCostPerKm}/km)</span>
        </div>
      `;
      monthContainer.appendChild(row);
    });
  }
};