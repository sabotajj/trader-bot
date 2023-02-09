const rule = require('./rule').rule

function createRule(exchange) {

    const candle15mPriceIncreaseRule = new rule();

    candle15mPriceIncreaseRule.name = 'buyMaticWhenRSIIsGreaterThan30';
    candle15mPriceIncreaseRule.futureName = 'MATICUSDT';
    candle15mPriceIncreaseRule.maxExecution = 50;
    candle15mPriceIncreaseRule.candlePeriod = 'candles_15m';
    const buyAmountFactor = 20;
    let buyAmount = 10;

    candle15mPriceIncreaseRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        
        const currentRSI = getRSI();
        if(currentRSI < 30) {
            return false;
        }

        const currentMA10 = getMA10();
        if(currentMA10 > currentPrice) {
            return false;
        }

        buyAmount = Math.floor((100-currentRSI)/100 * buyAmountFactor);
        
        console.log("rule will execute", 
            "currentPrice", currentPrice, 
            "currentMA10", currentMA10, 
            "currentRSI", currentRSI);
        return true;

        function getRSI() {
            const RSI = technicals[candle15mPriceIncreaseRule.futureName][candle15mPriceIncreaseRule.candlePeriod].RSI;
            return RSI && RSI.last();
        }

        function getMA10() {
            const MA10 = technicals.MATICUSDT[candle15mPriceIncreaseRule.candlePeriod].SMA10; 
            return MA10.last();
        }
        
    };

    candle15mPriceIncreaseRule.action = () => {
        console.log(new Date(), `Buying MATICUSDT amount: ${buyAmount}`)
        exchange.buy("MATICUSDT", buyAmount);
    };

    return candle15mPriceIncreaseRule;
}

module.exports.createRule = createRule;
