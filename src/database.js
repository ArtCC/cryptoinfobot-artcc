const axios = require('axios');
const charts = require('./charts');
const constants = require('./constants');
const helpers = require('./helpers');
const localization = require('./localization');
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});
const util = require('util');

function deleteAlertForId(upPriceAlert, alertId, userId, chatId, languageCode) {
     return new Promise(function (resolve, reject) {
          var deleteQuery = "";

          if (upPriceAlert) { // Up price alerts.
               deleteQuery = `delete from alerts where id = ${alertId} and user_id = ${userId} and chat_id = ${chatId};`
          } else { // Down price alerts.
               deleteQuery = `delete from lowalerts where id = ${alertId} and user_id = ${userId} and chat_id = ${chatId};`
          }

          queryDatabase(deleteQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("disabledAlertText", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function deleteCryptoForUserId(cryptoName, userId, languageCode) {
     return new Promise(function (resolve, reject) {
          let deleteQuery = `delete from cryptocurrencies where name = '${cryptoName}' and user_id = ${userId};`

          queryDatabase(deleteQuery).then(function (result) {
               helpers.log(result);
               resolve(util.format(localization.getText("deleteMessage", languageCode), cryptoName));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function deleteSchedulerForUserId(userId, chatId, languageCode) {
     return new Promise(function (resolve, reject) {
          query = `delete from scheduler where user_id = ${userId} and chat_id = ${chatId};`;

          queryDatabase(query).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("disabledNotificationsMessageText", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getAllAlerts(upPriceAlert, languageCode) {
     return new Promise(function (resolve, reject) {
          var selectQuery = "";

          if (upPriceAlert) { // Up price alerts.
               selectQuery = "select * from alerts;";
          } else { // Down price alerts.
               selectQuery = "select * from lowalerts;";
          }

          queryDatabase(selectQuery).then(function (result) {
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let alert = {
                         alertId: obj.id,
                         userId: obj.user_id,
                         name: obj.name,
                         chatId: obj.chat_id,
                         crypto: obj.crypto,
                         price: obj.price
                    };

                    let requestPrice = axios.get(constants.coingeckoBaseUrl + util.format(constants.requestPriceUrl, alert.crypto, constants.currencyParam));
                    let request = [requestPrice];

                    axios.all(request).then(axios.spread((response) => {
                         let price = response.data[alert.crypto][constants.currencyParam];

                         if (upPriceAlert) { // Up price alerts.
                              if (price > alert.price) {
                                   var message = util.format(localization.getText("alertMessage", languageCode), alert.name, alert.crypto, helpers.formatterAmount(2, 8).format(price));

                                   let deleteQuery = `delete from alerts where id = ${alert.alertId} and user_id = ${alert.userId} and chat_id = ${alert.chatId} and name = '${alert.name}' and crypto = '${alert.crypto}';`

                                   queryDatabase(deleteQuery).then(function (result) {
                                        helpers.log(result);
                                        message += util.format(localization.getText("deleteAlertMessage", languageCode), alert.crypto, helpers.formatterAmount(2, 8).format(alert.price));

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
                         } else { // Down price alerts.
                              if (price < alert.price) {
                                   var message = util.format(localization.getText("alertMessage", languageCode), alert.name, alert.crypto, helpers.formatterAmount(2, 8).format(price));

                                   let deleteQuery = `delete from lowalerts where id = ${alert.alertId} and user_id = ${alert.userId} and chat_id = ${alert.chatId} and name = '${alert.name}' and crypto = '${alert.crypto}';`

                                   queryDatabase(deleteQuery).then(function (result) {
                                        helpers.log(result);
                                        message += util.format(localization.getText("deleteAlertMessage", languageCode), alert.crypto, helpers.formatterAmount(2, 8).format(alert.price));

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

function getAllAlertsForUserId(upPriceAlert, userId, chatId, name, languageCode, isForDelete) {
     return new Promise(function (resolve, reject) {
          var selectQuery = "";
          var message = "";

          if (upPriceAlert) { // Up price alerts.
               selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId};`
               message = util.format(localization.getText("alertUserMessage", languageCode), name);
          } else { // Down price alerts.
               selectQuery = `select * from lowalerts where user_id = ${userId} and chat_id = ${chatId};`
               message = util.format(localization.getText("alertDownUserMessage", languageCode), name);
          }

          queryDatabase(selectQuery).then(function (result) {
               var alerts = [];
               var dataMessage = [];
               if (result.rowCount > 0) {
                    for (let row of result.rows) {
                         let json = JSON.stringify(row);
                         let obj = JSON.parse(json);
                         let alert = {
                              alertId: obj.id,
                              userId: obj.user_id,
                              name: obj.name,
                              chatId: obj.chat_id,
                              crypto: obj.crypto,
                              price: obj.price
                         };

                         alerts.push(alert);

                         dataMessage.push(`${helpers.capitalizeFirstLetter(alert.crypto)}: ${helpers.formatterAmount(2, 8).format(alert.price)} €.\n`);
                    }

                    dataMessage.sort();
                    dataMessage.forEach((text) => {
                         message += text
                    });

                    Array.prototype.sortBy = function (p) {
                         return this.slice(0).sort(function (a, b) {
                              return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
                         });
                    }

                    if (isForDelete) {
                         var buttonData = []
                         var sortedAlerts = alerts.sortBy('crypto');
                         sortedAlerts.forEach(alert => {
                              let nameText = `${helpers.capitalizeFirstLetter(alert.crypto)} (${helpers.formatterAmount(2, 2).format(alert.price)} €)`;

                              var deleteControl = "";

                              if (upPriceAlert) { // Up price alerts.
                                   deleteControl = localization.getText("deleteUpAlert", languageCode);
                              } else { // Down price alerts.
                                   deleteControl = localization.getText("deleteDownAlert", languageCode);
                              }

                              let callbackData = `${deleteControl}.id:${alert.alertId}`;
                              buttonData.push([{ text: nameText, callback_data: callbackData }]);
                         });
                         buttonData.push([{
                              text: localization.getText("cancelText", languageCode),
                              callback_data: localization.getText("cancelText", languageCode)
                         }]);

                         resolve(buttonData);
                    } else {
                         resolve(message);
                    }
               } else {
                    if (upPriceAlert) { // Up price alerts.
                         resolve(localization.getText("emptyAlertText", languageCode));
                    } else { // Down price alerts.
                         resolve(localization.getText("emptyLowAlertText", languageCode));
                    }
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
               var schedulers = [];
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let scheduler = {
                         userId: obj.user_id,
                         name: obj.name,
                         chatId: obj.chat_id
                    };
                    schedulers.push(scheduler);
               }
               resolve(schedulers);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getCryptocurrenciesForUserId(userId, languageCode) {
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
               buttonData.push({
                    text: localization.getText("cancelText", languageCode),
                    callback_data: localization.getText("cancelText", languageCode)
               });

               resolve(buttonData);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getInfoWalletForUserId(userId, userName, languageCode) {
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
                    urls.push(axios.get(constants.coingeckoBaseUrl + util.format(constants.requestPriceUrl, name, constants.currencyParam)));
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
                                   let message = util.format(localization.getText("infoWalletCrypto", languageCode),
                                        currency.alias,
                                        currency.price,
                                        helpers.formatterAmount(2, 8).format(crypto.amount),
                                        helpers.formatterAmount(2, 8).format(priceAmount));

                                   cryptoAmount.push(priceAmount);
                                   messages.push(message);

                                   totalWallet += priceAmount;
                              }
                         });
                    });

                    var finalMessage = util.format(localization.getText("infoWalletTotal", languageCode), userName);
                    messages.sort();
                    messages.forEach(text => {
                         finalMessage += text;
                    });
                    let total = util.format(localization.getText("infoWalletTotalMessage", languageCode), helpers.formatterAmount(2, 8).format(totalWallet));
                    finalMessage += total;

                    charts.createChartForTotalWallet(cryptoNames, cryptoAmount, totalWallet, finalMessage, userName, languageCode).then(function (response) {
                         resolve(response);
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
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

function setAlertForUserId(upPriceAlert, chatId, userId, userName, cryptoName, cryptoPrice, languageCode) {
     return new Promise(function (resolve, reject) {
          var selectQuery = "";

          if (upPriceAlert) { // Up price alerts.
               selectQuery = `select * from alerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${cryptoName}' and price = ${cryptoPrice};`
          } else { // Down price alerts.
               selectQuery = `select * from lowalerts where user_id = ${userId} and chat_id = ${chatId} and crypto = '${cryptoName}' and price = ${cryptoPrice};`
          }

          queryDatabase(selectQuery).then(function (result) {
               if (result.rowCount > 0) {
                    resolve(localization.getText("statusEnabledAlertText", languageCode));
               } else {
                    var insertQuery = "";

                    if (upPriceAlert) { // Up price alerts.
                         insertQuery = `insert into alerts (user_id, name, chat_id, crypto, price) values (${userId},'${userName}',${chatId},'${cryptoName}',${cryptoPrice});`;
                    } else { // Down price alerts.
                         insertQuery = `insert into lowalerts (user_id, name, chat_id, crypto, price) values (${userId},'${userName}',${chatId},'${cryptoName}',${cryptoPrice});`;
                    }

                    queryDatabase(insertQuery).then(function (result) {
                         helpers.log(result);
                         var message = localization.getText("deleteAlertTitleText", languageCode);
                         message += localization.getText("enabledAlertText", languageCode);
                         resolve(message);
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function setChatIdForUpdate(chatId, languageCode) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into update (chat_id) values (${chatId});`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("success", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function setCryptoForUserId(amountCrypto, userId, nameCrypto, aliasCrypto, languageCode) {
     return new Promise(function (resolve, reject) {
          let updateQuery = `update cryptocurrencies set amount = ${amountCrypto} where user_id = ${userId} and name = '${nameCrypto}' and alias = '${aliasCrypto}';`
          let insertQuery = `insert into cryptocurrencies (user_id, name, alias, amount) values (${userId},'${nameCrypto}','${aliasCrypto}',${amountCrypto});`;

          queryDatabase(updateQuery).then(function (result) {
               if (result.rowCount == 0) {
                    queryDatabase(insertQuery).then(function (result) {
                         helpers.log(result);
                         resolve(util.format(localization.getText("addCrypto", languageCode), nameCrypto));
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
               } else {
                    resolve(util.format(localization.getText("updateCrypto", languageCode), nameCrypto));
               }
          }).catch(function (err) {
               helpers.log(err);
               queryDatabase(insertQuery).then(function (result) {
                    helpers.log(result);
                    resolve(util.format(localization.getText("addCrypto", languageCode), nameCrypto));
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          });
     });
};

function setSchedulerForUserId(userId, chatId, userName, languageCode) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select * from scheduler where user_id = ${userId} and chat_id = ${chatId};`;

          queryDatabase(selectQuery).then(function (result) {
               if (result.rowCount > 0) {
                    resolve(localization.getText("statusEnabledNotificationsText", languageCode));
               } else {
                    let insertQuery = `insert into scheduler (user_id, name, chat_id) values (${userId},'${userName}','${chatId}');`;

                    queryDatabase(insertQuery).then(function (result) {
                         helpers.log(result);
                         resolve(localization.getText("enabledNotificationsMessageText", languageCode));
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

module.exports.deleteAlertForId = deleteAlertForId;
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