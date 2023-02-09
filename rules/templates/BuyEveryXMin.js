const {rule, RuleEvents} = require('./../rule')

function createRule(exchange, futureName, candle, minuteInterval, RSIReach, buyAmount, executionTimes) {


    const buyEveryXMin = new rule();

    buyEveryXMin.futureName = futureName;
    buyEveryXMin.maxExecution = executionTimes;
    buyEveryXMin.candlePeriod = candle;
    buyEveryXMin.name = `${futureName}${candle}BuyEvery${minuteInterval}IfBelow${RSIReach}`;
    buyEveryXMin.executeOnceInPeriod = false;
    let _currentPrice;


    buyEveryXMin.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        if(buyEveryXMin.executedOnThisCandle) return false;
        
        if(RSIReach < getRSI()){
            return false;
        }

        buyEveryXMin.executedOnThisCandle = true;
        setTimeout(() => buyEveryXMin.executedOnThisCandle = false, minuteInterval * 60 * 1000);
        return true;

        function getRSI() {
            const RSI = technicals[futureName][candle].RSI;
            return Array.isArray(RSI) && RSI.last();
        }
    };

    buyEveryXMin.action = async () => {
        exchange.buy(futureName, buyAmount);
        buyEveryXMin.events.emit(RuleEvents.ActionExecuted, `${buyEveryXMin.name} executed at price ${_currentPrice}`)
    };
    
    buyEveryXMin.changeSetting = ({minute, amount}) => {
        if(minute>0) minuteInterval = minute;
        if(amount>0) buyAmount = amount;
    };

    buyEveryXMin.getState = () => {
        return {
            active: buyEveryXMin.active,
            executionTimes: buyEveryXMin.executionTimes,
            minute: minuteInterval,
            amount: buyAmount,
        };
    };

    return buyEveryXMin;
}

module.exports.createRule = createRule;
