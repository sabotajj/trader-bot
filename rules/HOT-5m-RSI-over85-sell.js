const rule = require('./rule').rule;

function createRule(exchange) {

    const hot5mRSIOver85Sell = new rule();

    hot5mRSIOver85Sell.futureName = 'HOTUSDT';
    hot5mRSIOver85Sell.maxExecution = 1;
    hot5mRSIOver85Sell.candlePeriod = 'candles_5m';


    hot5mRSIOver85Sell.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        const RSI = technicals.HOTUSDT.candles_5m.RSI;
        const currentRSI = Array.isArray(RSI) && RSI.last();
        if (currentRSI > 90) {
            console.log('conditionSatisfied on HOTUSDT');
            return true;
        }
        console.log('RSI', currentRSI, 'Not satisfied');
        return false;
    };

    hot5mRSIOver85Sell.action = () => {
        exchange.sell("HOTUSDT", 30000);
    };

    return hot5mRSIOver85Sell;
}

module.exports.createRule = createRule;
