const constants = require('./constants');
const helpers = require('./helpers');
const QuickChart = require('quickchart-js');

function createChartForTotalWallet(cryptoNames, cryptoAmount, totalWallet, finalMessage, userName) {
    return new Promise(function (resolve, reject) {
        let myChart = new QuickChart();
        myChart
            .setConfig({
                type: 'doughnut',
                data: {
                    labels: cryptoNames,
                    datasets: [{
                        data: cryptoAmount
                    }]
                },
                options: {
                    plugins: {
                        datalabels: {
                            display: true,
                            backgroundColor: '#ccc',
                            borderRadius: 3,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        doughnutlabel: {
                            labels: [{
                                text: `Cartera de ${userName}:\n${helpers.formatter.format(totalWallet)} €`,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }]
                        }
                    }
                }
            })
            .setWidth(800)
            .setHeight(400)
            .setBackgroundColor('transparent');

        let response = {
            message: finalMessage,
            urlChart: myChart.getUrl()
        }

        resolve(response);
    });
};

function createLinechartForMarketPrices(cryptoName, marketChart) {
    return new Promise(function (resolve, reject) {
        var timestamp = [];
        var marketPrice = [];
        marketChart.forEach(value => {
            timestamp.push(value.timestamp);
            marketPrice.push(value.price);
        });

        let labels = createDateCollectionFromTimestamp(timestamp);
        let date = Date.now();
        let titleLabel = `${date.getDate()}/${date.getMonth() + 1()}/${date.getFullYear()}`;
        let data = {
            labels: labels,
            datasets: [{
                label: `Precio de ${cryptoName} (${titleLabel})`,
                data: marketPrice,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };
        let config = {
            type: 'line',
            data: data,
        };

        let myChart = new QuickChart();
        myChart
            .setConfig(config)
            .setWidth(800)
            .setHeight(400)
            .setBackgroundColor('transparent');

        let response = {
            message: "",
            urlChart: myChart.getUrl()
        }

        resolve(response);
    });
};

function createDateCollectionFromTimestamp(data) {
    var collection = [];
    data.forEach(timestamp => {
        let date = new Date(timestamp)
        let dateString = `${date.getHours() + 2}:${date.getMinutes()}:${date.getSeconds()}`;
        collection.push(dateString);
    });
    return collection;
};

module.exports.createChartForTotalWallet = createChartForTotalWallet;
module.exports.createLinechartForMarketPrices = createLinechartForMarketPrices;