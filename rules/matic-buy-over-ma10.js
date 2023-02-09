const { rule, RuleEvents } = require('./rule');

/**
 * 
 * @type {createRule} 
 */
function createRule(exchange) {

    const matic15mRSIBelow80Buy = new rule();

    matic15mRSIBelow80Buy.futureName = 'MATICUSDT';
    matic15mRSIBelow80Buy.maxExecution = 30;
    matic15mRSIBelow80Buy.candlePeriod = 'candles_15m';
    matic15mRSIBelow80Buy.name = 'matic15mRSIBelow80Buy';
    let buyAmount = 0;
    let buyAmountFactor = 4;
    let _currentPrice;

    matic15mRSIBelow80Buy.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        if (getMA10() > getCurrentCandle().close) {
            return false;
        }

        const currentRSI = getRSI();

        if(currentRSI>60) {
            return false;
        }

        if(currentRSI<25) {
            return false;
        }

        buyAmount = getBuyAmount();

        console.log('conditionSatisfied on MATIC');

        return true;

        function getMA10() {
            const SMA10 = technicals[matic15mRSIBelow80Buy.futureName]
            [matic15mRSIBelow80Buy.candlePeriod]
            .SMA10
            return Array.isArray(SMA10) && SMA10.last();
        }

        function getRSI() {
            const RSI = technicals
                [matic15mRSIBelow80Buy.futureName]
                [matic15mRSIBelow80Buy.candlePeriod]
                .RSI;
            return Array.isArray(RSI) && RSI.last();
        }

        function getBuyAmount() {
            return Math.floor((100-currentRSI)/10 * (100-currentRSI)/10 * buyAmountFactor);
        }

        /**
         * 
         * @returns {candle}
         */
        function getCurrentCandle(){
            const futureCandles = candles
                [matic15mRSIBelow80Buy.candlePeriod]
                [matic15mRSIBelow80Buy.futureName];
         
            return Array.isArray(futureCandles) && futureCandles.last();
        }
    };

    matic15mRSIBelow80Buy.action = () => {
        exchange.buy("MATICUSDT", buyAmount);
        matic15mRSIBelow80Buy.events.emit(RuleEvents.ActionExecuted, `Bought ${buyAmount} at price ${_currentPrice}`);
    };

    return matic15mRSIBelow80Buy;
}

module.exports.createRule = createRule;
