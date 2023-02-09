const fs = require('fs');
const EventEmitter = require('events');
const STATE_FILE_SUFFIX = '-state.json';
const STATE_FILES_PATH = './states/';
const { RuleEvents, rule } = require('./rules/rule');
const loadedRules = require('./rule-executor').loadedRules;
require('./type-defs');

/**
 * 
 * @param {boolean} restore 
 */
function init(restore = false) {
    if(restore) {
        loadedRules.forEach(restoreState);
    }
    
    loadedRules.forEach(rule => {
        rule.events.on(RuleEvents.ActionExecuted, () => 
            saveState(rule));
        rule.events.on(RuleEvents.SettingChange, () => 
            saveState(rule));
    });
}

/**
 * @param {rule} rule
 */
function saveState(rule) {
    fs.writeFileSync(STATE_FILES_PATH + rule.name + STATE_FILE_SUFFIX, JSON.stringify(rule.getState && rule.getState()));
}

/**
 * @param {rule} rule
 */
function restoreState(rule) {
    fs.exists(STATE_FILES_PATH + rule.name + STATE_FILE_SUFFIX, (exists) => {
        if(!exists) return;
        var state = JSON.parse(fs.readFileSync(STATE_FILES_PATH + rule.name + STATE_FILE_SUFFIX).toString());
        rule.changeSetting(state);
    });
}

module.exports = {init};

