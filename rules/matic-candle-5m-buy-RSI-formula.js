const rule = require('./rule').rule

function createRule(exchange) {

    const candle5mPriceIncreaseRule = new rule();

    candle5mPriceIncreaseRule.name = 'buyMaticWhenRSIIsGreaterThan30AndAboveMA10';
    candle5mPriceIncreaseRule.futureName = 'MATICUSDT';
    candle5mPriceIncreaseRule.maxExecution = 50;
    candle5mPriceIncreaseRule.candlePeriod = 'candles_5m';
    const buyAmountFactor = 20;
    const minuteInterval = 5;
    let buyAmount = 10;

    candle5mPriceIncreaseRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        
        if(candle5mPriceIncreaseRule.executedOnThisCandle) {
            return false;
        }

        const nowMinute = (new Date()).getMinutes();
        if(nowMinute % minuteInterval != 1) {
            return false;
        }
        

        const RSI = technicals.MATICUSDT.candles_5m.RSI;
        const currentRSI = RSI.last();

        if(currentRSI < 30) {
            return false;
        }

        //const MA10 = technicals.MATICUSDT.candles_5m.SMA10.last();

        // if(currentPrice < MA10) {
        //     return false;
        // }
        
        buyAmount = Math.floor((100-currentRSI))/100 * buyAmountFactor;
        
        console.log("rule will execute");
        return true;
        
    };

    candle5mPriceIncreaseRule.action = () => {
        console.log(`Buying MATICUSDT amount: ${buyAmount}`)
        exchange.buy("MATICUSDT", buyAmount);
    };

    return candle5mPriceIncreaseRule;
}

module.exports.createRule = createRule;
