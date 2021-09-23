require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require('axios');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const charts = require('./src/charts');
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');
const updateToken = process.env.UPDATE_TOKEN;

bot.onText(/^\/alerta (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;
     let data = match[1].split(" ");
     let cryptoName = data[0];
     let cryptoPrice = data[1];

     database.setAlertForUserId(chatId, userId, userName, cryptoName, cryptoPrice).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/alertas/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;

     database.getAllAlertsForUserId(userId, chatId, userName).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
     });
});

bot.onText(/^\/borrar/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;

     database.getCryptocurrenciesForUserId(userId).then(function (buttonData) {
          let buttons = {
               reply_markup: {
                    inline_keyboard: [
                         buttonData
                    ]
               }
          }

          bot.sendMessage(chatId, constants.deleteText, buttons);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/cartera/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;

     getInfoWallet(chatId, userId, userName).then(function (message) {
          helpers.log(message);
     }).catch(function (err) {
          helpers.log(err);
     });
});

bot.onText(/^\/cripto (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let data = match[1].split(" ");
     let nameCrypto = data[0];
     let aliasCrypto = data[1];
     let amountCrypto = data[2];

     database.setCryptoForUserId(amountCrypto, userId, nameCrypto, aliasCrypto).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/donar/, (msg) => {
     let chatId = msg.chat.id;
     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    [
                         { text: constants.oneCoinText, callback_data: constants.oneCoinText },
                         { text: constants.threeCoinText, callback_data: constants.threeCoinText },
                         { text: constants.fiveCoinText, callback_data: constants.fiveCoinText },
                         { text: constants.cancelText, callback_data: constants.cancelText }
                    ]
               ]
          }
     };

     bot.sendMessage(chatId, constants.coinPaymentTitleText, buttons);
});

bot.onText(/^\/hola/, (msg) => {
     let chatId = msg.chat.id;
     let userName = msg.from.first_name;

     sendInfo(chatId, userName);
});

bot.onText(/^\/notificaciones/, (msg) => {
     let chatId = msg.chat.id;
     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    [
                         { text: constants.enabledNotificationsText, callback_data: constants.enabledNotificationsText },
                         { text: constants.disabledNotificationsText, callback_data: constants.disabledNotificationsText },
                         { text: constants.cancelText, callback_data: constants.cancelText }
                    ]
               ]
          }
     };

     bot.sendMessage(chatId, constants.notificationsTitleText, buttons);
});

bot.onText(/^\/precio (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let crypto = match[1];

     let requestPrice = axios.get(constants.coingeckoBaseUrl + `/simple/price?ids=${crypto}&vs_currencies=${constants.currencyParam}`);
     let requestMarketChart = axios.get(constants.coingeckoBaseUrl + `/coins/${crypto}/market_chart?vs_currency=${constants.currencyParam}&days=0.1&interval=seconds`);
     let request = [requestPrice, requestMarketChart];

     axios.all(request).then(axios.spread(function (responsePrice, responseMarketChart) {
          let price = responsePrice.data[crypto][constants.currencyParam];

          var message = `El precio actual del ${crypto} es ${helpers.formatter.format(price)} €.\n\n`;
          message += constants.infoPriceText;

          var marketChart = [];
          responseMarketChart.data["prices"].forEach(price => {
               let value = {
                    timestamp: price[0],
                    price: price[1]
               };
               marketChart.push(value);
          });
          charts.createLinechartForMarketPrices(crypto, marketChart).then(function (response) {
               bot.sendPhoto(chatId, response.urlChart).then(function (result) {
                    helpers.log(result);
                    bot.sendMessage(chatId, message);
               }).catch(function (err) {
                    helpers.log(err);
                    sendErrorMessageToBot(chatId);
               });
          }).catch(function (err) {
               helpers.log(err);
          });
     })).catch(error => {
          helpers.log(error);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let userName = msg.from.first_name;

     database.setChatIdForUpdate(chatId).then(function (result) {
          helpers.log(result);
     }).catch(function (err) {
          helpers.log(err);
     });

     sendInfo(chatId, userName);
});

bot.onText(/^\/update (.+)/, (msg, match) => {
     let data = match[1].split("-");
     let token = data[0];
     let message = data[1];

     if (token == updateToken) {
          database.getAllChatId().then(function (collection) {
               collection.forEach(chatId => {
                    bot.sendMessage(chatId, message);
               });
          }).catch(function (err) {
               helpers.log(err);
          });
     } else {
          helpers.log(constants.tokenError);
     }
});

bot.on('callback_query', function onCallbackQuery(buttonAction) {
     let chatId = buttonAction.message.chat.id;
     let userId = buttonAction.from.id;
     let userName = buttonAction.from.first_name;
     let data = buttonAction.data;

     if (data == constants.enabledNotificationsText) {
          database.setSchedulerForUserId(userId, chatId, userName).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId);
          });
     } else if (data == constants.disabledNotificationsText) {
          database.deleteSchedulerForUserId(userId, chatId).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId);
          });
     } else if (data == constants.oneCoinText) {
          paymentWithAmount(chatId, 100);
     } else if (data == constants.threeCoinText) {
          paymentWithAmount(chatId, 300);
     } else if (data == constants.fiveCoinText) {
          paymentWithAmount(chatId, 500);
     } else if (data == constants.cancelText) {
          bot.sendMessage(chatId, constants.noText);
     } else {
          database.deleteCryptoForUserId(data, userId).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId);
          });
     }
});

