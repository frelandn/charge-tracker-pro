const Config = {
  KEYS: {
    HISTORY_DB: 'chargetracker_history_db',
    INPUT_STATE: 'chargetracker_input_state',
    LEGACY_HISTORY_DB: 'viper_history_db',
    LEGACY_INPUT_STATE: 'viper_input_state'
  },
  $(id) {
    return document.getElementById(id);
  }
};