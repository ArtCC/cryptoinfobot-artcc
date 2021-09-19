const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});

function getAllAlerts(userId, chatId, name) {
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
               resolve(err);
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

module.exports.getAllAlerts = getAllAlerts;
module.exports.queryDatabase = queryDatabase;