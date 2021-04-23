const fetch = require("node-fetch");

const reftreshInterval = 5 * 60 * 1000; // 5min

let aktMarketData = null;

exports.syncAtInterval = async () => {
    await fetchLatestData();
    setInterval(async () => {
        await fetchLatestData();
    }, reftreshInterval);
}

async function fetchLatestData() {
    const endpointUrl = "https://ascendex.com/api/pro/v1/ticker?symbol=AKT%2FUSDT";

    console.log("Fetching latest market data from " + endpointUrl);

    const response = await fetch(endpointUrl);
    const data = await response.json();

    aktMarketData = {
        open: parseFloat(data.data.open),
        close: parseFloat(data.data.close),
        high: parseFloat(data.data.high),
        low: parseFloat(data.data.low),
        volume: parseInt(data.data.volume),
        ask: parseFloat(data.data.ask["0"]),
        bid: parseFloat(data.data.bid["0"])
    };
    aktMarketData.computedPrice = (aktMarketData.ask + aktMarketData.bid) / 2;
}

exports.getAktMarketData = () => {
    return aktMarketData;
}