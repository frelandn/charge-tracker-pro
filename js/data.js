const Data = {
  getLogs() {
    return JSON.parse(localStorage.getItem(Config.KEYS.HISTORY_DB) || '[]');
  },

  saveLogs(logs) {
    localStorage.setItem(Config.KEYS.HISTORY_DB, JSON.stringify(logs));
  },

  getBaselineBatteryPct() {
    const logs = Data.getLogs();
    if (logs.length === 0) return 100;

    const lastLog = logs[0];
    if (lastLog.isFullCharge) return 100;

    return lastLog.endAvgPct !== undefined ? parseFloat(lastLog.endAvgPct) : 100;
  },

  getBaselineOdo() {
    const logs = Data.getLogs();
    if (logs.length === 0) {
      return parseFloat(Config.$('configBaselineOdo').value) || 0;
    }
    return logs[0].odo !== undefined ? parseFloat(logs[0].odo) : 0;
  },

  saveInputState() {
    const state = {
      packMode: Config.$('packMode').value,
      configBaselineOdo: Config.$('configBaselineOdo').value,
      packA: Config.$('packA').value,
      packB: Config.$('packB').value,
      prevOdo: Config.$('prevOdo').value,
      currOdo: Config.$('currOdo').value,
      actualKwh: Config.$('actualKwh').value,
      isFullCharge: Config.$('isFullCharge').checked
    };
    localStorage.setItem(Config.KEYS.INPUT_STATE, JSON.stringify(state));
  },

  loadInputState() {
    const saved = localStorage.getItem(Config.KEYS.INPUT_STATE) || localStorage.getItem(Config.KEYS.LEGACY_INPUT_STATE);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.packMode) Config.$('packMode').value = state.packMode;
        if (state.configBaselineOdo !== undefined) Config.$('configBaselineOdo').value = state.configBaselineOdo;
        if (state.packA !== undefined) Config.$('packA').value = state.packA;
        if (state.packB !== undefined) Config.$('packB').value = state.packB;
        if (state.prevOdo !== undefined) Config.$('prevOdo').value = state.prevOdo;
        if (state.currOdo !== undefined) Config.$('currOdo').value = state.currOdo;
        if (state.actualKwh !== undefined) Config.$('actualKwh').value = state.actualKwh;
        if (state.isFullCharge !== undefined) {
          Config.$('isFullCharge').checked = state.isFullCharge;
        }
      } catch(e) {
        console.error("Error restoring saved input state", e);
      }
    }
  },

  syncStateFromHistory() {
    const baseline = Data.getBaselineOdo();
    Config.$('configBaselineOdo').value = baseline;
    if (!Config.$('isFullCharge').checked) {
      Config.$('prevOdo').value = baseline;
    }
  },

  deleteLog(id) {
    const logs = Data.getLogs().filter(log => log.id !== id);
    Data.saveLogs(logs);
    Data.syncStateFromHistory();
    UI.renderHistory();
    Charts.render();
    Calculator.calculate();
  },

  clearHistory() {
    if (confirm("Are you sure you want to clear your entire ride history?")) {
      localStorage.removeItem(Config.KEYS.HISTORY_DB);
      Data.syncStateFromHistory();
      UI.renderHistory();
      Charts.render();
      Calculator.calculate();
    }
  },

  exportCSV() {
    const logs = Data.getLogs();
    if (logs.length === 0) return alert("No data to export!");

    let csv = "ID,Date,ODO (km),Trip (km),Start %,End %,Used %,Percent Per KM,Charge Cost (PHP),Consumption Cost (PHP),Cost Per KM (PHP/km),Actual Meter kWh,Full Charge Reset\n";
    logs.forEach(l => {
      const consCostVal = l.consCost !== undefined ? l.consCost : l.cost;
      const distVal = parseFloat(l.dist) || 0;
      const cpkVal = l.costPerKm !== undefined ? l.costPerKm : (distVal > 0 ? consCostVal / distVal : 0);
      const actualKwhVal = l.actualKwh ? l.actualKwh : '';
      csv += `${l.id},"${l.date}",${l.odo},${distVal.toFixed(2)},${parseFloat(l.startPct).toFixed(2)},${parseFloat(l.endAvgPct).toFixed(2)},${parseFloat(l.pctUsed).toFixed(2)},${parseFloat(l.pctPerKm).toFixed(2)},${parseFloat(l.cost).toFixed(2)},${parseFloat(consCostVal).toFixed(2)},${parseFloat(cpkVal).toFixed(2)},"${actualKwhVal}",${l.isFullCharge ? 'Yes' : 'No'}\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chargetracker_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportJSON() {
    const logs = Data.getLogs();
    if (logs.length === 0) return alert("No data to backup!");
    const jsonStr = JSON.stringify(logs, null, 2);
    const encodedUri = encodeURI("data:application/json;charset=utf-8," + jsonStr);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chargetracker_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          Data.saveLogs(data);
          Data.syncStateFromHistory();
          UI.renderHistory();
          Charts.render();
          Calculator.calculate();
          UI.showToast("Backup restored successfully!");
        } else {
          alert("Invalid backup structure.");
        }
      } catch (err) {
        alert("Error parsing JSON backup file.");
      }
    };
    reader.readAsText(file);
  }
};