import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { getAkashTypeRegistry } from "@akashnetwork/akashjs/build/src/stargate/index";
//import { MsgSend } from "cosmjs-types/cosmos/tx";
import { Registry, decodeTxRaw, GeneratedType } from "@cosmjs/proto-signing";
import { defaultRegistryTypes } from "@cosmjs/stargate";
import { blocksDb, txsDb } from "../../akash/dataStore";
//import { decodeTxRaw, fromBase64 } from "./types";

import { akashTypes } from "../../proto";

export function msgToJSON(type: string, msg) {
  const myRegistry = new Registry([...defaultRegistryTypes, ...akashTypes]);

  if (!myRegistry.lookupType(type)) {
    throw new Error("Type not found: " + type);
  }

  return myRegistry.decode({ typeUrl: type, value: msg });
}
