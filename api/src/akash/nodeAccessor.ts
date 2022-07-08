import { isProd } from "@src/shared/constants";
import { sleep } from "@src/shared/utils/delay";
import fetch from "node-fetch";

const rpcEndpoints = ["http://akash-node.akashlytics.com:26657"];

export function createNodeAccessor() {
  let maxConcurrentQueries = isProd ? 5 : 10;
  let nodeClients = rpcEndpoints.map((x) => createEndpointAccessor(x, maxConcurrentQueries));

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
    fetch: async (url: string, callback?) => {
      const node = nodeClients.find((x) => x.isAvailable());
      return node.fetch(url, callback);
    },
    displayTable: () => {
      console.table(
        nodeClients.map((x) => ({
          endpoint: x.endpoint,
          fetching: x
            .pendingQueries()
            .map((x) => (x.startsWith("/block") ? x.replace("/block?height=", "") : x.substring(63)))
            .join(","),
          fetched: x.count(),
          errors: x.errorCount()
        }))
      );
    }
  };
}

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

      try {
        const fullUrl = endpoint + url;

        const response = await fetch(fullUrl);

        if (response.status === 200) {
          count++;
          const json = await response.json();

          if (callback) {
            await callback(json);
          }
          await sleep(Math.random() * 400 + 100);

          return json;
        } else {
          throw response;
        }
      } catch (err) {
        errorCount++;
        throw err;
      } finally {
        pendingQueries = pendingQueries.filter((x) => x !== url);
      }
    }
  };
}
