import "dotenv/config";
import Ably from "ably";
import axios from "axios";
import connection from "./db.js";
import bot from "./tgBot.js";
import { createBetMsg, sendDevMsg } from "./helpers.js";

async function createTokenRequest() {
  const response = await axios.get("https://api.sx.bet/user/token", {
    headers: {
      "x-api-key": process.env.SX_BET_API_KEY,
    },
  });
  return response.data;
}

const ably = new Ably.Realtime.Promise({
  authCallback: async (tokenParams, callback) => {
    try {
      const tokenRequest = await createTokenRequest();
      // Make a network request to GET /user/token passing in
      // `x-api-key: [YOUR_API_KEY]` as a header
      callback(null, tokenRequest);
    } catch (error) {
      callback(error, null);
    }
  },
});

await ably.connection.once("connected");
console.log("Connected to Ably!");

// get the channel to subscribe to
const channel = ably.channels.get(`recent_trades`);
channel.subscribe((message) => {
  console.log({ _id: message.data._id, marketHash: message.data.marketHash });

  const data = message.data;

  if (data.tradeStatus === "SUCCESS" && data.maker === false) {
    connection.query(
      `SELECT fv.address, fv.bettor, tg.telegramId
       FROM favourites fv
       JOIN telegram tg ON fv.address = tg.clerkId
       WHERE bettor = ?`,
      data.bettor,
      async function (error, results) {
        if (error) {
          sendDevMsg(error, "Error in fetching tipsters from db");
          console.log({ error });
          return;
        }
        if (results.length === 0) return;
        try {
          const betMsg = await createBetMsg(data);
          results.map((result) => {
            bot.sendMessage(result.telegramId, betMsg, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            });
          });
        } catch (error) {
          sendDevMsg(error, "Error in sending bet message");
          console.log({ error });
        }
      }
    );
  }
});
