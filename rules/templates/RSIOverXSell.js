const { rule, RuleEvents } = require('./../rule');


function createRule(exchange, futureName, candle, RSIReach, sellAmount) {

    const RSIOverXSell = new rule();

    RSIOverXSell.futureName = futureName;
    RSIOverXSell.maxExecution = 1;
    RSIOverXSell.candlePeriod = candle;
    RSIOverXSell.name = `${futureName}${candle}RSIOver${RSIReach}Sell${sellAmount}`;
    let _currentPrice;


    RSIOverXSell.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        const currentRSI = getRSI();
        if (currentRSI < RSIReach) {
            return false;
        }

        console.log(`conditionSatisfied on ${futureName}`);
        return true;
        
        function getRSI() {
            const RSI = technicals[futureName][candle].RSI;
            return Array.isArray(RSI) && RSI.last();
        }
    };

    

    RSIOverXSell.action = () => {
        exchange.sell(futureName, sellAmount);
        RSIOverXSell.events.emit(RuleEvents.ActionExecuted, `${futureName} RSIOverXSell rule executed at price ${_currentPrice}`);
    };

    return RSIOverXSell;
}

module.exports.createRule = createRule;
