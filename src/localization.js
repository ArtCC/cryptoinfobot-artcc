const i18n = require("i18n");

i18n.configure({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    register: global,
    directory: './locales'
});

function getText(text, languageCode) {
    i18n.setLocale = languageCode;
    return i18n.__(text);
};

module.exports.getText = getText;