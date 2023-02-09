
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
    await initTicker();
    initCandles(candles);
    initPositionPoll();
    initOpenOrderPoll();

    function initOpenOrderPoll() {
        const fetchOpenOrders = () => setTimeout(async () => {
            
            try {
                let _myOpenOrders = await binance.futuresOpenOrders();
                if(!Array.isArray(_myOpenOrders))
                {
                    _myOpenOrders = [];
                }
                if(myOpenOrders.length > 0) {
                    myOpenOrders.splice(0, myOpenOrders.length);
                }

                myOpenOrders.push(..._myOpenOrders);
                console.log("orders fetched");
            } catch(e) {

            }
            fetchOpenOrders();
        }, POSITION_POLL_INTERVAL_MS);
        fetchOpenOrders();
    }
    function initPositionPoll() {
        const fetchPosition = () => setTimeout(async () => {
            /**
             * @type {position[]}
             */
            try {
                let _myPositions = await binance.futuresPositionRisk();
                if(!Array.isArray(_myPositions))
                {
                    _myPositions = [];
                }

                for(position of _myPositions) {
                    myPositions[position.symbol] = position;
                }
                console.log("positions fetched");
            } catch(e) {

            }
            fetchPosition();
        }, POSITION_POLL_INTERVAL_MS);
        fetchPosition();
    }
    async function initPricesStream() {
        try {
            await binance.futuresMarkPriceStream(prices => {
                const pricesMapped = prices.map(ticker => [ticker.symbol, ticker]);
                const oldMarkPrices = { ...markPrices };
                updateObject(markPrices, pricesMapped);
                eventsHelper.emitPriceEvents(markPrices, oldMarkPrices, events, requiredFutures);
            });
        } catch (err) {
            console.log("error occured in price websocket. Trying again");
            setTimeout(initPricesStream, MIN_MS_FOR_INTERVAL);
        }
    }
    async function initTicker() {
        try {
            await binance.futuresMiniTickerStream(miniTicker => {
                const miniTickerMapped = miniTicker.map(ticker => [ticker.symbol, ticker]);
                updateObject(quotes, miniTickerMapped);
            });
        } catch (err) {
            console.log("error occured while getting tickers. Trying again");
            setTimeout(initTicker, MIN_MS_FOR_INTERVAL);
        }
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
                requiredFutures.map(async future => {
                    try {
                        const apiCandlesResult = await binance.futuresCandles(future, candleTime);

                        return {
                            candles: apiCandlesResult,
                            future,
                        }
                    } catch {
                        console.log("Error when fetching candles.");
                        return [];
                    }
                }).map(async futureCandlesPromise => {
                    let futureName;
                    try {
                        const futureCandles = await futureCandlesPromise;
                        futureName = futureCandles.future;

                        if (!isCandlesAreNew(futureCandles)) {
                            // console.log(`future ${futureName} ${candleCollectionName} still not updated on binance.`);
                            candlesAreUpdated = false;
                            return;
                        }

                        addCandlesToArray(futureCandles);
                        // console.log(`future ${futureName} ${candleCollectionName} is updated`);
                        eventsHelper.emitCandleEvents(candles, futureName, candleTime, events);
                    } catch (error) {
                        console.log(`Error while updating candles, ${candleCollectionName}, ${futureName}. Error: ${error.message}`);
                    }

                    function addCandlesToArray(futureCandles) {
                        if(!Array.isArray(futureCandles.candles)){
                            throw new Error(`${candleCollectionName} for ${futureName} is not valid. Skipping`)
                        }
                        /**
                         * @type {candle[]}
                         */
                        const candlesObjects = futureCandles.candles.map(candlesParser);
                        if (candles[candleCollectionName] == undefined) {
                            candles[candleCollectionName] = {};
                        }
                        candles[candleCollectionName][futureName] = candlesObjects;
                    }
                    
                    function isCandlesAreNew(futureCandles) {
                        const lastCandleInMemory = candles
                            && candles[candleCollectionName]
                            && candles[candleCollectionName][futureCandles.future]
                            && candles[candleCollectionName][futureCandles.future].last();

                        if (lastCandleInMemory == undefined) return true;

                        const lastReceivedCandle = candlesParser(futureCandles.candles.last());
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

async function sell(futureName, amount, reduceOnly) {
    if (!reduceOnly) reduceOnly = true;

    console.log('Binance Exchange', 'Received Sell Order', futureName, amount);
    try {
        await binance.futuresMarketSell(futureName, amount, { reduceOnly });
    }
    catch(e){
        console.log("Something wrong with sell order", e);
    }
}

async function buy(futureName, amount) {
    console.log('Binance Exchange', 'Received Buy Order', futureName, amount);
    try {
        await binance.futuresMarketBuy(futureName, amount);
    }
    catch(e) {
        console.log("Something wrong with buy order. ", e);
    }
}

/**
 * @param {order[]} orders 
 */
async function sendBatchOrders(orders) {
    const response = await binance.futuresMultipleOrders(orders.map(orderParser));
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