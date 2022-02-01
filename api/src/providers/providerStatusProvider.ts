import fetch from "node-fetch";
import { Provider } from "@src/db/schema";

const https = require("https");

const reftreshInterval = 60 * 60 * 1_000; // 60min

export const fetchProvidersInfoAtInterval = async () => {
  await fetchProvidersInfo();
  setInterval(async () => {
    await fetchProvidersInfo();
  }, reftreshInterval);
};

export async function fetchProvidersInfo() {
  let providers = await Provider.findAll();

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  let doneCount = 0;
  const tasks = providers.map(async (provider) => {
    try {
      const response = await fetch(provider.hostUri + "/status", {
        agent: httpsAgent
      });

      if (response.status !== 200) throw "Invalid response status: " + response.status;

      const data = await response.json();

      const activeResources = sumResources(data.cluster.inventory.active);
      const pendingResources = sumResources(data.cluster.inventory.pending);
      const availableResources = sumResources(data.cluster.inventory.available);

      await Provider.update(
        {
          isOnline: true,
          error: null,
          lastCheckDate: new Date(),
          deploymentCount: data.manifest.deployments,
          leaseCount: data.cluster.leases,
          activeCPU: activeResources.cpu,
          activeMemory: activeResources.memory,
          activeStorage: activeResources.storage,
          pendingCPU: pendingResources.cpu,
          pendingMemory: pendingResources.memory,
          pendingStorage: pendingResources.storage,
          availableCPU: availableResources.cpu,
          availableMemory: availableResources.memory,
          availableStorage: availableResources.storage
        },
        {
          where: { owner: provider.owner }
        }
      );
    } catch (err) {
      await Provider.update(
        {
          isOnline: false,
          lastCheckDate: new Date(),
          error: err?.message || err,
          deploymentCount: null,
          leaseCount: null,
          activeCPU: null,
          activeMemory: null,
          activeStorage: null,
          pendingCPU: null,
          pendingMemory: null,
          pendingStorage: null,
          availableCPU: null,
          availableMemory: null,
          availableStorage: null
        },
        {
          where: { owner: provider.owner }
        }
      );
    } finally {
      doneCount++;
      console.log("Fetched provider info: " + doneCount + " / " + providers.length);
    }
  });

  await Promise.all(tasks);

  console.log("Finished refreshing provider infos");
}

function sumResources(resources) {
  return (resources || [])
    .map((x) => ({
      cpu: parseInt(x.cpu.units.val),
      memory: parseInt(x.memory.size.val),
      storage: parseInt(x.storage.size.val)
    }))
    .reduce(
      (prev, next) => ({
        cpu: prev.cpu + next.cpu,
        memory: prev.memory + next.memory,
        storage: prev.storage + next.storage
      }),
      {
        cpu: 0,
        memory: 0,
        storage: 0
      }
    );
}

export async function getNetworkCapacity() {
  const providers = await Provider.findAll({
    where: {
      isOnline: true
    }
  });

  return {
    activeProviderCount: providers.length,
    cpu: providers.map((x) => x.availableCPU + x.pendingCPU + x.activeCPU).reduce((a, b) => a + b, 0),
    memory: providers.map((x) => x.availableMemory + x.pendingMemory + x.activeMemory).reduce((a, b) => a + b, 0),
    storage: providers.map((x) => x.availableStorage + x.pendingStorage + x.activeStorage).reduce((a, b) => a + b, 0)
  };
}
