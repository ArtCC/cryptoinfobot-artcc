const crud = require('./crud');
const main = require('../index');

function sendTotalWallet() {
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
            console.log(scheduler);
            // main.getInfoWallet(scheduler.chatId, scheduler.userId, scheduler.name);
       }
   }).catch(function (err) {
       console.log(`sendTotalWallet: ${err}`);
   });
};

sendTotalWallet();