bot.on('pre_checkout_query', function onCallbackQuery(result) {
     helpers.log(`pre_checkout_query: ${result}`)
     bot.answerPreCheckoutQuery(result.id, true);
});

bot.on('shipping_query', function onCallbackQuery(result) {
     helpers.log(`shipping_query: ${result}`)
     bot.answerShippingQuery(result.id, false);
});

bot.on('successful_payment', function onCallbackQuery(result) {
     helpers.log(`successful_payment: ${result}`);
});

function getInfoWallet(chatId, userId, userName) {
     return new Promise(function (resolve, reject) {
          database.getInfoWalletForUserId(userId, userName).then(function (response) {
               bot.sendPhoto(chatId, response.urlChart).then(function (result) {
                    helpers.log(result);
                    bot.sendMessage(
                         chatId,
                         response.message, { parse_mode: "HTML" }
                    ).then(function (message) {
                         helpers.log(message);
                         resolve("Success.")
                    }).catch(function (err) {
                         helpers.log(err);
                         resolve(err)
                    });
               }).catch(function (err) {
                    helpers.log(err);
                    resolve(err)
               });
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId);
               reject(err);
          });
     });
};

function paymentWithAmount(chatId, amount) {
     let title = constants.paymentTitleText;
     let description = constants.paymentDescriptionText;
     let payload = constants.paymentPayloadText;
     let providerToken = process.env.STRIPE_PAYMENT_TOKEN;
     let startParameter = constants.paymentStartParameterText;
     let currency = constants.paymentCurrencyText;
     let prices = [{ "label": constants.paymentPriceLabelText, "amount": amount }];
     let options = {
          photo_url: "https://cdn.pixabay.com/photo/2020/04/22/11/59/thank-you-5077738_960_720.jpg",
          photo_width: 480,
          photo_height: 320,
          is_flexible: false,
          need_shipping_address: false
     }

     bot.sendInvoice(chatId, title, description, payload, providerToken, startParameter, currency, prices, options).then(function (result) {
          helpers.log(result);
     }).catch(function (err) {
          helpers.log(err);
     });
};

function sendErrorMessageToBot(chatId) {
     bot.sendMessage(chatId, constants.errorText);
};

function sendInfo(chatId, name) {
     var message = `¡Hola ${name}!${constants.helloMessageText}`;

     bot.getMyCommands().then(function (info) {
          for (let obj of info) {
               message += `/${obj.command} - ${obj.description}\n`;
          }

          bot.sendMessage(chatId, message);
     });
};

function sendTotalWalletAlerts() {
     database.getAllSchedulers().then(function (schedulers) {
          schedulers.forEach(scheduler => {
               getInfoWallet(scheduler.chatId, scheduler.userId, scheduler.name).then(function (message) {
                    helpers.log(message);
               }).catch(function (err) {
                    helpers.log(err);
               });
          })
     }).catch(function (err) {
          helpers.log(err);
     });
};

cron.schedule('*/5 * * * *', () => {
     database.getAllAlerts().then(function (data) {
          bot.sendMessage(data.chatId, data.message);
     }).catch(function (err) {
          helpers.log(err);
     });
});

cron.schedule('0 8 * * *', () => {
     sendTotalWalletAlerts();
}, {
     scheduled: true,
     timezone: constants.timezone
});

cron.schedule('0 15 * * *', () => {
     sendTotalWalletAlerts();
}, {
     scheduled: true,
     timezone: constants.timezone
});

cron.schedule('0 22 * * *', () => {
     sendTotalWalletAlerts();
}, {
     scheduled: true,
     timezone: constants.timezone
});