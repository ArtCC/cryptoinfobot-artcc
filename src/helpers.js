const localization = require('./localization');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

function formatterAmount(minimum, maximum) {
    const formatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: minimum,
        maximumFractionDigits: maximum,
    });
    return formatter;
};

function getCommands(languageCode) {
    return [{
        command: localization.getText("alertCommand", languageCode),
        description: localization.getText("alertCommandDescription", languageCode)
    },
    {
        command: localization.getText("alertsCommand", languageCode),
        description: localization.getText("alertsCommandDescription", languageCode)
    },
    {
        command: localization.getText("deleteCommand", languageCode),
        description: localization.getText("deleteCommandDescription", languageCode)
    },
    {
        command: localization.getText("walletCommand", languageCode),
        description: localization.getText("walletCommandDescription", languageCode)
    },
    {
        command: localization.getText("cryptoCommand", languageCode),
        description: localization.getText("cryptoCommandDescription", languageCode)
    },
    {
        command: localization.getText("donateCommand", languageCode),
        description: localization.getText("donateCommandDescription", languageCode)
    },
    {
        command: localization.getText("helloCommand", languageCode),
        description: localization.getText("helloCommandDescription", languageCode)
    },
    {
        command: localization.getText("notificationsCommand", languageCode),
        description: localization.getText("notificationsCommandDescription", languageCode)
    },
    {
        command: localization.getText("priceCommand", languageCode),
        description: localization.getText("priceCommandDescription", languageCode)
    },
    {
        command: localization.getText("startCommand", languageCode),
        description: localization.getText("startCommandDescription", languageCode)
    }];
};

function log(message) {
    console.log(message);
};

module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.formatterAmount = formatterAmount;
module.exports.getCommands = getCommands;
module.exports.log = log;