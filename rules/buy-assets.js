const {rule, RuleEvents} = require('./rule');
require('../type-defs')

/**
 * @param {exchange} exchange
 * @type {createRule}
 */
function createRule(exchange, myPositions, myOpenOrders) {

    const buyAssets = new rule();

    buyAssets.futureName = 'ALGOUSDT';
    buyAssets.maxExecution = 1;
    buyAssets.candlePeriod = 'candles_5m';
    buyAssets.active = false;
    buyAssets.name = "BuyAssets";
    buyAssets.executeOnceInPeriod = false;

    /**
     * @type {position[]}
     */
    let savedPositions = [];
    /** @type {order[]} */
    let savedOpenOrders = [];


    buyAssets.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        return true;
    };

    buyAssets.action = async (asset, amount) => {
        buyAssets.active=false;
        asset = asset.length < 6 ? asset + 'USDT' : asset;
        await exchange.buy(asset, amount); 
        buyAssets.events.emit(RuleEvents.ActionExecuted, 
            `${asset} bought ${amount}.`);
    };
 
    return buyAssets;
}

module.exports.createRule = createRule;
