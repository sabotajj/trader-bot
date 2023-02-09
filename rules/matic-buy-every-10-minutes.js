const { rule, RuleEvents } = require('./rule');

function createRule(exchange, myPosition) {

    const buyEvery10Min = new rule();
    
    buyEvery10Min.name = 'buyMaticEvery10min';
    buyEvery10Min.futureName = 'MATICUSDT';
    buyEvery10Min.maxExecution = 66;
    buyEvery10Min.candlePeriod = 'candles_5m';

    buyEvery10Min.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        const minuteInterval = 10;

        const nowMinute = (new Date()).getMinutes()
        if(nowMinute % minuteInterval == 3) {
            return true
        }

        return false;
    };

    buyEvery10Min.action = async () => {
        exchange.buy("MATICUSDT", 10);
        buyEvery10Min.events.emit(RuleEvents.ActionExecuted, `Bought matic`);
    };

    return buyEvery10Min;
}

module.exports.createRule = createRule;
