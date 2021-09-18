require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require('axios');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');
const updateToken = process.env.UPDATE_TOKEN;

/**
 * Telegram bot functions.
 */
bot.onText(/^\/alerta (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let data = match[1].split(" ");
     let nameCrypto = data[0];
     let priceCrypto = data[1];

     if (priceCrypto == "0") {
          let deleteQuery = `delete from alerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${nameCrypto}';`

          database.queryDatabase(deleteQuery).then(function (result) {
               log(result);
               bot.sendMessage(chatId, constants.disabledAlertText);
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     } else {
          let selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${nameCrypto}' and price = ${priceCrypto};`

          database.queryDatabase(selectQuery).then(function (result) {
               if (result.rowCount > 0) {
                    bot.sendMessage(chatId, constants.statusEnabledAlertText);
               } else {
                    let insertQuery = `insert into alerts (user_id, name, chat_id, crypto, price) values (${userId},'${name}',${chatId},'${nameCrypto}',${priceCrypto});`;

                    database.queryDatabase(insertQuery).then(function (result) {
                         log(result);
                         bot.sendMessage(chatId, constants.enabledAlertText);
                    }).catch(function (err) {
                         log(err);
                         sendErrorMessageToBot(chatId);
                    });
               }
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     }
});

bot.onText(/^\/alertas/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;

     let selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId};`

     database.queryDatabase(selectQuery).then(function (result) {
          var message = `${name}, actualmente tienes añadidas las siguientes alertas de precios:\n\n`;

          var dataMessage = [];
          if (result.rowCount > 0) {
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let alert = {
                         userId: obj.user_id,
                         name: obj.name,
                         chatId: obj.chat_id,
                         crypto: obj.crypto,
                         price: obj.price
                    };

                    dataMessage.push(`${helpers.capitalizeFirstLetter(alert.crypto)}: ${helpers.formatter.format(alert.price)} €.\n`);
               }

               dataMessage.sort();
               dataMessage.forEach((text) => {
                    message += text
               });

               bot.sendMessage(chatId, message);
          } else {
               bot.sendMessage(chatId, constants.emptyAlertText);
          }
     }).catch(function (err) {
          log(err);
     });
});

bot.onText(/^\/borrar/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

     var cryptoCurrencies = [];
     var cryptoNames = [];

     database.queryDatabase(selectQuery).then(function (result) {
          for (let row of result.rows) {
               let json = JSON.stringify(row);
               let obj = JSON.parse(json);
               let currency = {
                    name: obj.name,
                    alias: obj.alias,
                    amount: obj.amount
               };
               cryptoCurrencies.push(currency);
               cryptoNames.push(currency.name);
          }

          var buttonData = []
          cryptoNames.sort();
          cryptoNames.forEach(name => {
               let nameText = helpers.capitalizeFirstLetter(name);
               buttonData.push({ text: nameText, callback_data: `${name}` });
          });
          buttonData.push({ text: constants.cancelText, callback_data: constants.cancelText });

          let buttons = {
               reply_markup: {
                    inline_keyboard: [
                         buttonData
                    ]
               }
          }

          bot.sendMessage(chatId, constants.deleteText, buttons);
     }).catch(function (err) {
          log(err);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/cartera/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;

     getInfoWallet(chatId, userId, name);
});

bot.onText(/^\/cripto (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let data = match[1].split(" ");
     let nameCrypto = data[0];
     let aliasCrypto = data[1];
     let amountCrypto = data[2];
     let updateQuery = `update cryptocurrencies set amount = ${amountCrypto} where user_id = ${userId} and name = '${nameCrypto}' and alias = '${aliasCrypto}';`
     let insertQuery = `insert into cryptocurrencies (user_id, name, alias, amount) values (${userId},'${nameCrypto}','${aliasCrypto}',${amountCrypto});`;

     database.queryDatabase(updateQuery).then(function (result) {
          if (result.rowCount == 0) {
               database.queryDatabase(insertQuery).then(function (result) {
                    bot.sendMessage(chatId, `Has añadido ${nameCrypto} correctamente a tu cartera.`);
               }).catch(function (err) {
                    log(err);
                    sendErrorMessageToBot(chatId);
               });
          } else {
               bot.sendMessage(chatId, `Has actualizado el valor de ${nameCrypto} correctamente en tu cartera.`);
          }
     }).catch(function (err) {
          log(err);
          database.queryDatabase(insertQuery).then(function (result) {
               log(result);
               bot.sendMessage(chatId, `Has añadido ${nameCrypto} correctamente a tu cartera.`);
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     });
});

bot.onText(/^\/hola/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;

     sendInfo(chatId, name);
});

bot.onText(/^\/notificaciones/, (msg) => {
     let chatId = msg.chat.id;

     var buttonData = [
          { text: constants.enabledNotificationsText, callback_data: constants.enabledNotificationsText },
          { text: constants.disabledNotificationsText, callback_data: constants.disabledNotificationsText },
          { text: constants.cancelText, callback_data: constants.cancelText }
     ];

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     };

     bot.sendMessage(chatId, constants.notificationsTitleText, buttons);
});

bot.onText(/^\/precio (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let crypto = match[1];

     axios.all([
          axios.get(constants.coingeckoBaseUrl + `/simple/price?ids=${crypto}&vs_currencies=${constants.currencyParam}`)
     ]).then(axios.spread((response) => {
          let price = response.data[crypto][constants.currencyParam];

          var message = `El precio actual del ${crypto} es ${helpers.formatter.format(price)} €.\n\n`;
          message += constants.infoPriceText;

          bot.sendMessage(chatId, message);
     })).catch(error => {
          log(error);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let insertQuery = `insert into update (chat_id) values (${chatId});`;

     database.queryDatabase(insertQuery).then(function (result) {
          log(result);
     }).catch(function (err) {
          log(err);
     });

     sendInfo(chatId, name);
});

bot.onText(/^\/update (.+)/, (msg, match) => {
     let data = match[1].split("-");
     let token = data[0];
     let message = data[1];

     if (token == updateToken) {
          let selectQuery = "select * from update;";

          database.queryDatabase(selectQuery).then(function (result) {
               var collection = [];
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let update = {
                         chatId: obj.chat_id
                    };
                    collection.push(update.chatId);
               }
               collection.forEach(chatId => {
                    bot.sendMessage(chatId, message);
               });
          }).catch(function (err) {
               log(err);
          });
     } else {
          log(constants.tokenError);
     }
});

bot.on('callback_query', function onCallbackQuery(buttonAction) {
     let chatId = buttonAction.message.chat.id;
     let userId = buttonAction.from.id;
     let name = buttonAction.from.first_name;
     let data = buttonAction.data;

     if (data == constants.enabledNotificationsText || data == constants.disabledNotificationsText) {
          setAlertForNotifyWallet(chatId, userId, name, data);
     } else if (data == constants.cancelText) {
          bot.sendMessage(chatId, constants.noText);
     } else {
          deleteCryptoFromDatabase(data, chatId, userId);
     }
});

/**
 * Scheduler function for send total wallet to user with alerts enabled.
 */
cron.schedule('*/5 * * * *', () => {
     let selectQuery = "select * from alerts;";

     database.queryDatabase(selectQuery).then(function (result) {
          for (let row of result.rows) {
               let json = JSON.stringify(row);
               let obj = JSON.parse(json);
               let alert = {
                    userId: obj.user_id,
                    name: obj.name,
                    chatId: obj.chat_id,
                    crypto: obj.crypto,
                    price: obj.price
               };

               axios.all([
                    axios.get(constants.coingeckoBaseUrl + `/simple/price?ids=${alert.crypto}&vs_currencies=${constants.currencyParam}`)
               ]).then(axios.spread((response) => {
                    let price = response.data[alert.crypto][constants.currencyParam];

                    if (price >= alert.price) {
                         var message = `${alert.name} el precio de ${alert.crypto} es de ${helpers.formatter.format(price)} € en estos momentos. `;

                         let deleteQuery = `delete from alerts where user_id = ${alert.userId} and chat_id = ${alert.chatId} and name = '${alert.name}' and crypto = '${alert.crypto}';`

                         database.queryDatabase(deleteQuery).then(function (result) {
                              message += `He borrado la alerta para ${alert.crypto} de ${helpers.formatter.format(alert.price)} € correctamente.`;

                              bot.sendMessage(alert.chatId, message);
                         }).catch(function (err) {
                              log(err);
                              sendErrorMessageToBot(chatId);
                         });
                    }
               })).catch(error => {
                    log(error);
               });
          }
     }).catch(function (err) {
          log(err);
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

/**
 * Helper functions.
 */
function getInfoWallet(chatId, userId, name) {
     let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

     var cryptoCurrencies = [];
     var cryptoNames = [];

     database.queryDatabase(selectQuery).then(function (result) {
          for (let row of result.rows) {
               let json = JSON.stringify(row);
               let obj = JSON.parse(json);
               let currency = {
                    name: obj.name,
                    alias: obj.alias,
                    amount: obj.amount
               };
               cryptoCurrencies.push(currency);
               cryptoNames.push(currency.name);
          }

          var urls = [];
          cryptoNames.forEach(name => {
               urls.push(axios.get(constants.coingeckoBaseUrl + `/simple/price?ids=${name}&vs_currencies=${constants.currencyParam}`));
          });

          var collection = [];
          axios.all(urls).then(responseArr => {
               cryptoCurrencies.forEach(crypto => {
                    responseArr.forEach(data => {
                         if (crypto.name == Object.keys(data.data)) {
                              let currency = {
                                   name: crypto.name,
                                   alias: crypto.alias,
                                   price: data.data[crypto.name][constants.currencyParam]
                              };
                              collection.push(currency);
                         }
                    });
               });

               var totalWallet = 0;
               var messages = [];
               cryptoCurrencies.forEach(crypto => {
                    collection.forEach(currency => {
                         if (crypto.name == currency.name) {
                              let priceAmount = crypto.amount * currency.price;
                              let message = `<b>${currency.alias} (${currency.price} €):</b> Cantidad: ${helpers.formatter.format(crypto.amount)} - Total: ${helpers.formatter.format(priceAmount)} €\n`;

                              messages.push(message);

                              totalWallet += priceAmount;
                         }
                    });
               });

               var finalMessage = `Este es el total en euros de tu cartera de criptomonedas <b>${name}</b>:\n\n`;
               messages.sort();
               messages.forEach(text => {
                    finalMessage += text;
               });
               let total = `\n<b>Total en cartera: </b><i> ${helpers.formatter.format(totalWallet)} €</i>\n`;
               finalMessage += total;

               sendMessageToBot(chatId, finalMessage, "HTML");
          }).catch(error => {
               log(error);
               sendErrorMessageToBot(chatId);
          });
     }).catch(function (err) {
          log(err);
          sendErrorMessageToBot(chatId);
     });
};

function setAlertForNotifyWallet(chatId, userId, name, data) {
     var query = "";
     var message = "";

     if (data == constants.enabledNotificationsText) {
          let selectQuery = `select * from scheduler where user_id = ${userId} and chat_id = ${chatId};`;

          database.queryDatabase(selectQuery).then(function (result) {
               if (result.rowCount > 0) {
                    bot.sendMessage(chatId, constants.statusEnabledNotificationsText);
               } else {
                    query = `insert into scheduler (user_id, name, chat_id) values (${userId},'${name}','${chatId}');`;
                    message = constants.enabledNotificationsMessageText;

                    database.queryDatabase(query).then(function (result) {
                         log(result);
                         bot.sendMessage(chatId, message);
                    }).catch(function (err) {
                         log(err);
                         sendErrorMessageToBot(chatId);
                    });
               }
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     } else if (data == constants.disabledNotificationsText) {
          query = `delete from scheduler where user_id = ${userId} and chat_id = ${chatId};`;
          message = constants.disabledNotificationsMessageText;

          database.queryDatabase(query).then(function (result) {
               log(result);
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     }
};

function deleteCryptoFromDatabase(data, chatId, userId) {
     let deleteQuery = `delete from cryptocurrencies where name = '${data}' and user_id = ${userId};`

     database.queryDatabase(deleteQuery).then(function (result) {
          log(result);
          bot.sendMessage(chatId, `La criptomoneda ${data} se ha borrado correctamente de tu cartera.`);
     }).catch(function (err) {
          log(err);
          sendErrorMessageToBot(chatId);
     });
};

function sendTotalWalletAlerts() {
     let selectQuery = "select * from scheduler;";

     database.queryDatabase(selectQuery).then(function (result) {
          for (let row of result.rows) {
               let json = JSON.stringify(row);
               let obj = JSON.parse(json);
               let scheduler = {
                    userId: obj.user_id,
                    name: obj.name,
                    chatId: obj.chat_id
               };

               getInfoWallet(scheduler.chatId, scheduler.userId, scheduler.name);
          }
     }).catch(function (err) {
          log(err);
     });
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

function sendMessageToBot(chatId, message, parseMode) {
     bot.sendMessage(
          chatId,
          message, {
          parse_mode: parseMode
     }
     );
};

function sendErrorMessageToBot(chatId) {
     bot.sendMessage(chatId, constants.errorText);
};

/**
 * Logs.
 */
function log(message) {
     // console.log(message);
};