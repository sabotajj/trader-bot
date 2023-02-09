const { rule, RuleEvents } = require('./rule');


function createRule(exchange) {

    const candle5mPriceIncreaseRule = new rule();

    candle5mPriceIncreaseRule.name = 'buyAlgoWhenRSIIsGreaterThan30AndAboveMA10';
    candle5mPriceIncreaseRule.futureName = 'ALGOUSDT';
    candle5mPriceIncreaseRule.maxExecution = 50;
    candle5mPriceIncreaseRule.candlePeriod = 'candles_5m';
    const buyAmountFactor = 20;
    const minuteInterval = 10;
    let buyAmount = 10;

    candle5mPriceIncreaseRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        
        if(candle5mPriceIncreaseRule.executedOnThisCandle) {
            return false;
        }

        const nowMinute = (new Date()).getMinutes();
        if(nowMinute % minuteInterval != 1) {
            return false;
        }
        

        const RSI = technicals.ALGOUSDT.candles_5m.RSI;
        const currentRSI = Array.isArray(RSI) && RSI.last();

        if(currentRSI < 30) {
            return false;
        }

        //const MA10 = technicals.ALGOUSDT.candles_5m.SMA10.last();

        // if(currentPrice < MA10) {
        //     return false;
        // }
        
        buyAmount = Math.floor((100-currentRSI))/100 * buyAmountFactor;
        
        return true;
    };

    candle5mPriceIncreaseRule.action = () => {
        console.log(new Date(), `Buying ALGOUSDT amount: ${buyAmount}`)
        exchange.buy("ALGOUSDT", buyAmount);
        candle5mPriceIncreaseRule.events.emit(RuleEvents.ActionExecuted, `Bought algo`);
    };

    return candle5mPriceIncreaseRule;
}

module.exports.createRule = createRule;
