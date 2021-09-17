## With this Telegram bot you can add and remove your cryptocurrencies to your wallet to give you their total and individual price. It is developed in NodeJS and deployed on Heroku.

[You can add the bot to Telegram from this link](https://t.me/artcc_cryptoinfobot)

This bot is anonymous, it does not capture data if it is added to a group and the only data that is stored in the database is your telegram user id in order to associate your cryptocurrencies that you add.

<p><strong>Commands in Spanish language to use the bot:</p></strong>

<p>hola - Te saludo amablemente por tu nombre y te doy información sobre mí</p>
<p>borrar - Puedes borrar una criptomoneda de tu cartera</p>
<p>cartera - Te digo el valor total de tu cartera de criptomonedas en euros</p>
<p>cripto - Añade una criptomoneda a tu cartera. Ej: /cripto cardano ADA 10</p>
<p>notificaciones - Puedes activar o desactivar notificaciones automáticas del valor de tu cartera</p>
<p>precio - Dime una criptomoneda para darte su precio actual. Ej: /precio cardano</p>

### Database in Heroku Postgres:

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
CREATE TABLE SCHEDULER(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   CHAT_ID INT NOT NULL
);
```

## LICENSE

This project is free and use <b>MIT license</b>.

## THANK YOU!

I hope you like it!

##### ArtCC 2021++
