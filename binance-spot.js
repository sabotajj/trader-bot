
const Binance = require('node-binance-api');
const fs = require('fs');
const eventsHelper = require('./events-definitions');
const {getMsOfCandleTime} = require('./helpers')

const config = JSON.parse(fs.readFileSync('config.json')).binance

const binance = new Binance().options({
    APIKEY: config.apiKey,
    APISECRET: config.apiSecret,
    'family': 4,
});
/**
 * 
 * @param {string[]} requiredFutures 
 * @param {*} quotes 
 * @param {*} markPrices 
 * @param {object} candles 
 * @param {*} events 
 * @param {order[]} myOpenOrders
 */
async function init(requiredFutures, quotes, markPrices, candles, events, myPositions, myOpenOrders) {
    const MIN_MS_FOR_INTERVAL = 10000;
    const POSITION_POLL_INTERVAL_MS = 60 * 1000;

    await initPricesStream();
    //await initTicker();
    initCandles(candles);
    //initPositionPoll();
    //initOpenOrderPoll();

    function initOpenOrderPoll() {
        const fetchOpenOrders = () => setTimeout(() => {
            try {
                binance.openOrders(false, (error, openOrders) => {
                if(error) {
                    console.error(error);
                    fetchOpenOrders();
                    return;
                }
                if(!Array.isArray(openOrders))
                {
                    openOrders = [];
                }
                if(myOpenOrders.length > 0) {
                    myOpenOrders.splice(0, myOpenOrders.length);
                }
    
                myOpenOrders.push(...openOrders);
                console.log("orders fetched");
                });
               
                fetchOpenOrders();

            } catch(e) {
                console.error("Error on fetching orders", e);
                fetchOpenOrders();

            }
        }, POSITION_POLL_INTERVAL_MS);
        fetchOpenOrders();
    }
    function initPositionPoll() {
        const fetchPosition = () => setTimeout(() => {
            /**
             * @type {position[]}
             */
                try{
                    binance.balance(false, (error, balances) => {
                        if(error) {
                            console.error(error);
                            fetchPosition();
                            return;
                        }
                        let _myPositions = balances; 
                        if(!_myPositions)
                        {
                            return;
                            _myPositions = null;
                        }
                    
                        for(symbol in _myPositions) {
                            myPositions[symbol] = _myPositions[symbol];
                        }
                        console.log("positions fetched");
                    });
                }
                catch(e) {
                    console.error("Getting balance with error",e);
                    fetchPosition();
                }
            fetchPosition();
        }, POSITION_POLL_INTERVAL_MS);
        fetchPosition();
    }
    async function initPricesStream() {
        
        setInterval(() => { 
                binance.bookTickers((error, ticker) => {
                if(!ticker) return;
                if(error) {
                    console.error("Cannot update prices", error);
                    return;
                }

                const pricesMapped = ticker.map(tick => [tick.symbol, {markPrice: tick.bidPrice, ...tick}]);
                const oldMarkPrices = { ...markPrices};
                updateObject(markPrices, pricesMapped);
                eventsHelper.emitPriceEvents(markPrices, oldMarkPrices, events, requiredFutures);
            });
        }, 1000);
    }
   
    async function initCandles() {

        const init1m = candleInitializer('1m');
        const init5m = candleInitializer('5m');
        const init15m = candleInitializer('15m');

        init1m();
        init5m();
        init15m();
        
        loopExecute1mCandleUpdate();
        loopExecute5mCandleUpdate();
        loopExecute15mCandleUpdate();

        function candleInitializer(candleTime) {
            let candlesAreUpdated = true;
            const candleCollectionName = `candles_${candleTime}`;
            return () => {
                requiredFutures.map(pair => {
                        return new Promise((res, rej)=> {
                            binance.candlesticks(pair, candleTime, (error, apiCandlesResult, symbol) => {
                                if(error) {
                                    rej(error);
                                    return;
                                }
                                res ({
                                    candles: apiCandlesResult,
                                    pair : symbol,
                                });
                            });
                        });
                }).map(async candlesPromise => {
                    let pairName;
                    try {
                        const chartCandles = await candlesPromise;
                        pairName = chartCandles.pair;

                        if (!isCandlesAreNew(chartCandles)) {
                            // console.log(`future ${pairName} ${candleCollectionName} still not updated on binance.`);
                            candlesAreUpdated = false;
                            return;
                        }

                        addCandlesToArray(chartCandles);
                        // console.log(`future ${futureName} ${candleCollectionName} is updated`);
                        eventsHelper.emitCandleEvents(candles, pairName, candleTime, events);
                    } catch (error) {
                        console.log(`Error while updating candles, ${candleCollectionName}, ${pairName}. Error: ${error.message}`);
                    }

                    function addCandlesToArray(pairCandles) {
                        if(!Array.isArray(pairCandles.candles)){
                            throw new Error(`${candleCollectionName} for ${pairName} is not valid. Skipping`)
                        }
                        /**
                         * @type {candle[]}
                         */
                        const candlesObjects = pairCandles.candles.map(candlesParser);
                        if (candles[candleCollectionName] == undefined) {
                            candles[candleCollectionName] = {};
                        }
                        candles[candleCollectionName][pairName] = candlesObjects;
                    }
                    
                    function isCandlesAreNew(pairCandles) {
                        const lastCandleInMemory = candles
                            && candles[candleCollectionName]
                            && candles[candleCollectionName][pairCandles.pair]
                            && candles[candleCollectionName][pairCandles.pair].last();

                        if (lastCandleInMemory == undefined) return true;

                        const lastReceivedCandle = candlesParser(pairCandles.candles.last());
                        if (lastReceivedCandle.closeTime == lastCandleInMemory.closeTime) {
                            return false;
                        }
                        return true;
                    }

                });
                return candlesAreUpdated;
            }

        }
        function loopExecute1mCandleUpdate() {
            const interval = getMsOfCandleTime('1m')/10;

            const set1mInterval = () => {
                setTimeout(async () => {
                    await executeInit(init1m, '1m');

                    // console.log(`1m candles will be updated in ${interval  / 1000} secs`);
                    set1mInterval();
                }, interval);
            };
            set1mInterval();
        }
        function loopExecute5mCandleUpdate() {
            const interval = getMsOfCandleTime('5m')/10;

            const set5mInterval = () => {
                setTimeout(async () => {
                    await executeInit(init5m, '5m');

                    // console.log(`5m candles will be updated in ${interval / 1000} secs`);
                    set5mInterval();
                }, interval);
            };
            set5mInterval();
        }

        function loopExecute15mCandleUpdate() {
            const interval = getMsOfCandleTime('15m')/10;

            const set15mInterval = () => {
                setTimeout(async () => {
                    await executeInit(init15m, '15m');

                    // console.log(`15m candles will be updated in ${interval / 1000} secs`);
                    set15mInterval();
                }, interval);
            };
            set15mInterval();
        }
    

    }


    async function executeInit(initFunction, candleTime) {
        let updateSuccess = false;
        try {
            updateSuccess = await initFunction();
        } catch (err) {
            console.log(`Error occured, Trying updating ${candleTime} again`, err)
        }
        return updateSuccess;
    }

}


