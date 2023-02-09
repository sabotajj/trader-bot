const { rule, RuleEvents } = require('./rule');

/**
 * 
 * @type {createRule} 
 */
function createRule(exchange) {

    const mana15mRSIBelow80Buy = new rule();

    mana15mRSIBelow80Buy.futureName = 'MANAUSDT';
    mana15mRSIBelow80Buy.maxExecution = 500;
    mana15mRSIBelow80Buy.candlePeriod = 'candles_15m';
    mana15mRSIBelow80Buy.name = 'mana15mRSIBelow80Buy';
    let buyAmount = 0;
    let buyAmountFactor = 4;
    let _currentPrice;

    mana15mRSIBelow80Buy.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
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

        console.log('conditionSatisfied on MANA');

        return true;

        function getMA10() {
            const SMA10 = technicals[mana15mRSIBelow80Buy.futureName]
            [mana15mRSIBelow80Buy.candlePeriod]
            .SMA10
            return Array.isArray(SMA10) && SMA10.last();
        }

        function getRSI() {
            const RSI = technicals
                [mana15mRSIBelow80Buy.futureName]
                [mana15mRSIBelow80Buy.candlePeriod]
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
                [mana15mRSIBelow80Buy.candlePeriod]
                [mana15mRSIBelow80Buy.futureName];
         
            return Array.isArray(futureCandles) && futureCandles.last();
        }
    };

    mana15mRSIBelow80Buy.action = () => {
        exchange.buy("MANAUSDT", buyAmount);
        mana15mRSIBelow80Buy.events.emit(RuleEvents.ActionExecuted, `Bought ${buyAmount} at price ${_currentPrice}`);
    };

    return mana15mRSIBelow80Buy;
}

module.exports.createRule = createRule;
