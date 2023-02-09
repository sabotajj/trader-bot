const {rule, RuleEvents} = require('../rule')

function createRule(exchange, futureName, targetPrice, myPositions) {


    const buyAssetWhenXisPriceY = new rule();
    buyAssetWhenXisPriceY.futureName = futureName;
    buyAssetWhenXisPriceY.maxExecution = 1;
    buyAssetWhenXisPriceY.candlePeriod = candle;
    buyAssetWhenXisPriceY.name = `${candle}BuyAllWhen${futureName}Is${targetPrice}`;
    let initPrice;
    let savedPositions;

    buyAssetWhenXisPriceY.conditionToStart = (currentPrice, quotes, markPrices, candles, technicals) => {
        if(!initPrice) {
            initPrice = currentPrice > targetPrice
                ? 100000000
                : 0;
        }

        return !between(currentPrice, initPrice, targetPrice);
        
        /**
         * @param {number} checkValue 
         * @param {number} value1 
         * @param {number} value2 
         * @returns {boolean}
         */
        function between(checkValue, value1, value2) {
            const situation1 = value1<checkValue && checkValue<value2;
            const situation2 = value2<checkValue && checkValue<value1;

            return situation1 || situation2;
        }
    };

    buyAssetWhenXisPriceY.action = async (asset) => {
        buyAssetWhenXisPriceY.active=false;
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
            buyAssetWhenXisPriceY.events.emit(RuleEvents.ActionExecuted, 
                `${position.symbol} bought ${position.positionAmt} back.`);
        }
    };

    buyAssetWhenXisPriceY.savePositions = () => {
        savedPositions = {...myPositions};

        for(const asset in savedPositions) {
            const position = savedPositions[asset];
            if(position.positionAmt == 0) { continue; }

            buyAssetWhenXisPriceY.events.emit(RuleEvents.ActionExecuted, `${position.symbol} (${position.positionAmt}) saved`);
        }
    };

    buyAssetWhenXisPriceY.getState = () => {
        return {
            active: buyAssetWhenXisPriceY.active,
            executionTimes: buyAssetWhenXisPriceY.executionTimes,
            targetPrice,
            initPrice,
        };
    };

    buyAssetWhenXisPriceY.changeSetting = ({targetPrice: _targetPrice, active, initPrice: _initPrice}) => {
        if(active) buyAssetWhenXisPriceY.active = active;
        if(_targetPrice) targetPrice = _targetPrice;
        if(_initPrice) initPrice = _initPrice;
    };

    return buyAssetWhenXisPriceY;
}

module.exports.createRule = createRule;
