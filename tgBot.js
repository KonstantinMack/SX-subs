import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import connection from "./db.js";
import { shortenAddress, sendDevMsg } from "./helpers.js";

const token =
  process.env.NODE_ENV === "production"
    ? process.env.TELEGRAM_BOT_TOKEN
    : process.env.DEV_TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  const tgUserName = msg.chat.username;

  var user = {
    clerkId: resp,
    telegramId: chatId,
    telegramName: tgUserName,
  };

  if (resp) {
    connection.query(
      "DELETE FROM telegram WHERE clerkId = ?",
      resp,
      function (error) {
        if (error) {
          console.log(error);
          sendDevMsg(error, "Error in deleting entry by clerkId");
          return;
        }
        connection.query("INSERT INTO telegram SET ?", user, function (error) {
          if (error) {
            console.log(error);
            sendDevMsg(error, "Error in inserting telegramId into db");
            return;
          }
        });
      }
    );

    bot.sendMessage(chatId, "Connected sx-lab account to telegram");
  }
});

bot.onText(/\/tipsters/, (msg) => {
  const chatId = msg.chat.id;
  connection.query(
    "SELECT bettor FROM favourites WHERE address IN (SELECT clerkId FROM telegram WHERE telegramId = ?)",
    chatId,
    function (error, results) {
      if (error) {
        console.log(error);
        sendDevMsg(error, "Error in fetching tipsters from db");
        return;
      }
      const tipsters = results.map((result) => result.bettor);
      const tipsterMsg = `*Tipsters:* \n- ${tipsters
        .map(
          (tipster) =>
            `[${shortenAddress(
              tipster
            )}](https://www.sx-lab.bet/user/${tipster})`
        )
        .join(" \n- ")}`;
      bot.sendMessage(chatId, tipsterMsg, { parse_mode: "Markdown" });
    }
  );
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  connection.query(
    "DELETE FROM telegram WHERE telegramId = ?",
    chatId,
    function (error) {
      if (error) {
        console.log(error);
        sendDevMsg(error, "Error in deleting entry by telegramId");
        return;
      }
      bot.sendMessage(
        chatId,
        "Stopped notifications. To restart notifications log into sx-lab.bet and connect your account again."
      );
    }
  );
});

export default bot;
