import fetch from "node-fetch";
import https from "https";
import { Provider, ProviderAttribute, ProviderAttributeSignature } from "@src/db/schema";

export async function syncProvidersInfo() {
  let providers = await Provider.findAll({
    where: {
      deletedHeight: null
    }
  });

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

function getStorageFromResource(resource) {
  return Object.keys(resource).includes("storage_ephemeral") ? resource.storage_ephemeral : resource.storage;
}

function getCpuValue(cpu) {
  return typeof cpu === "number" ? cpu : parseInt(cpu.units.val);
}

function getByteValue(val) {
  return typeof val === "number" ? val : parseInt(val.size.val);
}

function sumResources(resources) {
  const resourcesArr = resources?.nodes || resources || [];

  return resourcesArr
    .map((x) => ({
      cpu: getCpuValue(x.cpu),
      memory: getByteValue(x.memory),
      storage: getByteValue(getStorageFromResource(x))
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
      isOnline: true,
      deletedHeight: null
    }
  });

  const stats = {
    activeProviderCount: providers.length,
    activeCPU: providers.map((x) => x.activeCPU).reduce((a, b) => a + b, 0),
    activeMemory: providers.map((x) => x.activeMemory).reduce((a, b) => a + b, 0),
    activeStorage: providers.map((x) => x.activeStorage).reduce((a, b) => a + b, 0),
    pendingCPU: providers.map((x) => x.pendingCPU).reduce((a, b) => a + b, 0),
    pendingMemory: providers.map((x) => x.pendingMemory).reduce((a, b) => a + b, 0),
    pendingStorage: providers.map((x) => x.pendingStorage).reduce((a, b) => a + b, 0),
    availableCPU: providers.map((x) => x.availableCPU).reduce((a, b) => a + b, 0),
    availableMemory: providers.map((x) => x.availableMemory).reduce((a, b) => a + b, 0),
    availableStorage: providers.map((x) => x.availableStorage).reduce((a, b) => a + b, 0)
  };

  return {
    ...stats,
    totalCPU: stats.activeCPU + stats.pendingCPU + stats.availableCPU,
    totalMemory: stats.activeMemory + stats.pendingMemory + stats.availableMemory,
    totalStorage: stats.activeStorage + stats.pendingStorage + stats.availableStorage
  };
}

export async function getProviders() {
  const providers = await Provider.findAll({
    where: {
      isOnline: true,
      deletedHeight: null
    },
    include: [
      {
        model: ProviderAttribute
      },
      {
        model: ProviderAttributeSignature
      }
    ]
  });

  return providers.map((x) => ({
    owner: x.owner,
    hostUri: x.hostUri,
    createdHeight: x.createdHeight,
    email: x.email,
    website: x.website,
    lastCheckDate: x.lastCheckDate,
    deploymentCount: x.deploymentCount,
    leaseCount: x.leaseCount,
    attributes: x.providerAttributes.map((attr) => ({
      key: attr.key,
      value: attr.value,
      auditedBy: x.providerAttributeSignatures.filter((pas) => pas.key === attr.key && pas.value === attr.value).map((pas) => pas.auditor)
    })),
    activeStats: {
      cpu: x.activeCPU,
      memory: x.activeMemory,
      storage: x.activeStorage
    },
    pendingStats: {
      cpu: x.pendingCPU,
      memory: x.pendingMemory,
      storage: x.pendingStorage
    },
    availableStats: {
      cpu: x.availableCPU,
      memory: x.availableMemory,
      storage: x.availableStorage
    }
  }));
}
