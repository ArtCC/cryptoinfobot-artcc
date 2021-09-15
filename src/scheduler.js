const schedule = require('node-schedule');

schedule.scheduleJob('*/15 * * * *', () => {
    console.log("Hello world!");
});

/**
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
            
            main.getInfoWallet(scheduler.chatId, scheduler.userId, scheduler.name);
       }
   }).catch(function (err) {
       console.log(`sendTotalWallet: ${err}`);
   });
};

sendTotalWallet();*/