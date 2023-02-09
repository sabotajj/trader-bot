const {rule, RuleEvents} = require('../rule')

function createRule(exchange, futureName, candle, trailingPct, buyAmount) {


    const trailingStopXPct = new rule();
    let lastStopPrice = 10000000;
    trailingStopXPct.futureName = futureName;
    trailingStopXPct.maxExecution = 1;
    trailingStopXPct.candlePeriod = candle;
    trailingStopXPct.name = `${futureName}${candle}TrailingFrom${trailingPct}PctBuy${buyAmount}`;
    let _currentPrice;


    trailingStopXPct.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        _currentPrice = currentPrice;
        setStopPrice(Math.min(getTrailingStopPrice(), lastStopPrice));
        return lastStopPrice < currentPrice;

        function getTrailingStopPrice() {
            return currentPrice * (trailingPct + 100)/100;
        }

        function setStopPrice(value) {
            if(value != lastStopPrice) {
                trailingStopXPct.events.emit(RuleEvents.SettingChange, `buyStopPrice ${lastStopPrice}`);
            }
            
            lastStopPrice = value;
        }
    };

    trailingStopXPct.action = async () => {
        exchange.buy(futureName, buyAmount);
        lastStopPrice = 10000000;
        trailingStopXPct.events.emit(RuleEvents.ActionExecuted, `${trailingStopXPct.name} executed at price ${_currentPrice}`)
    };

    trailingStopXPct.getState = () => {
        return {
            stopPrice: lastStopPrice,
            active: trailingStopXPct.active,
            executionTimes: trailingStopXPct.executionTimes,
            amount: buyAmount,
            percent: trailingPct,
        };
    };

    trailingStopXPct.changeSetting = ({stopPrice, active, amount, percent}) => {
        if(stopPrice>0) lastStopPrice = stopPrice;
        if(active) trailingStopXPct.active = active;
        if(buyAmount>0) buyAmount = amount;
        if(percent>0) trailingPct = +percent;
    };

    return trailingStopXPct;
}

module.exports.createRule = createRule;
