const rule = require('./rule').rule

function createRule(exchange) {

    const algoBuyEvery10Min = new rule();

    algoBuyEvery10Min.futureName = 'ALGOUSDT';
    algoBuyEvery10Min.maxExecution = 60;
    algoBuyEvery10Min.candlePeriod = 'candles_5m';

    algoBuyEvery10Min.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        const minuteInterval = 10;

        const nowMinute = (new Date()).getMinutes()
        if(nowMinute % minuteInterval == 3) {
            return !algoBuyEvery10Min.executedOnThisCandle;
        }

        return false;
    };

    algoBuyEvery10Min.action = async () => {
        console.log("Buying ALGO");
        exchange.buy("ALGOUSDT", 10);
    };

    return algoBuyEvery10Min;
}

module.exports.createRule = createRule;
