require("dotenv").config();

const axios = require('axios');
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});
const formatter = new Intl.NumberFormat('de-DE', {
     minimumFractionDigits: 2,
     maximumFractionDigits: 8,
});
const baseUrl = "https://api.coingecko.com/api/v3";
const currencyParam = "eur";
const helloMessage = "\n\nEscribe la barra / para ver en qué te puedo ayudar.\n\nAñade tus criptomonedas y recibe el valor total de tu cartera usando el API de Coingecko.\n\nMás información: https://github.com/ArtCC/cryptoinfobot-artcc";
const cancelText = "Cancelar";
const deleteText = "¿Qué criptomoneda quieres eliminar de tu cartera?";
const infoPriceText = "Puedes consultar el listado de criptomonedas disponibles en https://www.coingecko.com/es";
const errorText = "¡Vaya! Parece que ha habido un problema con tu solicitud. Inténtalo de nuevo por favor.";
const alertTitleText = "¿Quieres activar las alertas automáticas del valor de tu cartera?";
const enabledAlertText = "Activar";
const disabledAlertText = "Desactivar";
const noText = "De acuerdo.";
const enabledAlertMessageText = "He activado las alertas para notificarte el valor de tu cartera de forma automática (09:00h - 21:00h)";
const disabledAlertMessageText = "He desactivado las alertas.";

bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${helloMessage}`;

     bot.sendMessage(chatId, message);
});

bot.onText(/^\/hola/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${helloMessage}`;

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

     queryDatabase(updateQuery).then(function (result) {
          if (result.rowCount == 0) {
               queryDatabase(insertQuery).then(function (result) {
                    bot.sendMessage(chatId, `Has añadido ${nameCrypto} correctamente a tu cartera.`);
               }).catch(function (err) {
                    sendErrorMessageToBot(chatId);
               });
          } else {
               bot.sendMessage(chatId, `Has actualizado el valor de ${nameCrypto} correctamente en tu cartera.`);
          }
     }).catch(function (err) {
          queryDatabase(insertQuery).then(function (result) {
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

     queryDatabase(selectQuery).then(function (result) {          
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
               let nameText = capitalizeFirstLetter(name);
               buttonData.push({text: nameText, callback_data: `${name}`});
          });
          buttonData.push({text: cancelText, callback_data: cancelText});

          let buttons = {
               reply_markup: {
                    inline_keyboard: [
                         buttonData
                    ]
               }
          }

          bot.sendMessage(chatId, deleteText, buttons);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/cartera/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

     var cryptoCurrencies = [];
     var cryptoNames = [];

     queryDatabase(selectQuery).then(function (result) {
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
          
          bot.sendMessage(chatId, `Este es el total en euros de tu cartera de criptomonedas ${name}\n\n`);
          
          var urls = [];
          cryptoNames.forEach(name => {
               urls.push(axios.get(baseUrl + `/simple/price?ids=${name}&vs_currencies=${currencyParam}`));
          });

          var collection = [];
          axios.all(urls).then(responseArr => {
               cryptoCurrencies.forEach(crypto => {
                    responseArr.forEach(data => {                              
                         if (crypto.name == Object.keys(data.data)) {
                              let currency = {
                                   name: crypto.name,
                                   alias: crypto.alias,
                                   price: data.data[crypto.name][currencyParam]
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
                              let message = `<b>${currency.alias} (${currency.price} €):</b> Cantidad: ${formatter.format(crypto.amount)} - Total: ${formatter.format(priceAmount)} €\n`;
                              
                              messages.push(message);
                              
                              totalWallet += priceAmount;
                         }
                    });
               });
               
               var finalMessage = "";
               messages.forEach(text => {
                    finalMessage += text;
               });
               let total = `\n<b>Total en cartera: </b><i> ${formatter.format(totalWallet)} €</i>\n`;
               finalMessage += total;

               sendMessageToBot(chatId, finalMessage, "HTML");
          }).catch(error => {
               sendErrorMessageToBot(chatId);
          });
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/alertas/, (msg) => {
     let chatId = msg.chat.id;

     var buttonData = [
          {text: enabledAlertText, callback_data: enabledAlertText},
          {text: disabledAlertText, callback_data: disabledAlertText},
          {text: cancelText, callback_data: cancelText}
     ];

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     };
     
     bot.sendMessage(chatId, alertTitleText, buttons);
});

bot.onText(/^\/precio (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let crypto = match[1];

     bot.sendMessage(chatId, infoPriceText);

     axios.all([
          axios.get(baseUrl + `/simple/price?ids=${crypto}&vs_currencies=${currencyParam}`)
     ]).then(axios.spread((response) => {
          let price = response.data[crypto][currencyParam];

          bot.sendMessage(chatId, `El precio actual del ${crypto} es ${formatter.format(price)} €`);
     })).catch(error => {
          sendErrorMessageToBot(chatId);
     });
});

bot.on('callback_query', function onCallbackQuery(buttonAction) {
     let chatId = buttonAction.message.chat.id;
     let userId = buttonAction.from.id;
     let name = buttonAction.from.first_name;
     let data = buttonAction.data;

     if (data == enabledAlertText || data == disabledAlertText) {
          setAlertForNotifyWallet(chatId, userId, name, data);
     } else if (data == cancelText) {
          bot.sendMessage(chatId, noText);
     } else {
          deleteCryptoFromDatabase(data);
     }
});

function setAlertForNotifyWallet(chatId, userId, name, data) {
     var query = "";
     var message = "";

     if (data == enabledAlertText) {
          query = `insert into scheduler (user_id, name, chat_id) values ('${userId}','${name}','${chatId}');`;
          message = enabledAlertMessageText;
     } else if (data == disabledAlertText) {
          query = `delete from scheduler where user_id = '${userId}';`;
          message = disabledAlertMessageText;
     }

     queryDatabase(query).then(function (result) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
};

function deleteCryptoFromDatabase(data) {
     let deleteQuery = `delete from cryptocurrencies where name = '${data}';`

     queryDatabase(deleteQuery).then(function (result) {
          bot.sendMessage(chatId, `La criptomoneda ${data} se ha eliminado correctamente de tu cartera.`);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
};

function queryDatabase(query) {
     return new Promise(function (resolve, reject) {
          pool.connect(function(err, client, done) {
               if (err) {
                    reject(err);
               } else {
                    client.query(query, function(error, result) {
                         done();
                         if (error) {
                              reject(error);
                         } else {
                              resolve(result);
                         }
                    });
               }
          });
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
     bot.sendMessage(chatId, errorText);
};

function capitalizeFirstLetter(string) {
     return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports.axios = axios;
module.exports.bot = bot;
module.exports.pool = pool;
module.exports.baseUrl = baseUrl;
module.exports.currencyParam = currencyParam;
module.exports.formatter = formatter;
module.exports.sendMessageToBot = sendMessageToBot;
module.exports.sendErrorMessageToBot = sendErrorMessageToBot;