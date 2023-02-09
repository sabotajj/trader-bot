const rule = require('./rule').rule

function createRule(exchange) {

    const matic15mRSIOver70Sell = new rule();

    matic15mRSIOver70Sell.futureName = 'MATICUSDT';
    matic15mRSIOver70Sell.maxExecution = 5;
    matic15mRSIOver70Sell.candlePeriod = 'candles_15m';


    matic15mRSIOver70Sell.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        const RSI = technicals.MATICUSDT.candles_15m.RSI;
        const currentRSI = RSI[RSI.length-1];
        if (currentRSI > 70) {
            console.log('conditionSatisfied on MATICUSDT');
            return true;
        }
        console.log('RSI', currentRSI, 'Not satisfied');
        return false;
    };

    matic15mRSIOver70Sell.action = () => {
        exchange.sell("MATICUSDT", 10);
    };

    return matic15mRSIOver70Sell;
}

module.exports.createRule = createRule;
