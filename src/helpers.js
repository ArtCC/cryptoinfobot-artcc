const formatter = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports.formatter = formatter;
module.exports.capitalizeFirstLetter = capitalizeFirstLetter;