import "dotenv/config";
import axios from "axios";
import bot from "./tgBot.js";
import {
  MARKET_TYPES,
  BASE_TOKEN_DECIMALS,
  BASE_TOKEN_NAMES,
  SPORTS,
} from "./constants.js";

const fetchMarketData = async (marketHash) => {
  const response = await axios.get(
    `https://api.sx.bet/markets/find?marketHashes=${marketHash}`,
    {
      headers: {
        "x-api-key": process.env.SX_BET_API_KEY,
      },
    }
  );
  return response.data.data[0];
};

const createLinkURL = (marketData) => {
  const sport = marketData.sportLabel.toLowerCase();
  const league = marketData.leagueLabel.toLowerCase().split(" ").join("-");
  const marketType = MARKET_TYPES[marketData.type];
  const linkURL = `https://www.sx.bet/${sport}/${league}/${marketType}/${marketData.sportXeventId}`;
  return linkURL;
};

const convertOdds = (odds) => {
  return Number.parseFloat(1 / (odds / 10 ** 20)).toFixed(2);
};

const convertStake = (stake, baseToken) => {
  return Number.parseFloat(
    stake / 10 ** BASE_TOKEN_DECIMALS[baseToken]
  ).toFixed(2);
};

const shortenAddress = (address) => {
  return address.slice(0, 7) + "..." + address.slice(-7);
};

const sendDevMsg = (msg, info) => {
  const devMsg = `++++++++ Error: ++++++++\n${
    info ?? `Info: ${info}\n`
  }}${JSON.stringify(msg)}`;
  bot.sendMessage(process.env.DEV_TG, devMsg);
};

function createTemplate(template) {
  return (vars) => {
    return template.replace(/<([^>]+)>/g, (_, key) => {
      return vars[key] || "";
    });
  };
}

const createBetMsg = async (betData) => {
  const marketData = await fetchMarketData(betData.marketHash);
  if (!marketData) return "No bet data found";

  const betMsg = `~~~~~~~ New Bet: ~~~~~~~\n*${marketData.sportLabel} - ${
    marketData.leagueLabel
  }*\n${
    marketData.leagueLabel === "Parlays"
      ? marketData.legs
          .map((leg) => {
            return `[${`${leg.teamOneName} vs ${leg.teamTwoName}`}](${createLinkURL(
              leg
            )})\n*Bet:* ${
              leg.bettingOutcomeOne ? leg.outcomeOneName : leg.outcomeTwoName
            }\n`;
          })
          .join("")
      : `[${marketData.teamOneName} vs ${
          marketData.teamTwoName
        }](${createLinkURL(marketData)})`
  }
*Bet:* ${
    betData.bettingOutcomeOne
      ? marketData.outcomeOneName
      : marketData.outcomeTwoName
  }
*Bettor:* [<bettor>](https://www.sx-lab.bet/user/${betData.bettor})
*Bet time:* ${betData.betTime > marketData.gameTime ? "Inplay" : "Pregame"}
*Stake:* ${convertStake(betData.stake, betData.baseToken)} ${
    BASE_TOKEN_NAMES[betData.baseToken]
  }
*Odds:* ${convertOdds(betData.odds)}\n`.replace("_", "\\_");

  const betMsgTemplate = createTemplate(betMsg);

  return [betMsgTemplate, marketData.sportLabel];
};

const filterSports = (sportsFilter, betSportLabel, allowParlay = true) => {
  if (allowParlay && betSportLabel === "Daily Parlays") return true;
  const betFavSports = JSON.parse(sportsFilter);
  if (betFavSports.includes("All")) return true;
  else if (betFavSports.includes(betSportLabel)) return true;
  else if (betFavSports.includes("Other") && !SPORTS.includes(betSportLabel))
    return true;
  else return false;
};

export { createBetMsg, shortenAddress, sendDevMsg, filterSports };
