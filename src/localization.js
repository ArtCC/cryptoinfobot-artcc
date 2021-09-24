const i18n = require("i18n");

i18n.configure({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    register: global,
    directory: './locales'
});

function getText(text) {
    return i18n.__(text);
};

function setLocale(locale) {
    i18n.setLocale = locale;
};

module.exports.getText = getText;
module.exports.setLocale = setLocale;