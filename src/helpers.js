function formatterAmount(minimum, maximum) {
    const formatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: minimum,
        maximumFractionDigits: maximum,
    });
    return formatter;
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

function log(message) {
    console.log(message);
};

module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.formatterAmount = formatterAmount;
module.exports.log = log;