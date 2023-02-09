const rule = require('./rule').rule;

function createRule(exchange) {

    const alertRule = new rule();
    const alertInterval = 5; //min
    alertRule.futureName = 'HOTUSDT';
    alertRule.maxExecution = 10000000;
    alertRule.candlePeriod = 'candles_15m';
    alertRule.name = `5Min5PctPumpAlert`;
    
    let oldMarkPrices;
    let foundPumps = [];
    alertRule.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        if(foundPumps.length > 0) return false;
        setTimeout(() => oldMarkPrices = markPrices, alertInterval * 1000 * 60);
        if(!oldMarkPrices) return false;

        for(const pair in markPrices) {
            const oldPrice = oldMarkPrices[pair].markPrice;
            const newPrice = markPrices[pair].markPrice;
            const pct = calculatePct(oldPrice, newPrice);

            if(pct > 5) foundPumps.push({pair, pct});
        }
        return foundPumps.length;
    }
    alertRule.action = () => {
        foundPumps.forEach(({pair, pct}) => {
            alertRule.events.emit(RuleEvents.ActionExecuted, `${pair} pumping ${pct} %`);
        });

        foundPumps = [];
    }
    calculatePct = (oldPrice, newPrice) => {

        return (newPrice - oldPrice) * 100 / oldPrice;
    };
    return alertRule;
}

module.exports.createRule = createRule;
