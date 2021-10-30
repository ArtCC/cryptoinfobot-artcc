## With this Telegram bot you can add and remove your cryptocurrencies to your wallet to give you their total and individual price. It is developed in NodeJS and deployed on Heroku.

[You can add the bot to Telegram from this link](https://t.me/artcc_cryptoinfobot)

This bot is anonymous, it does not capture data if it is added to a group and the only data that is stored in the database is your telegram user id in order to associate your cryptocurrencies that you add.

<p><strong>Commands in Spanish language to use the bot:</p></strong>

<p>alerta - Activa o borra una alerta de precios para una criptomoneda. Ej: /alerta ethereum 3500</p>
<p>alertabaja - Activa o borra una alerta de bajada de precios para una criptomoneda. Ej: /alerta cardano 1.50</p>
<p>alertas - Te muestro todas tus alertas de precios</p>
<p>baja - Elimino todos los datos que tengo sobre ti definitivamente</p>
<p>borrar - Puedes borrar una criptomoneda de tu cartera</p>
<p>cartera - Te digo el valor total de tu cartera de criptomonedas</p>
<p>cripto - Añade una criptomoneda a tu cartera. Ej: /cripto cardano ADA 10</p>
<p>donar - Puedes apoyar económicamente el proyecto. ¡Gracias!</p>
<p>hola - Te saludo amablemente por tu nombre y te doy información sobre mí</p>
<p>notificaciones - Puedes activar o desactivar notificaciones automáticas del valor de tu cartera</p>
<p>precio - Dime una criptomoneda para darte su precio actual y gráfica por días. Ej: /precio cardano 1</p>
<p>start - Te doy información sobre mí e inicio mi actividad contigo</p>

### Database in Heroku Postgres:

```
CREATE TABLE ALERTS(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   CHAT_ID INT NOT NULL,
   CRYPTO TEXT NOT NULL,
   PRICE DOUBLE PRECISION NOT NULL
);
```

```
CREATE TABLE CRYPTOCURRENCIES(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   ALIAS TEXT NOT NULL,
   AMOUNT DOUBLE PRECISION NOT NULL
);
```

```
CREATE TABLE LOWALERTS(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   CHAT_ID INT NOT NULL,
   CRYPTO TEXT NOT NULL,
   PRICE DOUBLE PRECISION NOT NULL
);
```

```
CREATE TABLE SCHEDULER(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   CHAT_ID INT NOT NULL
);
```

```
CREATE TABLE UPDATE(
   CHAT_ID INT PRIMARY KEY NOT NULL
);
```

## DONATE WITH CRYPTOCURRENCIES

You can help by donating to the project with cryptocurrencies. Thanks!

<p><b>Bitcoin (BTC): </b>bc1qkrh7mrvxzndek447vgzegk5hsl8l405x4v07xx</p>
<p><b>Cardano (ADA): </b>addr1q935l63rku9pdft4z6lj6v7z5hx7qhxxrr2gvcs7naya4ktrfl4z8dc2z6jh294l95eu9fwdupwvvxx5se3pa86fmtvswyvhv4</p>
<p><b>Ethereum (ETH): </b>0xA9334474c66ad4e9f510241D4C5253C71f103424</p>
<p><b>Shiba Inu (SHIB): </b>0xA9334474c66ad4e9f510241D4C5253C71f103424</p>
<p><b>VeChain (VET): </b>0xF49673f8EC4437A1Fa6860508E7a6bDC2d352aF4</p>

## LICENSE

This project is free and use <b>MIT license</b>.

## THANK YOU!

I hope you like it!

##### ArtCC 2021++