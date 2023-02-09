const { rule, RuleEvents } = require('./../rule');

function createRule(exchange, futureName, candle, buyAmount) {

    const goldenCross = new rule();

    goldenCross.futureName = futureName;
    goldenCross.maxExecution = 15;
    goldenCross.candlePeriod = candle;
    goldenCross.name = `${futureName}${candle}Buy${buyAmount}WhenGoldenCross`;
    let buyAmountFactor = buyAmount;
    let _currentPrice;

    goldenCross.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        if(getMA10() < getMA200()) {
            return false;
        }
        
        if (getMA10() > getCurrentCandle().close) {
            return false;
        }

        const currentRSI = getRSI();

        if(currentRSI>80) {
            return false;
        }

        if(currentRSI<25) {
            return false;
        }

        buyAmount = Math.floor((100-currentRSI)/100 * buyAmountFactor);

        console.log('conditionSatisfied on MANA');

        return true;

        function getMA10() {
            const SMA10 = technicals
            [goldenCross.futureName]
            [goldenCross.candlePeriod]
            .SMA10;
            return Array.isArray(SMA10) && SMA10.last();
        }

        function getMA50() {
            return technicals
                [goldenCross.futureName]
                [goldenCross.candlePeriod]
                .SMA50.last();
        }

        function getMA200() {
            return technicals
                [goldenCross.futureName]
                [goldenCross.candlePeriod]
                .SMA200.last();
        }

        function getRSI() {
            const RSI = technicals
                [goldenCross.futureName]
                [goldenCross.candlePeriod]
                .RSI;
            return RSI.last();
        }

        /**
         * 
         * @returns {candle}
         */
        function getCurrentCandle(){
            return candles
            [goldenCross.candlePeriod]
            [goldenCross.futureName]
            .last();
        }
    };

    goldenCross.action = () => {
        exchange.buy(futureName, buyAmount);
        goldenCross.events.emit(RuleEvents.ActionExecuted, `Bought ${buyAmount} at price ${_currentPrice}`);
    };

    return goldenCross;
}

module.exports.createRule = createRule;
