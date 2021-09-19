const constants = require('./constants');
const helpers = require('./helpers');
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});

function getAllAlertsForUserId(userId, chatId, name) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId};`

          queryDatabase(selectQuery).then(function (result) {
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

                    resolve(message);
               } else {
                    resolve(constants.emptyAlertText);
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getCryptocurrenciesForUserId(userId) {
     return new Promise(function (resolve, reject) {
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

               resolve(buttons);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function queryDatabase(query) {
     return new Promise(function (resolve, reject) {
          pool.connect(function (err, client, done) {
               if (err) {
                    reject(err);
               } else {
                    client.query(query, function (error, result) {
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

function setAlertForUserId(chatId, userId, userName, cryptoName, cryptoPrice) {
     return new Promise(function (resolve, reject) {
          if (cryptoPrice == "0") {
               let deleteQuery = `delete from alerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${cryptoName}';`

               queryDatabase(deleteQuery).then(function (result) {
                    helpers.log(result);
                    resolve(constants.disabledAlertText);
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          } else {
               let selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${cryptoName}' and price = ${cryptoPrice};`

               queryDatabase(selectQuery).then(function (result) {
                    if (result.rowCount > 0) {
                         resolve(constants.statusEnabledAlertText);
                    } else {
                         let insertQuery = `insert into alerts (user_id, name, chat_id, crypto, price) values (${userId},'${userName}',${chatId},'${cryptoName}',${cryptoPrice});`;

                         queryDatabase(insertQuery).then(function (result) {
                              helpers.log(result);
                              resolve(constants.enabledAlertText);
                         }).catch(function (err) {
                              helpers.log(err);
                              reject(err);
                         });
                    }
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          }
     });
};

module.exports.getAllAlertsForUserId = getAllAlertsForUserId;
module.exports.getCryptocurrenciesForUserId = getCryptocurrenciesForUserId;
module.exports.queryDatabase = queryDatabase;
module.exports.setAlertForUserId = setAlertForUserId;