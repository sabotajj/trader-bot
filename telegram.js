const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json')).telegram
/**
 * @type {rule[]}
 */
const loadedRules = require('./rule-executor').loadedRules;
const { RuleEvents, rule } = require('./rules/rule');

function init(markPrices) {
    const bot = new TelegramBot(config.telegramBotApiKey, {polling: true});
    initActivateRuleChat();
    initNotifyChat();
    initPriceQueryChat();
    initListRuleChat();
    initChangeRuleChat();
    initUsersChat();
    initRestartRuleChat();
    initSavePositionChat();
    initSaveOrderChat();
    initBuyBackChat();
    initRestoreOrderChat();
    initBuyChat();

    const notificationRuleNames = [];
    const users = new Set();
    let shabtayChatId = -1;
    bot.onText(/(.*)/i, (msg, match) => {
        const chatId = msg.chat.id;
        const fullName = [msg.chat.first_name, msg.chat.last_name || ''].join(' ');
        users.add(`${fullName}`);
        if(match[0] == 'I am shabtay') {
            bot.sendMessage(chatId, 'I am active sir');
            shabtayChatId = chatId;
        }
    });

    /**
     * 
     * @param {number} chatId 
     * @param {rule} rule 
     * @returns 
     */
    const ruleEventNotify = (chatId, rule) => {
        return (message) => bot.sendMessage(chatId, `Notification from ${rule.name}:\n${message}`);
    }

    /**
     * @param {string} ruleName 
     * @returns {rule[]}
     */
   function findRules(ruleName) {
       if(ruleName == 'all') return loadedRules;
       return loadedRules.filter(rule => rule.name.toLowerCase() == ruleName.toLowerCase());
   }

   /**
    * 
    * @param {rule[]} rule 
    * @param {number} chatId 
    */
    function messageRuleEvents(rules, chatId) {
        rules = rules.filter(rule => !notificationRuleNames.some(notifiedRuleName => notifiedRuleName == rule.name));
        rules.forEach(rule =>
            rule.events.on(RuleEvents.ActionExecuted, ruleEventNotify(chatId, rule)));

        rules.forEach(rule => 
            rule.events.on(RuleEvents.SettingChange, ruleEventNotify(chatId, rule)));
    }

    function initNotifyChat() {
        bot.onText(/notify me rule (.+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            const rules = findRules(match[1]);
            messageRuleEvents(rules, chatId);
            notificationRuleNames.push(...rules.map(rule => rule.name));
            bot.sendMessage(chatId, `I will notify you for rule ${match[1]}`);
        });
    }

    function initUsersChat() {
        bot.onText(/users/i, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, [...users].join(', '));
        });
    }

    function initSavePositionChat() {
        bot.onText(/save position/i, (msg) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            let rules = findRules("BuyMyAssetsBack");
            rules[0].savePositions();

            bot.sendMessage(chatId, "positions saved");
        });
    }

    function initSaveOrderChat() {
        bot.onText(/save order/i, (msg) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            let rules = findRules("BuyMyAssetsBack");
            rules[0].saveOpenOrders();

            bot.sendMessage(chatId, "orders saved");
        });
    }

    function initBuyBackChat() {
        bot.onText(/buy back (\w*)?( .*)?/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            let rules = findRules("BuyMyAssetsBack");
            rules[0].action(match[1]);

            bot.sendMessage(chatId, `positions bought ${match[1]}`);
        });
    }

    function initBuyChat() {
        bot.onText(/buy (\d+) (\w+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            let rules = findRules("BuyAssets");
            
            rules[0].action(match[2].toUpperCase(), match[1]);

            bot.sendMessage(chatId, `positions bought ${match[2]}(${match[1]})`);
        });
    }
    function initRestoreOrderChat() {
        bot.onText(/restore order/i, (msg) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            let rules = findRules("BuyMyAssetsBack");

            const buyBackRule = rules && rules[0];

            if(buyBackRule) {
                buyBackRule.restoreOrders();
            }

            bot.sendMessage(chatId, `order restored`);
        });
    }

    function initActivateRuleChat() {
        bot.onText(/(de|De)?activate rule (.+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            const ruleName = match[2];
            const shouldDeactivate = match[1] && (match[1].toLowerCase() == 'de');
            let rules = findRules(ruleName);

            rules.forEach(rule=> rule.active = !shouldDeactivate);
            const ruleNames = rules.map(rule=>rule.name).join(',');

            bot.sendMessage(chatId, `Rules ${ruleNames} ${shouldDeactivate ? 'de' : ''}activated`);
        });
    }

    function initChangeRuleChat() {
        bot.onText(/change rule (.+) (.+) (.+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;

            const ruleName = match[1];
            const property = match[2];
            const value = match[3];
            let rules = findRules(ruleName);

            rules.forEach(rule=> rule.changeSetting({[property]: value}));
            const ruleNames = rules.map(rule=>rule.name).join(',');

            bot.sendMessage(chatId, `Rules ${ruleNames} modified`);
        });
    }

    function initRestartRuleChat() {
        bot.onText(/restart rule (.+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            if(isRequestValid(chatId)) return;
            const ruleName = match[1];
         
            let rules = findRules(ruleName);

            rules.forEach(rule=> rule.executionTimes = 0);
            const ruleNames = rules.map(rule=>rule.name).join(',');

            bot.sendMessage(chatId, `Rules ${ruleNames} restarted`);
        });
    }

    function initListRuleChat() {
        bot.onText(/list rules/i, (msg) => {
            const chatId = msg.chat.id;

            const ruleNames = loadedRules.map(rule => 
                `${rule.name}\n*${rule.active ? 'active' : 'disabled'}\n*Executions ${rule.executionTimes}/${rule.maxExecution}\n*Notification ${notificationRuleNames.includes(rule.name)}`).join('\n\n');

            bot.sendMessage(chatId, `Rules:\n${ruleNames}`);
        });
    }

    function initPriceQueryChat() {
        bot.onText(/price (.+)/i, (msg, match) => {
            const chatId = msg.chat.id;
            const futureName = match[1].toUpperCase();
            const price = markPrices[futureName].markPrice;

            bot.sendMessage(chatId, `${futureName} price : ${price}`);
        });
    }

    function isRequestValid(chatId) {
        return shabtayChatId > 0 && chatId != shabtayChatId;

    }
}

module.exports = { init };

