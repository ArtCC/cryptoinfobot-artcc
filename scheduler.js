const app = require('./index');

function sendTotalWallet() {
    /**
    let selectSchedulerQuery = `select * from scheduler`;

    app.queryDatabase(selectSchedulerQuery).then(function (result) {
        for (let row of result.rows) {
            let json = JSON.stringify(row);
            let obj = JSON.parse(json);
            let scheduler = {
                 userId: obj.user_id,
                 name: obj.name,
                 chatId: obj.chat_id
            };
            
            let selectCryptocurrenciesQuery = `select * from cryptocurrencies where user_id = ${scheduler.userId};`

            var cryptoCurrencies = [];
            var cryptoNames = [];

            app.queryDatabase(selectCryptocurrenciesQuery).then(function (result) {
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
               
                app.bot.sendMessage(scheduler.chatId, `Este es el total en euros de tu cartera de criptomonedas ${scheduler.name}\n\n`);
               
                var urls = [];
                cryptoNames.forEach(name => {
                    urls.push(app.axios.get(app.baseUrl + `/simple/price?ids=${name}&vs_currencies=${app.currencyParam}`));
                });

                var collection = [];
                app.axios.all(urls).then(responseArr => {
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
                                let message = `<b>${currency.alias} (${currency.price} €):</b> Cantidad: ${app.formatter.format(crypto.amount)} - Total: ${app.formatter.format(priceAmount)} €\n`;
                              
                                messages.push(message);
                              
                                totalWallet += priceAmount;
                            }
                        });
                    });
                    var finalMessage = "";
                    messages.forEach(text => {
                        finalMessage += text;
                    });
                    let total = `\n<b>Total en cartera: </b><i> ${app.formatter.format(totalWallet)} €</i>\n`;
                    finalMessage += total;

                    app.sendMessageToBot(scheduler.chatId, finalMessage, "HTML");
                }).catch(error => {
                    app.sendErrorMessageToBot(chatId);
                });
            }).catch(function (err) {
                console.log(err);
            });
       }
    }).catch(function (err) {
        console.log(err);
    });*/
};

sendTotalWallet();