const formatter = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

function log(message) {
    console.log(message);
};

module.exports.formatter = formatter;
module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.log = log;