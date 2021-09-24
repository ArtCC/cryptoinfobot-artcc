const i18n = require("i18n");

i18n.configure({
    locales: ['en', 'es'],
    defaultLocale: 'en',
    register: global,
    directory: './locales'
});

function testLocalization() {
    console.log(i18n.__('Hello'));
    console.log(i18n.__('This is a test'));
};

module.exports.testLocalization = testLocalization;