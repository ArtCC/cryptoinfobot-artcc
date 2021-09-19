const constants = require('./constants');
const helpers = require('./helpers');
const QuickChart = require('quickchart-js');

function createChartForTotalWallet(cryptoNames, cryptoAmount, totalWallet, finalMessage) {
    return new Promise(function (resolve, reject) {
        const myChart = new QuickChart();
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
                                weight: 'bold'
                            }
                        },
                        doughnutlabel: [{
                            text: `${helpers.formatter.format(totalWallet)}`,
                            font: {
                                size: 22,
                                weight: 'bold'
                            }
                        }, {
                            text: constants.totalText
                        }]
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

module.exports.createChartForTotalWallet = createChartForTotalWallet;