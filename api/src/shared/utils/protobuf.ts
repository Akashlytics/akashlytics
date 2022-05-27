import { Registry } from "@cosmjs/proto-signing";
import { defaultRegistryTypes } from "@cosmjs/stargate";

import { akashTypes } from "../../proto";

export function msgToJSON(type: string, msg) {
  const myRegistry = new Registry([...defaultRegistryTypes, ...akashTypes]);

  if (!myRegistry.lookupType(type)) {
    throw new Error("Type not found: " + type);
  }

  return myRegistry.decode({ typeUrl: type, value: msg });
}
