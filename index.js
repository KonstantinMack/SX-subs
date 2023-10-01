import "dotenv/config";
import Ably from "ably";
import axios from "axios";
import connection from "./db.js";
import bot from "./tgBot.js";
import { createBetMsg, sendDevMsg, filterSports } from "./helpers.js";

process.env.NODE_ENV === "production"
  ? console.log("Using production env")
  : console.log("Using development env");

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

  if (data.tradeStatus === "SUCCESS") {
    connection.query(
      `SELECT 
        fv.userId, 
        fv.bettor, 
        fv.name, 
        fv.makerFilter, 
        fv.sportsFilter, 
        fv.stakeFilter, 
        tg.telegramId
       FROM favourites fv
       JOIN telegram tg ON fv.userId = tg.clerkId
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
          const [betMsgTemplate, sportsLabel] = await createBetMsg(data);
          results.forEach((result) => {
            if (data.betTimeValue < result.stakeFilter) return;
            if (data.maker && result.makerFilter === "taker") return;
            if (!data.maker && result.makerFilter === "maker") return;
            if (!filterSports(result.sportsFilter, sportsLabel)) return;
            bot.sendMessage(
              result.telegramId,
              betMsgTemplate({ bettor: result.name ?? data.bettor }),
              {
                parse_mode: "Markdown",
                disable_web_page_preview: true,
              }
            );
          });
        } catch (error) {
          sendDevMsg(error, "Error in sending bet message");
          console.log({ error });
        }
      }
    );
  }
});
