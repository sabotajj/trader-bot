const { EventEmitter } = require('events');

class rule {
    constructor() {
        this.name = '';
        this.maxExecution = 100;
        this.futureName = '';
        this.executionTimes = 0;
        this.candlePeriod = '';
        this.executedOnThisCandle = false;
        this.executeOnceInPeriod = true;
        this.events = new EventEmitter();
        this.conditionToStart = () => false;
        this.action = () => { };
        this.active = true;
        this.changeSetting = (settings) => {};
        this.getState = () => { return {}};
    }
}

const RuleEvents = {
    ConditionSatisfied: 'conditionSatisfied',
    ActionExecuted: 'actionExecuted',
    SettingChange: 'settingChanged'
};

module.exports = { rule, RuleEvents };