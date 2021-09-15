const index = require('./index');

function sendTotalWallet() {
    let selectQuery = `select * from scheduler`;

    queryDatabase(selectQuery).then(function (result) {
        console.log(result);
    }).catch(function (err) {
        console.log(err);
    });
};

sendTotalWallet();