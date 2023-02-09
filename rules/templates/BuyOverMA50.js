const { rule, RuleEvents } = require('../rule');


function createRule(exchange, futureName, candle, buyAmount) {

    const BuyOnceOverMA50 = new rule();

    BuyOnceOverMA50.futureName = futureName;
    BuyOnceOverMA50.maxExecution = 1;
    BuyOnceOverMA50.candlePeriod = candle;
    BuyOnceOverMA50.name = `${futureName}${candle}Buy${buyAmount}OverMA50`;
    let _currentPrice;


    BuyOnceOverMA50.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        if(getMA50() < getLastCandle().close && getMA50() > getLastCandle().open){
            return true;
        }

        return false;
        
        function getMA50() {
            const MA50 = technicals[futureName][candle].MA50;
            return MA50.last();
        }

        function getLastCandle() {
            /**
             * @type {candle}
             */
            const lastCandle = candles[candle][futureName].last();
            return lastCandle;
        }
    };

    

    BuyOnceOverMA50.action = () => {
        exchange.sell(futureName, buyAmount);
        BuyOnceOverMA50.events(RuleEvents.ActionExecuted, `${futureName} RSIOverXSell rule executed at price ${_currentPrice}`);
    };

    BuyOnceOverMA50.getState = () => {
        return {
            active: BuyOnceOverMA50.active,
            executionTimes: BuyOnceOverMA50.executionTimes,
        };
    };

    return BuyOnceOverMA50;
}

module.exports.createRule = createRule;
