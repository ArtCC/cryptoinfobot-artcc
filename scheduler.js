const app = require('./index');

function sendTotalWallet() {
    let selectSchedulerQuery = `select * from scheduler`;

    app.pool.queryDatabase(selectSchedulerQuery).then(function (result) {
        for (let row of result.rows) {
            let json = JSON.stringify(row);
            let obj = JSON.parse(json);
            let scheduler = {
                 userId: obj.user_id,
                 name: obj.name,
                 chatId: obj.chat_id
            };
            
            let selectCryptocurrenciesQuery = `select * from cryptocurrencies where user_id = ${scheduler.userId};`

            app.pool.queryDatabase(selectCryptocurrenciesQuery).then(function (result) {
                console.log(result);
            }).catch(function (err) {
                console.log(err);
            });
       }
    }).catch(function (err) {
        console.log(err);
    });
};

sendTotalWallet();