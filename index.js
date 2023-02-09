const os = require('os-utils');
const binanceLayer = require('./binance-spot');
const eventsHelper = require('./events-definitions');
const ruleExecutor = require('./rule-executor');
const technicalsCalculator = require('./technicals');
const messengerBotInitiator = require('./telegram');
const stateSaver = require('./state-saver');
const requiredFutures = [
    'ADAUSDT',
    'ALGOUSDT',
    'MATICUSDT',
    'HOTUSDT',
    "BTCUSDT",
    "AVAXUSDT",
    "NEARUSDT",
    "DOGEUSDT",
];
const chartsWatched = ['price', 'candles_1m','candles_5m', 'candles_15m'];
require('./helpers');

let quotes = {};
let markPrices = {};
let candles = {};
let events = {}; 
let technicals = {};
let messenger = {};
let myPositions = {};
let myOpenOrders = [];
async function main() {
    events = eventsHelper.eventsInit(requiredFutures, chartsWatched);
    await binanceLayer.init(requiredFutures, quotes, markPrices, candles, events, myPositions, myOpenOrders);
    technicalsCalculator.init(quotes, markPrices, candles, technicals, events);
    ruleExecutor.init(binanceLayer, quotes, markPrices, candles, technicals, events, myPositions, myOpenOrders);
    messenger = messengerBotInitiator.init(markPrices);

    const restoreIsRequested = process.argv[2] == 'restore';
    stateSaver.init(restoreIsRequested);
    // setInterval(printStats,1000);
    // setupPriceListener();
    // setupCandleListener();
}


// some tests down here

const printStats = async () => {

    os.cpuUsage(function(v){
        console.log(`CPU Usage (%): ${v.toFixed(2)}. Total Executions: ${ruleExecutor.totalExecution}`);
    });
}


const setupPriceListener = () => {
    events.ADAUSDT.price.on(eventsHelper.EventsEnum.UPDATE, (newPrice) => {
       console.log("ADAUSDT price updated", newPrice);
    });
};

const setupCandleListener = () => {
    events.ADAUSDT.candles_5m.on(eventsHelper.EventsEnum.UPDATE, () => {
       console.log("ADAUSDT 5m candle updated");
    });
};


main();


