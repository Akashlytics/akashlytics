import { sleep } from "@src/shared/utils/delay";

const fetch = require("node-fetch");

const apiEndpoints = [
  //"http://135.181.60.250:1317",
  "http://162.55.94.246:1518",
  "http://135.181.181.120:1518",
  "http://135.181.181.119:1518",
  "http://135.181.181.121:1518",
  "http://135.181.181.122:1518",
  "http://135.181.181.123:1518"
];

export function createNodeAccessor() {
  let maxConcurrentQueries = 10;
  let nodeClients = apiEndpoints.map((x) => createEndpointAccessor(x, maxConcurrentQueries));

  return {
    waitForAllFinished: async () => {
      while (nodeClients.some((x) => x.pendingQueries().length > 0)) {
        await sleep(5);
      }
    },
    waitForAvailableNode: async () => {
      while (!nodeClients.some((x) => x.isAvailable())) {
        await sleep(5);
      }
    },
    fetch: async (url, callback?) => {
      const node = nodeClients.find((x) => x.isAvailable());
      return node.fetch(url, callback);
    },
    displayTable: () => {
      console.table(
        nodeClients.map((x) => ({
          endpoint: x.endpoint,
          fetching: x
            .pendingQueries()
            .map((x) => x.startsWith("/blocks") ? x.replace("/blocks/", "") : x.substring(60))
            .join(","),
          fetched: x.count(),
          errors: x.errorCount()
        }))
      );
    }
  };
};

function createEndpointAccessor(endpoint, maxConcurrentQueries) {
  let pendingQueries = [];
  let count = 0;
  let errorCount = 0;

  return {
    endpoint: endpoint,
    pendingQueries: () => pendingQueries,
    count: () => count,
    errorCount: () => errorCount,
    isAvailable: () => {
      return pendingQueries.length < maxConcurrentQueries;
    },
    fetch: async (url, callback) => {
      pendingQueries.push(url);
      const fullUrl = endpoint + url;

      const response = await fetch(fullUrl);

      if (response.status === 200) {
        count++;
        const json = await response.json();

        if (callback) {
          await callback(json);
        }
        await sleep(Math.random() * 400 + 100);

        pendingQueries = pendingQueries.filter((x) => x !== url);

        return json;
      } else {
        console.error(response);
        errorCount++;
        throw "Stopped";
      }
    }
  };
}
