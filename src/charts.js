const constants = require('./constants');
const helpers = require('./helpers');
const QuickChart = require('quickchart-js');

function createChartForTotalWallet(cryptoNames, cryptoAmount, finalMessage) {
    return new Promise(function (resolve, reject) {
        const myChart = new QuickChart();
        myChart
            .setConfig({
                type: 'doughnut',
                data: { labels: cryptoNames, datasets: [{ label: constants.amountText, data: cryptoAmount }] },
                options: { plugins: { doughnutlabel: { labels: [{ text: `${helpers.formatter.format(totalWallet)}`, font: { size: 20 } }, { text: constants.totalText }] } } }
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