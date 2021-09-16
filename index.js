require("dotenv").config();

const constants = require('./src/constants');
const crud = require('./src/crud');
const helpers = require('./src/helpers');
const axios = require('axios');
const cron = require('node-cron');
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});

/**
 * Telegram bot functions.
 */
bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${constants.helloMessageText}`;

     bot.sendMessage(chatId, message);
});

bot.onText(/^\/hola/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${constants.helloMessageText}`;

     bot.sendMessage(chatId, message);
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

     crud.queryDatabase(updateQuery).then(function (result) {
          if (result.rowCount == 0) {
               crud.queryDatabase(insertQuery).then(function (result) {
                    bot.sendMessage(chatId, `Has añadido ${nameCrypto} correctamente a tu cartera.`);
               }).catch(function (err) {
                    sendErrorMessageToBot(chatId);
               });
          } else {
               bot.sendMessage(chatId, `Has actualizado el valor de ${nameCrypto} correctamente en tu cartera.`);
          }
     }).catch(function (err) {
          crud.queryDatabase(insertQuery).then(function (result) {
               bot.sendMessage(chatId, `Has añadido ${nameCrypto} correctamente a tu cartera.`);
          }).catch(function (err) {
               sendErrorMessageToBot(chatId);
          });
     });
});

bot.onText(/^\/borrar/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

     var cryptoCurrencies = [];
     var cryptoNames = [];

     crud.queryDatabase(selectQuery).then(function (result) {          
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
          cryptoNames.forEach(name => {
               let nameText = helpers.capitalizeFirstLetter(name);
               buttonData.push({text: nameText, callback_data: `${name}`});
          });
          buttonData.push({text: constants.cancelText, callback_data: constants.cancelText});

          let buttons = {
               reply_markup: {
                    inline_keyboard: [
                         buttonData
                    ]
               }
          }

          bot.sendMessage(chatId, constants.deleteText, buttons);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/cartera/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;

     getInfoWallet(chatId, userId, name);
});

bot.onText(/^\/alertas/, (msg) => {
     let chatId = msg.chat.id;

     var buttonData = [
          {text: constants.enabledAlertText, callback_data: constants.enabledAlertText},
          {text: constants.disabledAlertText, callback_data: constants.disabledAlertText},
          {text: constants.cancelText, callback_data: constants.cancelText}
     ];

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     };
     
     bot.sendMessage(chatId, constants.alertTitleText, buttons);
});

bot.onText(/^\/precio (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let crypto = match[1];

     bot.sendMessage(chatId, constants.infoPriceText);

     axios.all([
          axios.get(constants.coingeckoBaseUrl + `/simple/price?ids=${crypto}&vs_currencies=${constants.currencyParam}`)
     ]).then(axios.spread((response) => {
          let price = response.data[crypto][constants.currencyParam];

          bot.sendMessage(chatId, `El precio actual del ${crypto} es ${helpers.formatter.format(price)} €`);
     })).catch(error => {
          sendErrorMessageToBot(chatId);
     });
});

bot.on('callback_query', function onCallbackQuery(buttonAction) {
     let chatId = buttonAction.message.chat.id;
     let userId = buttonAction.from.id;
     let name = buttonAction.from.first_name;
     let data = buttonAction.data;

     if (data == constants.enabledAlertText || data == constants.disabledAlertText) {
          setAlertForNotifyWallet(chatId, userId, name, data);
     } else if (data == constants.cancelText) {
          bot.sendMessage(chatId, constants.noText);
     } else {
          deleteCryptoFromDatabase(data, chatId);
     }
});

/**
 * Scheduler function for send total wallet to user with alerts enabled.
 */
 cron.schedule('0 9 * * *', () => {
     sendTotalWalletAlerts();
}, {
     scheduled: true,
     timezone: "Europe/Madrid"
});

cron.schedule('0 21 * * *', () => {
     sendTotalWalletAlerts();
}, {
     scheduled: true,
     timezone: "Europe/Madrid"
});

/**
 * Helper functions.
 */
function getInfoWallet(chatId, userId, name) {
     let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

     var cryptoCurrencies = [];
     var cryptoNames = [];

     crud.queryDatabase(selectQuery).then(function (result) {
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
               messages.forEach(text => {
                    finalMessage += text;
               });
               let total = `\n<b>Total en cartera: </b><i> ${helpers.formatter.format(totalWallet)} €</i>\n`;
               finalMessage += total;

               sendMessageToBot(chatId, finalMessage, "HTML");
          }).catch(error => {
               sendErrorMessageToBot(chatId);
          });
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
};

function setAlertForNotifyWallet(chatId, userId, name, data) {
     var query = "";
     var message = "";

     if (data == constants.enabledAlertText) {
          query = `insert into scheduler (user_id, name, chat_id) values ('${userId}','${name}','${chatId}');`;
          message = constants.enabledAlertMessageText;
     } else if (data == constants.disabledAlertText) {
          query = `delete from scheduler where user_id = '${userId}';`;
          message = constants.disabledAlertMessageText;
     }

     crud.queryDatabase(query).then(function (result) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
};

function deleteCryptoFromDatabase(data, chatId) {
     let deleteQuery = `delete from cryptocurrencies where name = '${data}';`

     crud.queryDatabase(deleteQuery).then(function (result) {
          bot.sendMessage(chatId, `La criptomoneda ${data} se ha eliminado correctamente de tu cartera.`);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
};

function sendTotalWalletAlerts() {
     let selectQuery = "select * from scheduler;";
     
     crud.queryDatabase(selectQuery).then(function (result) {
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
          console.log(`selectQuery: ${err}`);
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