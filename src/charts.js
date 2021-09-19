const constants = require('./constants');
const helpers = require('./helpers');
const QuickChart = require('quickchart-js');

function createChartForTotalWallet(cryptoNames, cryptoAmount, totalWallet, finalMessage, userName) {
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
                        doughnutlabel: {
                            labels: [{
                                text: `${helpers.formatter.format(totalWallet)} €\nCartera de ${userName}`,
                                font: {
                                    size: 20,
                                    weight: 'bold'
                                }
                            }, {
                                text: constants.totalText
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

module.exports.createChartForTotalWallet = createChartForTotalWallet;