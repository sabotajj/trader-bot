const rule = require('./rule').rule

function createRule(exchange) {

    const candle15mPriceIncreaseRule = new rule();

    candle15mPriceIncreaseRule.futureName = 'ALGOUSDT';
    candle15mPriceIncreaseRule.maxExecution = 5;

    candle15mPriceIncreaseRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        if(!candles.candles_15m) return false;
        const ALGOCandles = candles.candles_15m.ALGOUSDT
        const current15mCandle = ALGOCandles[ALGOCandles.length-1];
        const currentPct = getCurrentPct();
        if (currentPct > 0.2) {
            console.log('conditionSatisfied on ALGOUSDT');
            return true;
        }
        return false;

        function getCurrentPct() {
            return current15mCandle && (currentPrice - current15mCandle.open) * 100 / current15mCandle.open;
        }
    };

    candle15mPriceIncreaseRule.action = () => {
        exchange.buy("ALGOUSDT", 10);
    };

    return candle15mPriceIncreaseRule;
}

module.exports.createRule = createRule;
