module.exports = {
    coingeckoBaseUrl: "https://api.coingecko.com/api/v3",
    requestPriceUrl: "/simple/price?ids=%s&vs_currencies=%s",
    requestMarketChartUrl: "/coins/%s/market_chart?vs_currency=%s&days=%s",
    currencyParam: "eur",
    parseMode: "HTML",
    donatePhotoUrl: "https://cdn.pixabay.com/photo/2020/04/22/11/59/thank-you-5077738_960_720.jpg",
    timezone: "Europe/Madrid",
    helloMessageText: "\n\nEscribe la barra / para ver en qué te puedo ayudar.\n\nAñade tus criptomonedas y recibe el valor total de tu cartera usando el API de Coingecko.\n\nMás información: https://github.com/ArtCC/cryptoinfobot-artcc\n\n",
    cancelText: "Cancelar",
    deleteText: "¿Qué criptomoneda quieres borrar de tu cartera?",
    sendInfoText: `¡Hola %s!%s`,
    infoPriceTitleText: "El precio actual del %s es %s €.\n\n",
    infoPriceText: "Puedes consultar el listado de criptomonedas disponibles en https://www.coingecko.com/es",
    errorText: "¡Vaya! Parece que ha habido un problema con tu solicitud. Inténtalo de nuevo por favor.",
    notificationsTitleText: "¿Quieres activar las notificaciones automáticas del valor de tu cartera?",
    enabledNotificationsText: "Activar",
    disabledNotificationsText: "Desactivar",
    enabledNotificationsMessageText: "He activado las notificaciones para darte el valor de tu cartera de forma automática (08h - 15h - 21h).",
    disabledNotificationsMessageText: "He desactivado las notificaciones.",
    statusEnabledNotificationsText: "Ya tienes activadas las notificaciones en este chat.",
    statusEnabledAlertText: "Ya tienes activadas las alertas de precio para esta criptomoneda en este chat.",
    enabledAlertText: "He activado la alerta correctamente.",
    disabledAlertText: "He borrado la alerta correctamente.",
    emptyAlertText: "No tienes ninguna alerta de precios añadida actualmente. Puedes añadirlas por ejemplo con /alerta ethereum 3500",
    noText: "De acuerdo.",
    tokenError: "El token es incorrecto.",
    amountText: "Importe",
    totalText: "Total",
    paymentTitleText: "Gracias por apoyar el proyecto",
    paymentDescriptionText: "Con tu apoyo económico podremos mejorar el servidor donde se aloja el bot para que más usuarios puedan utilizarlo y dar más funcionalidad al mismo para que sea el mejor bot de Telegram sobre criptomonedas y tu cartera.",
    paymentPayloadText: "cryptoinfobot-artcc",
    paymentStartParameterText: "",
    paymentCurrencyText: "EUR",
    paymentPriceLabelText: "Donación",
    coinPaymentTitleText: "Gracias por apoyar el proyecto. ¿Cuánto quieres donar?",
    oneCoinText: "1 €",
    threeCoinText: "3 €",
    fiveCoinText: "5 €",
    alertCommand: 'alerta',
    alertCommandDescription: 'Activa una alerta de precios para una criptomoneda (Para borrar enviar el precio a 0. Ej: /alerta ethereum 3500',
    alertsCommand: 'alertas',
    alertsCommandDescription: 'Te muestro todas las alertas de precios que tienes configuradas',
    deleteCommand: 'borrar',
    deleteCommandDescription: 'Puedes borrar una criptomoneda de tu cartera',
    walletCommand: 'cartera',
    walletCommandDescription: 'Te digo el valor total de tu cartera de criptomonedas',
    cryptoCommand: 'cripto',
    cryptoCommandDescription: 'Añade una criptomoneda a tu cartera. Ej: /cripto cardano ADA 10',
    donateCommand: 'donar',
    donateCommandDescription: 'Puedes apoyar económicamente el proyecto',
    helloCommand: 'hola',
    helloCommandDescription: 'Te saludo amablemente por tu nombre y te doy información sobre mí',
    notificationsCommand: 'notificaciones',
    notificationsCommandDescription: 'Puedes activar o desactivar notificaciones automáticas del valor de tu cartera',
    priceCommand: 'precio',
    priceCommandDescription: 'Dime una criptomoneda para darte su precio actual y evolución en una gráfica por días. Ej: /precio cardano 1',
    startCommand: 'start',
    startCommandDescription: 'Te doy información sobre mí e inicio mi actividad contigo'
};