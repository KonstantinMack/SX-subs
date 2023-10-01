const MARKET_TYPES = {
  1: "1X2",
  52: "game-lines",
  88: "game-lines",
  226: "game-lines",
  3: "game-lines",
  201: "game-lines",
  342: "game-lines",
  2: "game-lines",
  835: "game-lines",
  28: "game-lines",
  29: "game-lines",
  166: "game-lines",
  1536: "game-lines",
  274: "outright-winner",
  202: "first-period-lines",
  203: "second-period-lines",
  204: "third-period-lines",
  205: "fourth-period-lines",
  866: "set-betting",
  165: "set-betting",
  53: "first-half-lines",
  64: "first-period-lines",
  65: "second-period-lines",
  66: "third-period-lines",
  63: "first-half-lines",
  77: "first-half-lines",
  21: "first-period-lines",
  45: "second-period-lines",
  46: "third-period-lines",
  281: "first-five-innings",
  1618: "first-five-innings",
  236: "first-five-innings",
};

const BASE_TOKEN_NAMES = {
  "0xe2aa35C2039Bd0Ff196A6Ef99523CC0D3972ae3e": "USDC",
  "0xA173954Cc4b1810C0dBdb007522ADbC182DaB380": "ETH",
  "0xaa99bE3356a11eE92c3f099BD7a038399633566f": "SX",
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": "DAI",
};

const BASE_TOKEN_DECIMALS = {
  "0xe2aa35C2039Bd0Ff196A6Ef99523CC0D3972ae3e": 6,
  "0xA173954Cc4b1810C0dBdb007522ADbC182DaB380": 18,
  "0xaa99bE3356a11eE92c3f099BD7a038399633566f": 18,
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": 18,
};

const SPORTS = [
  "All",
  "Baseball",
  "Basketball",
  "Crypto",
  "E Sports",
  "Football",
  "Hockey",
  "Mixed Martial Arts",
  "Racing",
  "Soccer",
  "Tennis",
  "Other",
];

export { MARKET_TYPES, BASE_TOKEN_NAMES, BASE_TOKEN_DECIMALS, SPORTS };
