// Application initialization and event binding
window.addEventListener('DOMContentLoaded', () => {
  // Migration logic for legacy keys
  if (localStorage.getItem(Config.KEYS.LEGACY_HISTORY_DB) && !localStorage.getItem(Config.KEYS.HISTORY_DB)) {
    localStorage.setItem(Config.KEYS.HISTORY_DB, localStorage.getItem(Config.KEYS.LEGACY_HISTORY_DB));
  }

  // Event Listeners Setup
  document.querySelectorAll('input:not(#isFullCharge), select').forEach(i => {
    i.addEventListener('input', (e) => {
      if (e.target.id === 'configBaselineOdo' && Data.getLogs().length === 0) {
        Config.$('prevOdo').value = e.target.value;
      }
      Data.saveInputState();
      Calculator.calculate();
    });
  });

  Config.$('isFullCharge').addEventListener('change', Calculator.handleFullChargeToggle);
  Config.$('packMode').addEventListener('change', Calculator.handlePackModeChange);

  // Load Initial State
  Data.loadInputState();
  Data.syncStateFromHistory();
  Calculator.handlePackModeChange();
  Calculator.handleFullChargeToggle();
  UI.renderHistory();
  Calculator.calculate();
});