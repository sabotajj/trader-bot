const {RSI, SMA} = require('technicalindicators');
const EventsEnum = require('./events-definitions').EventsEnum;

function init(quotes, markPrices, candles, technicals, events) {
    for(const future in events) {
        const futureEvents = events[future];
        if(!technicals[future]) technicals[future] = {};

        
        for(const eventCategory in futureEvents) {
            if(eventCategory == 'price') continue;

            if(!technicals[future][eventCategory]) 
            {
                technicals[future][eventCategory] = {};
            }

            futureEvents[eventCategory].on(EventsEnum.UPDATE, () => {
                inputCandles = candles[eventCategory][future];
                calculateRSI(inputCandles)
                    .then(result => technicals[future][eventCategory].RSI = result);
                calculateSMA(inputCandles, 10)
                    .then(result => technicals[future][eventCategory].SMA10 = result);
                calculateSMA(inputCandles, 50)
                    .then(result => technicals[future][eventCategory].SMA50 = result);
                calculateSMA(inputCandles, 200)
                    .then(result => technicals[future][eventCategory].SMA200 = result);
            });
        }
    }
}

async function calculateRSI(candles) {
    const period = 6;
    if(candles.length < period) return;

    const openPrices = candles.map(candle => candle.open);
    
    const input = {
        values: openPrices,
        period,
    };

    return RSI.calculate(input);
} 

async function calculateSMA(candles, period) {
    if(candles.length < period) return;

    const openPrices = candles.map(candle => parseFloat(candle.open));
    
    const input = {
        values: openPrices,
        period,
    };

    let result = SMA.calculate(input);

    if(isNaN(result[0])) {
        return mySMA(input);
    } else {
        return result;
    }
}

/**
 * 
 * @param {{values: number[], period:number}}
 * 
 */
function mySMA({values, period}) {

    const result = [];
    for(let i=0; i< values.length-period; i++){
        const _subValues = values.slice(i, i+period);
        
        let total = _subValues.reduce((total, value) => {
            return total + value;
        }, 0);

        result.push(total / period);
    }

    return result;
}

module.exports = { init }