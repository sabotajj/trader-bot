

Object.defineProperty(Array.prototype, 'last', {
    value : function last() { 
        return this && this[this.length-1]
    }
});

if (!console.originalLog) {
    const originalLog = console.log;
    console.log = (...args) => originalLog(new Date().toLocaleTimeString(), ...args);
    console.originalLog = originalLog;
}

/**
* 
* @param {string} candleTime 
*/
function getMsOfCandleTime(candleTime) {
    if (candleTime.includes('m')) {
        return parseInt(candleTime.replace('m', '')) * 60 * 1000
    }

    if (candleTime.includes('h')) {
        return parseInt(candleTime.replace('h', '')) * 60 * 60 * 1000
    }

    if (candleTime.includes('d')) {
        return parseInt(candleTime.replace('d', '')) * 24 * 60 * 60 * 1000
    }
}

module.exports = {getMsOfCandleTime};