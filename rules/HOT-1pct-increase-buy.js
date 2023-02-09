const rule = require('./rule').rule;

function createRule(exchange) {

    const candle15mPriceIncreaseRule = new rule();

    candle15mPriceIncreaseRule.futureName = 'HOTUSDT';
    candle15mPriceIncreaseRule.maxExecution = 1;
    candle15mPriceIncreaseRule.candlePeriod = 'candles_15m';

    candle15mPriceIncreaseRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        if(!candles.candles_15m) return false;

        const current15mCandle = getCurrent15mCandle();
        if(getPrevious15mCandle().high > current15mCandle.close) {
            return false;
        }

        function getCurrent15mCandle() {
            return candles.candles_15m[candle15mPriceIncreaseRule.futureName].last();
        }

        function getPrevious15mCandle() {
            const hotCandles = candles.candles_15m[candle15mPriceIncreaseRule.futureName];
            return hotCandles[hotCandles.length-2];
        }
    }
    candle15mPriceIncreaseRule.action = () => {
        exchange.buy(candle15mPriceIncreaseRule.futureName, 55000);
    }

    return candle15mPriceIncreaseRule;
}

module.exports.createRule = createRule;