function updateObject(object, dataArray) {
    if (!dataArray) return;
    dataArray.reduce(async (_, data) => {
        if (!data || !data[0] || !data[1]) return;
        const key = data[0];
        const value = data[1];
        object[key] = value;
    })
}




/**
* @param {Array<number>} candleArray 
* @returns {candle}
*/
function candlesParser(candleArray) {
    if (!candleArray) return;
    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = candleArray;
    
    return {
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored
    };
}

async function sell(pair, amount, reduceOnly) {

    console.log('Binance Exchange', 'Received Sell Order', pair, amount);
    try {
        await binance.marketSell(pair, amount);
    }
    catch(e){
        console.log("Something wrong with sell order", e);
    }
}

async function buy(pair, amount) {
    console.log('Binance Exchange', 'Received Buy Order', pair, amount);
    try {
        await binance.marketBuy(pair, amount);
    }
    catch(e) {
        console.log("Something wrong with buy order. ", e);
    }
}

/**
 * @param {order[]} orders 
 */
function sendBatchOrders() {
    throw new Error("Not supported");
}
/**
 * 
 * @returns {order}
 */
function orderParser(order){
    const result = {
        symbol: order.symbol, 
        type: order.type, 
        side: order.side, 
        quantity: order.quantity || order.origQty,
        timeInForce: "GTC",
        reduceOnly: order.reduceOnly.toString(),
        price: order.price,
        stopPrice: order.stopPrice || 0,
    };

    return result;
}

const ORDER_SIDE = {
    BUY: "BUY",
    SELL: "SELL"
}

const ORDER_TYPE = {
    MARKET: "MARKET", LIMIT: "LIMIT"
}

module.exports = {
    init,
    sell,
    buy,
    sendBatchOrders,
};