const { EventsEnum } = require("./events-definitions");
let totalExecution = 0;
const fs = require('fs');
const {customRules} = JSON.parse(fs.readFileSync('config.json'));
const loadedRules = [];

const ruleExecutorInit = (exchange, quotes, markPrices, candles, technicals, events, myPositions, myOpenOrders) => {

    customRules
    .map(rulePath => `./rules/${rulePath}`)
    .map(require)
    .map(rule => rule.createRule(exchange, myPositions, myOpenOrders))
    .map(ruleInitiator);

    //templates
    const createGoldenCrossRule = require('./rules/templates/GoldenCross').createRule;

    [
        // {future: 'ALGOUSDT', amount: 150}
    ]
        .map(({future, amount}) => createGoldenCrossRule(exchange, future, 'candles_15m', amount))
        .map(ruleInitiator);

    const createRSIOverXTemplateRule = require('./rules/templates/RSIOverXSell').createRule;
    const createTrailingStopBuyRule = require('./rules/templates/TrailingStopXPct').createRule;

    [
        // {future: "REEFUSDT", amount: 8000},
        // {future: "CTKUSDT", amount: 700},
        // {future: "BELUSDT", amount: 300},
        {future: "NEARUSDT", amount: 100},
        // {future: "HOTUSDT", amount: 60000},
    ]
    .map(({future, amount}) => createRSIOverXTemplateRule(exchange, future, 'candles_15m', 90, amount))
    .map(ruleInitiator);

    [
        // {future: "ADAUSDT", amount: 1000, percent: 4},
        // {future: "MATICUSDT", amount: 1000, percent: 4},
        // {future: "ALGOUSDT", amount: 1000, percent: 4},
        // {future: "AVAXUSDT", amount: 150, percent: 4},
    ]
    .map(({future, amount, percent}) => createTrailingStopBuyRule(exchange, future, 'candles_15m', percent, amount))
    .map(ruleInitiator);

    const createBuyEveryXMinRule = require('./rules/templates/BuyEveryXMin').createRule;
    [
        // {future: "DOGEUSDT", amount: 3000, minute: 15, executionTimes: 10 },
        {future: "NEARUSDT", amount: 50, minute: 15, executionTimes: 10 },
        {future: "BTCUSDT", amount: 0.01, minute: 15, executionTimes: 10 },
    ]
    .map(({future, amount, minute, executionTimes}) => createBuyEveryXMinRule(exchange, future, 'candles_15m', minute, 30, amount, executionTimes))
    .map(ruleInitiator);



    /**
     * 
     * @param {rule} rule
     */
    function ruleInitiator(rule) {
        loadedRules.push(rule);
        const maxExecution = rule.maxExecution;
        listenPriceUpdateEvents();
        listenCandleUpdateEvents();
        
        // sub functions
        function listenPriceUpdateEvents() {
            if(!events[rule.futureName]){
                throw new Error('Future is not defined in required futures');
            }
            events[rule.futureName].price.on(EventsEnum.UPDATE, onSinglePriceUpdate);
        }
        function listenCandleUpdateEvents() {
            events[rule.futureName][rule.candlePeriod].on(EventsEnum.UPDATE, resetPeriodExecution);
        }
        async function onSinglePriceUpdate(currentPrice) {
            if (rule.executedOnThisCandle && rule.executeOnceInPeriod) return;
            if (!rule.active) return;
            if (rule.conditionToStart(currentPrice, quotes, markPrices, candles, technicals)) {
                rule.executionTimes++;
                totalExecution++;
                rule.executedOnThisCandle = true;

                if (maxExecution < rule.executionTimes) {
                    events[rule.futureName].price.removeListener(EventsEnum.UPDATE, onSinglePriceUpdate)
                    return;
                }

                console.log("Executing rule", rule.name);
                rule.action();
            }
        }

        function resetPeriodExecution() {
            if(rule.executeOnceInPeriod) {
                rule.executedOnThisCandle = false;
            }
        }

    }
};

module.exports.init = ruleExecutorInit
module.exports.totalExecution = totalExecution;
module.exports.loadedRules = loadedRules;