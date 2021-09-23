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
        let sortedForDays = sortedMarketChartCollectionForDay(marketChart);

        var dates = [];
        var prices = [];
        sortedForDays.forEach(obj => {
            dates.push(obj.dateString);
            prices.push(obj.price);
        });

        let data = {
            labels: dates,
            datasets: [{
                label: `Precio de ${helpers.capitalizeFirstLetter(cryptoName)} en los últimos ${sortedForDays.length} días.`,
                data: prices,
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

function sortedMarketChartCollectionForDay(data) {
    var tempCollection = [];
    var finalCollection = [];
    data.forEach(obj1 => {
        if (!tempCollection.includes(obj1)) {
            tempCollection = [];
            data.forEach(obj2 => {
                if (obj1.dateString === obj2.dateString) {
                    tempCollection.push(obj2);
                }
            });
            finalCollection.push(tempCollection);
        }
    });
    let sortedForDays = [];
    finalCollection.forEach(collection => {
        var date;
        var dateString;
        var priceDay = 0;
        collection.forEach(obj => {
            date = obj.date;
            dateString = obj.dateString;
            priceDay = priceDay + obj.price;
        });
        let object = {
            date: date,
            dateString: dateString,
            price: priceDay / collection.length
        };
        sortedForDays.push(object);
    });
    return sortedForDays;
};

module.exports.createChartForTotalWallet = createChartForTotalWallet;
module.exports.createLinechartForMarketPrices = createLinechartForMarketPrices;