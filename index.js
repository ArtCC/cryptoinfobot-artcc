require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require('axios');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const charts = require('./src/charts');
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');
const localization = require('./src/localization');
const updateToken = process.env.UPDATE_TOKEN;
const util = require('util');

bot.onText(/^\/alerta (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;
     let data = match[1].split(" ");
     let cryptoName = data[0];
     let cryptoPrice = data[1];

     if (cryptoName == localization.getText("deleteCommandText", languageCode)) {
          database.getAllAlertsForUserId(userId, chatId, userName, languageCode, true).then(function (buttonData) {
               if (buttonData.length == 0) {
                    bot.sendMessage(chatId, localization.getText("emptyAlertText", languageCode));
               } else {
                    let buttons = {
                         reply_markup: {
                              inline_keyboard: buttonData
                         }
                    }

                    bot.sendMessage(chatId, localization.getText("deleteAlertButtonsTitle", languageCode), buttons);
               }
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else {
          database.setAlertForUserId(chatId, userId, userName, cryptoName, cryptoPrice, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     }
});

bot.onText(/^\/alertas/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;

     database.getAllAlertsForUserId(userId, chatId, userName, languageCode, false).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
     });
});

bot.onText(/^\/borrar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;

     database.getCryptocurrenciesForUserId(userId, languageCode).then(function (buttonData) {
          let buttons = {
               reply_markup: {
                    inline_keyboard: [
                         buttonData
                    ]
               }
          }

          bot.sendMessage(chatId, localization.getText("deleteText", languageCode), buttons);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.onText(/^\/cartera/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let userName = msg.from.first_name;

     getInfoWallet(chatId, userId, userName, languageCode).then(function (message) {
          helpers.log(message);
     }).catch(function (err) {
          helpers.log(err);
     });
});

bot.onText(/^\/cripto (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let data = match[1].split(" ");
     let nameCrypto = data[0];
     let aliasCrypto = data[1];
     let amountCrypto = data[2];

     database.setCryptoForUserId(amountCrypto, userId, nameCrypto, aliasCrypto, languageCode).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.onText(/^\/donar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let buttons = {
          reply_markup: {
               inline_keyboard: [[{
                    text: localization.getText("oneCoinText", languageCode),
                    callback_data: localization.getText("oneCoinText", languageCode)
               },
               {
                    text: localization.getText("threeCoinText", languageCode),
                    callback_data: localization.getText("threeCoinText", languageCode)
               },
               {
                    text: localization.getText("fiveCoinText", languageCode),
                    callback_data: localization.getText("fiveCoinText", languageCode)
               },
               {
                    text: localization.getText("cancelText", languageCode),
                    callback_data: localization.getText("cancelText", languageCode)
               }]]
          }
     };

     bot.sendMessage(chatId, localization.getText("coinPaymentTitleText", languageCode), buttons);
});

bot.onText(/^\/hola/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userName = msg.from.first_name;

     sendInfo(chatId, userName, languageCode);
});

bot.onText(/^\/notificaciones/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let buttons = {
          reply_markup: {
               inline_keyboard: [[{
                    text: localization.getText("enabledNotificationsText", languageCode),
                    callback_data: localization.getText("enabledNotificationsText", languageCode)
               },
               {
                    text: localization.getText("disabledNotificationsText", languageCode),
                    callback_data: localization.getText("disabledNotificationsText", languageCode)
               },
               {
                    text: localization.getText("cancelText", languageCode),
                    callback_data: localization.getText("cancelText", languageCode)
               }]]
          }
     };

     bot.sendMessage(chatId, localization.getText("notificationsTitleText", languageCode), buttons);
});

bot.onText(/^\/precio (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let data = match[1].split(" ");
     let crypto = data[0];
     var days = data[1];

     if (days === undefined || days === 0) {
          days = 5;
     }

     let requestPrice = axios.get(constants.coingeckoBaseUrl + util.format(constants.requestPriceUrl, crypto, constants.currencyParam));
     let requestMarketChart = axios.get(constants.coingeckoBaseUrl + util.format(constants.requestMarketChartUrl, crypto, constants.currencyParam, days));
     let request = [requestPrice, requestMarketChart];

     axios.all(request).then(axios.spread(function (responsePrice, responseMarketChart) {
          let price = responsePrice.data[crypto][constants.currencyParam];

          var message = util.format(localization.getText("infoPriceTitleText", languageCode), crypto, helpers.formatterAmount(2, 8).format(price));
          message += localization.getText("infoPriceText", languageCode);

          var marketChart = [];
          responseMarketChart.data["prices"].forEach(price => {
               let date = new Date(price[0])
               let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
               let obj = {
                    date: new Date(price[0]),
                    dateString: dateString,
                    price: price[1]
               };
               marketChart.push(obj);
          });
          charts.createLinechartForMarketPrices(crypto, marketChart, languageCode).then(function (response) {
               bot.sendPhoto(chatId, response.urlChart).then(function (result) {
                    helpers.log(result);
                    bot.sendMessage(chatId, message);
               }).catch(function (err) {
                    helpers.log(err);
                    sendErrorMessageToBot(chatId, languageCode);
               });
          }).catch(function (err) {
               helpers.log(err);
          });
     })).catch(error => {
          helpers.log(error);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.onText(/^\/start/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userName = msg.from.first_name;

     database.setChatIdForUpdate(chatId, languageCode).then(function (result) {
          helpers.log(result);
     }).catch(function (err) {
          helpers.log(err);
     });

     bot.setMyCommands(helpers.getCommands(languageCode)).then(function (info) {
          helpers.log(info);
          sendInfo(chatId, userName, languageCode);
     });;
});

bot.onText(/^\/update (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
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
          helpers.log(localization.getText("tokenError", languageCode));
     }
});

bot.on('callback_query', function onCallbackQuery(buttonAction) {
     let chatId = buttonAction.message.chat.id;
     let userId = buttonAction.from.id;
     let userName = buttonAction.from.first_name;
     let languageCode = buttonAction.from.language_code;
     let data = buttonAction.data;

     if (data == localization.getText("enabledNotificationsText", languageCode)) {
          database.setSchedulerForUserId(userId, chatId, userName, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data == localization.getText("disabledNotificationsText", languageCode)) {
          database.deleteSchedulerForUserId(userId, chatId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data == localization.getText("oneCoinText", languageCode)) {
          paymentWithAmount(chatId, 100, languageCode);
     } else if (data == localization.getText("threeCoinText", languageCode)) {
          paymentWithAmount(chatId, 300, languageCode);
     } else if (data == localization.getText("fiveCoinText", languageCode)) {
          paymentWithAmount(chatId, 500, languageCode);
     } else if (data == localization.getText("cancelText", languageCode)) {
          bot.sendMessage(chatId, localization.getText("noText", languageCode));
     } else if (data.indexOf(localization.getText("deleteCommandText", languageCode)) > -1) {
          let alertId = data.replace(localization.getText("deleteControl", languageCode), "");

          database.deleteAlertForId(alertId, userId, chatId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else {
          database.deleteCryptoForUserId(data, userId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     }
});

bot.on('pre_checkout_query', function onCallbackQuery(result) {
     helpers.log(result)
     bot.answerPreCheckoutQuery(result.id, true);
});

bot.on('shipping_query', function onCallbackQuery(result) {
     helpers.log(result)
     bot.answerShippingQuery(result.id, false);
});

bot.on('successful_payment', function onCallbackQuery(result) {
     helpers.log(result)
});

function getInfoWallet(chatId, userId, userName, languageCode) {
     return new Promise(function (resolve, reject) {
          database.getInfoWalletForUserId(userId, userName, languageCode).then(function (response) {
               bot.sendPhoto(chatId, response.urlChart).then(function (result) {
                    helpers.log(result);
                    bot.sendMessage(
                         chatId,
                         response.message, { parse_mode: constants.parseMode }
                    ).then(function (message) {
                         helpers.log(message);
                         resolve(localization.getText("success", languageCode));
                    }).catch(function (err) {
                         helpers.log(err);
                         resolve(err);
                    });
               }).catch(function (err) {
                    helpers.log(err);
                    resolve(err);
               });
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
               reject(err);
          });
     });
};

function paymentWithAmount(chatId, amount, languageCode) {
     let title = localization.getText("paymentTitleText", languageCode);
     let description = localization.getText("paymentDescriptionText", languageCode);
     let payload = localization.getText("paymentPayloadText", languageCode);
     let providerToken = process.env.STRIPE_PAYMENT_TOKEN;
     let startParameter = localization.getText("paymentStartParameterText", languageCode);
     let currency = localization.getText("paymentCurrencyText", languageCode);
     let prices = [{ "label": localization.getText("paymentPriceLabelText", languageCode), "amount": amount }];
     let options = {
          photo_url: constants.donatePhotoUrl,
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

function sendErrorMessageToBot(chatId, languageCode) {
     bot.sendMessage(chatId, localization.getText("errorText", languageCode));
};

function sendInfo(chatId, name, languageCode) {
     let helloText = util.format(localization.getText("sendInfoText", languageCode), name);
     let infoText = localization.getText("helloMessageText", languageCode);
     var message = `${helloText}${infoText}`;

     bot.getMyCommands().then(function (info) {
          for (let obj of info) {
               message += `/${obj.command} - ${obj.description}\n`;
          }

          bot.sendMessage(chatId, message);
     });
};

/**
 * The user's language needs to be stored in the database with which the notification was 
 * created and the texts need to be sent in that language.
 */
cron.schedule('* * * * *', () => {
     // For crypto alert price.
     database.getAllAlerts(constants.esLanguageCode).then(function (data) {
          bot.sendMessage(data.chatId, data.message);
     }).catch(function (err) {
          helpers.log(err);
     });

     // For total wallet notifications.
     let date = new Date();
     let hour = date.getHours() + 2; // (UTC+2. Spain timezone.)
     let minutes = date.getMinutes();

     var time;

     if (minutes < 10) {
          time = `${hour}:0${minutes}`;
     } else {
          time = `${hour}:${minutes}`;
     }

     if (time === constants.firstNotificationHour ||
          time === constants.secondNotificationHour ||
          time === constants.thirdNotificationHour) {
          database.getAllSchedulers().then(function (schedulers) {
               schedulers.forEach(scheduler => {
                    getInfoWallet(scheduler.chatId, scheduler.userId, scheduler.name, constants.esLanguageCode).then(function (message) {
                         helpers.log(message);
                    }).catch(function (err) {
                         helpers.log(err);
                    });
               })
          }).catch(function (err) {
               helpers.log(err);
          });
     }
});