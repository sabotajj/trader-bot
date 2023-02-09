/** 
 * @typedef {{
 *  init: () => {},
 *  buy: (futureName: string, amount:number) => {},
 *  sell: (futureName:string, amount:number, reduceOnly:boolean) => {},
 *  sendBatchOrders: (orders: order[]) => Promise<void>
 * }} exchange
 */

/**
 * @typedef {{
 *  time: number,
 *  open: number,
 *  high: number,
 *  low: number,
 *  close: number,
 *  volume: number,
 *  closeTime: number,
 *  assetVolume: number,
 *  trades: number,
 *  buyBaseVolume: number,
 *  buyAssetVolume: number,
 *  ignored: boolean 
 * }} candle
 */

/**
 * @typedef {{
 *  name: string,
 *  maxExecution: number,
 *  futureName: string,
 *  executionTimes: number,
 *  candlePeriod: string,
 *  executedOnThisCandle: boolean,
 *  executeOnceInPeriod: boolean,
 *  events: EventEmitter,
 *  conditionToStart: (currentPrice:number, quotes:any, markPrices:any, candles:any, technicals:any) => boolean,
 *  action: () => void,
 *  active: boolean,
 *  changeSetting: () => {},
 *  getState: () => object
 * }} rule
 */

/**
 * @typedef {{
 *  symbol:string,
 *  positionAmt: number,
 *  entryPrice: number,
 *  pnl: number,
 * }} position
 * 
 */

/**
 * @typedef {{symbol: string, side: string, type: string, quantity: number}} order 
 */

/**
 * @typedef {(exchange:exchange, myPositions: position[]) => rule, myOpenOrders: order[]} createRule
 */