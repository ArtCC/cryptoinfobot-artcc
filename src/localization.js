const i18n = require("i18n");

i18n.configure({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    register: global,
    directory: './locales'
});

function getText(text, languageCode) {
    return i18n.__(text);
};

function setLocale(languageCode) {
    i18n.setLocale = languageCode;
};

module.exports.getText = getText;
module.exports.setLocale = setLocale;