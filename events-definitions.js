const {EventEmitter} = require('events');

const EventsEnum = {
    PRICE_UP: "price_up",
    PRICE_DOWN: "price_down",
    MA10_MA50_15M_CROSS_ABOVE: "ma10_ma50_15m_cross_above",
    MA10_MA50_15M_CROSS_BELOW: "ma10_ma50_15m_cross_below",
    UPDATE: "update",
};
function emitPriceEvents(markPrices, oldMarkPrices, events, requiredFutures) {
    if(!oldMarkPrices) return;
    for(const future of requiredFutures) {
        if(!oldMarkPrices[future]) continue;
        const dif = markPrices[future].markPrice - oldMarkPrices[future].markPrice;
        const eventName = dif>=0 ? EventsEnum.PRICE_UP : EventsEnum.PRICE_DOWN;
        events[future].price.emit(eventName, dif);
        events[future].price.emit(EventsEnum.UPDATE, markPrices[future].markPrice);
    }
}
function emitCandleEvents(candles, future, timeperiod, events) {
    events[future][`candles_${timeperiod}`]
        .emit(EventsEnum.UPDATE, candles[`candles_${timeperiod}`]);
}

function eventsInit(requiredFutures, chartsWatched) {
    const eventsList = requiredFutures.map(future => [
        future, 
        Object.fromEntries(chartsWatched.map(chart=> [
            chart, 
            new EventEmitter(),
        ])),
    ]);
    return Object.fromEntries(eventsList);
}
module.exports = {
    EventsEnum,
    emitPriceEvents,
    emitCandleEvents,
    eventsInit
};