import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import connection from "./db.js";
import { shortenAddress, sendDevMsg } from "./helpers.js";

const token =
  process.env.NODE_ENV === "production"
    ? process.env.TELEGRAM_BOT_TOKEN
    : process.env.DEV_TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const removeBlockedTelegramId = (telegramId) => {
  return new Promise((resolve) => {
    connection.query(
      "DELETE FROM telegram WHERE telegramId = ?",
      [telegramId],
      function (error) {
        if (error) {
          console.log(error);
          sendDevMsg(error, "Error in deleting blocked telegramId");
        }
        resolve();
      }
    );
  });
};

const isForbiddenTelegramError = (error) => {
  return error?.response?.statusCode === 403;
};

const safeSendMessage = async (chatId, text, options = {}) => {
  try {
    await bot.sendMessage(chatId, text, options);
    return true;
  } catch (error) {
    if (isForbiddenTelegramError(error)) {
      await removeBlockedTelegramId(chatId);
      console.log({
        chatId,
        statusCode: error?.response?.statusCode,
        description: error?.response?.body?.description,
      });
      return false;
    }

    console.log(error);
    sendDevMsg(error, `Error in sending message to telegramId: ${chatId}`);
    return false;
  }
};

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
      "DELETE FROM telegram WHERE clerkId = ? OR telegramId = ?",
      [resp, chatId],
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

    safeSendMessage(chatId, "Connected sx-lab account to telegram");
  }
});

bot.onText(/\/tipsters/, (msg) => {
  const chatId = msg.chat.id;
  connection.query(
    "SELECT bettor FROM favourites WHERE userId IN (SELECT clerkId FROM telegram WHERE telegramId = ?)",
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
      safeSendMessage(chatId, tipsterMsg, { parse_mode: "Markdown" });
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
      safeSendMessage(
        chatId,
        "Stopped notifications. To restart notifications log into sx-lab.bet and connect your account again."
      );
    }
  );
});

export { safeSendMessage };
export default bot;
