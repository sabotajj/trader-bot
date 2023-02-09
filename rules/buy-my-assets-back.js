const {rule, RuleEvents} = require('./rule');
require('./../type-defs')

/**
 * 
 * @type {createRule}
 */
function createRule(exchange, myPositions, myOpenOrders) {

    const buyMyAssetsBack = new rule();

    buyMyAssetsBack.futureName = 'ALGOUSDT';
    buyMyAssetsBack.maxExecution = 1;
    buyMyAssetsBack.candlePeriod = 'candles_5m';
    buyMyAssetsBack.active = false;
    buyMyAssetsBack.name = "BuyMyAssetsBack";
    buyMyAssetsBack.executeOnceInPeriod = false;

    /**
     * @type {position[]}
     */
    let savedPositions = [];
    /** @type {order[]} */
    let savedOpenOrders = [];


    buyMyAssetsBack.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        return true;
    };

    buyMyAssetsBack.action = async (asset) => {
        buyMyAssetsBack.active=false;
        if(!asset) asset = 'all';

        if(asset!='all') {
            asset = asset.length < 6 ? asset + 'USDT' : asset;

            const position = savedPositions[asset];
		    if(!position) return;	
            if(position.positionAmt == 0) {
                return;
            }
            return exchange.buy(position.symbol, position.positionAmt);
        }

        for(const _asset in savedPositions) {
            const position = savedPositions[_asset];
            if(position.positionAmt == 0) {
                continue;
            }

            await exchange.buy(position.symbol, position.positionAmt);
            buyMyAssetsBack.events.emit(RuleEvents.ActionExecuted, 
                `${position.symbol} bought ${position.positionAmt} back.`);
        }
    };
    buyMyAssetsBack.restoreOrders = async () => {
        await exchange.sendBatchOrders(savedOpenOrders);
        savedOpenOrders.forEach(order => {
            buyMyAssetsBack.events.emit(RuleEvents.ActionExecuted, 
                `${order.symbol}(${order.origQty}) order  back at price ${order.price}`);
        });
    }
    buyMyAssetsBack.savePositions = () => {
        savedPositions = {...myPositions};

        for(const asset in savedPositions) {
            const position = savedPositions[asset];
            if(position.positionAmt == 0) { continue; }

            buyMyAssetsBack.events.emit(RuleEvents.ActionExecuted, `${position.symbol} (${position.positionAmt}) saved`);
        }
    };

    buyMyAssetsBack.saveOpenOrders = () => {
        if(myOpenOrders && myOpenOrders.length>0) {
            savedOpenOrders = [...myOpenOrders];
        }
        else savedOpenOrders = [];

        savedOpenOrders.forEach(order => buyMyAssetsBack.events.emit(RuleEvents.ActionExecuted, `Order of ${order.symbol}(${order.origQty}) saved`));
    };

    buyMyAssetsBack.getState = () => {
        return {
            savedOpenOrders,
            savedPositions,
            active: buyMyAssetsBack.active,
            executionTimes: buyMyAssetsBack.executionTimes,
        };
    };



    return buyMyAssetsBack;
}

module.exports.createRule = createRule;
