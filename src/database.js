const axios = require('axios');
const constants = require('./constants');
const helpers = require('./helpers');
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});
const QuickChart = require('quickchart-js');

function deleteCryptoForUserId(cryptoName, userId) {
     return new Promise(function (resolve, reject) {
          let deleteQuery = `delete from cryptocurrencies where name = '${cryptoName}' and user_id = ${userId};`

          queryDatabase(deleteQuery).then(function (result) {
               helpers.log(result);
               resolve(`La criptomoneda ${cryptoName} se ha borrado correctamente de tu cartera.`);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function deleteSchedulerForUserId(userId, chatId) {
     return new Promise(function (resolve, reject) {
          query = `delete from scheduler where user_id = ${userId} and chat_id = ${chatId};`;

          queryDatabase(query).then(function (result) {
               helpers.log(result);
               resolve(constants.disabledNotificationsMessageText);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getAllAlerts() {
     return new Promise(function (resolve, reject) {
          let selectQuery = "select * from alerts;";

          queryDatabase(selectQuery).then(function (result) {
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

                              queryDatabase(deleteQuery).then(function (result) {
                                   helpers.log(result);
                                   message += `He borrado la alerta para ${alert.crypto} de ${helpers.formatter.format(alert.price)} € correctamente.`;

                                   let data = {
                                        chatId: alert.chatId,
                                        message: message
                                   }

                                   resolve(data);
                              }).catch(function (err) {
                                   helpers.log(err);
                                   reject(err);
                              });
                         }
                    })).catch(error => {
                         helpers.log(error);
                         reject(error);
                    });
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

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

function getAllChatId() {
     return new Promise(function (resolve, reject) {
          let selectQuery = "select * from update;";

          queryDatabase(selectQuery).then(function (result) {
               var collection = [];
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let update = {
                         chatId: obj.chat_id
                    };
                    collection.push(update.chatId);
               }
               resolve(collection);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getAllSchedulers() {
     return new Promise(function (resolve, reject) {
          let selectQuery = "select * from scheduler;";

          queryDatabase(selectQuery).then(function (result) {
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let scheduler = {
                         userId: obj.user_id,
                         name: obj.name,
                         chatId: obj.chat_id
                    };

                    resolve(scheduler);
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

               resolve(buttonData);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getInfoWalletForUserId(userId, userName) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select * from cryptocurrencies where user_id = ${userId};`

          var cryptoCurrencies = [];
          var cryptoNames = [];
          var cryptoAmount = [];

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

                                   cryptoAmount.push(priceAmount);
                                   messages.push(message);

                                   totalWallet += priceAmount;
                              }
                         });
                    });

                    var finalMessage = `Este es el total en euros de tu cartera de criptomonedas <b>${userName}</b>:\n\n`;
                    messages.sort();
                    messages.forEach(text => {
                         finalMessage += text;
                    });
                    let total = `\n<b>Total en cartera: </b><i> ${helpers.formatter.format(totalWallet)} €</i>\n`;
                    finalMessage += total;

                    const myChart = new QuickChart();
                    myChart
                         .setConfig({
                              type: 'doughnut',
                              data: { labels: cryptoNames, datasets: [{ label: constants.amountText, data: cryptoAmount }] },
                              options: { plugins: { doughnutlabel: { labels: [{ text: `${helpers.formatter.format(totalWallet)}`, font: { size: 20 } }, { text: constants.totalText }] } } }
                         })
                         .setWidth(800)
                         .setHeight(400)
                         .setBackgroundColor('transparent');

                    let response = {
                         message: finalMessage,
                         urlChart: myChart.getUrl()
                    }

                    resolve(response);
               }).catch(error => {
                    helpers.log(error);
                    reject(error);
               });
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

function setChatIdForUpdate(chatId) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into update (chat_id) values (${chatId});`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve("setChatIdForUpdate:Success");
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function setCryptoForUserId(amountCrypto, userId, nameCrypto, aliasCrypto) {
     return new Promise(function (resolve, reject) {
          let updateQuery = `update cryptocurrencies set amount = ${amountCrypto} where user_id = ${userId} and name = '${nameCrypto}' and alias = '${aliasCrypto}';`
          let insertQuery = `insert into cryptocurrencies (user_id, name, alias, amount) values (${userId},'${nameCrypto}','${aliasCrypto}',${amountCrypto});`;

          queryDatabase(updateQuery).then(function (result) {
               if (result.rowCount == 0) {
                    queryDatabase(insertQuery).then(function (result) {
                         helpers.log(result);
                         resolve(`Has añadido ${nameCrypto} correctamente a tu cartera.`);
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
               } else {
                    resolve(`Has actualizado el valor de ${nameCrypto} correctamente en tu cartera.`);
               }
          }).catch(function (err) {
               helpers.log(err);
               queryDatabase(insertQuery).then(function (result) {
                    helpers.log(result);
                    resolve(`Has añadido ${nameCrypto} correctamente a tu cartera.`);
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          });
     });
};

function setSchedulerForUserId(userId, chatId, userName) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select * from scheduler where user_id = ${userId} and chat_id = ${chatId};`;

          queryDatabase(selectQuery).then(function (result) {
               if (result.rowCount > 0) {
                    resolve(constants.statusEnabledNotificationsText);
               } else {
                    let insertQuery = `insert into scheduler (user_id, name, chat_id) values (${userId},'${userName}','${chatId}');`;

                    queryDatabase(insertQuery).then(function (result) {
                         helpers.log(result);
                         resolve(constants.enabledNotificationsMessageText);
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     })
};

module.exports.deleteCryptoForUserId = deleteCryptoForUserId;
module.exports.deleteSchedulerForUserId = deleteSchedulerForUserId;
module.exports.getAllAlerts = getAllAlerts;
module.exports.getAllAlertsForUserId = getAllAlertsForUserId;
module.exports.getAllChatId = getAllChatId;
module.exports.getAllSchedulers = getAllSchedulers;
module.exports.getCryptocurrenciesForUserId = getCryptocurrenciesForUserId;
module.exports.getInfoWalletForUserId = getInfoWalletForUserId;
module.exports.queryDatabase = queryDatabase;
module.exports.setAlertForUserId = setAlertForUserId;
module.exports.setChatIdForUpdate = setChatIdForUpdate;
module.exports.setCryptoForUserId = setCryptoForUserId;
module.exports.setSchedulerForUserId = setSchedulerForUserId;