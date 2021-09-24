const i18n = require("i18n");

i18n.configure({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    register: global,
    directory: './locales'
});

function setLocale(locale) {
    i18n.setLocale = locale;
};

function testLocalization() {
    console.log(i18n.__('Hello'));
    console.log(i18n.__('This is a test'));
};

module.exports.setLocale = setLocale;
module.exports.testLocalization = testLocalization;