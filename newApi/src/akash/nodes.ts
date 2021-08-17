import { mainNet } from "@src/shared/constants";

const currentNet = mainNet;

export async function loadNodeList() {
  const nodeListUrl = currentNet + "/api-nodes.txt";
  console.log("Loading node list from: " + nodeListUrl);

  const response = await fetch(nodeListUrl);

  if (response.status !== 200) {
    console.error(response);
    throw "Could not load node list";
  }

  const content = await response.text();

  const nodeList = content.trim().split("\n");

  if (nodeList.length === 0) {
    throw "Found no node in the list";
  }

  console.log(`Found ${nodeList.length} nodes`);

  return ["http://public-rpc2.akash.vitwit.com:1317"];
  // return nodeList;
}