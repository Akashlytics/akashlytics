import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { getAkashTypeRegistry } from "@akashnetwork/akashjs/build/src/stargate/index";
//import { MsgSend } from "cosmjs-types/cosmos/tx";
import { Registry, decodeTxRaw, GeneratedType } from "@cosmjs/proto-signing";
import { defaultRegistryTypes } from "@cosmjs/stargate";
import { blocksDb, txsDb } from "../../akash/dataStore";
//import { decodeTxRaw, fromBase64 } from "./types";

import { akashTypes } from "../../proto";

export function msgToJSON(type: string, msg) {
  //console.log(akashRegistry.length);
  console.log(type);
  const myRegistry = new Registry([...defaultRegistryTypes, ...akashTypes]);

  return myRegistry.decode({ typeUrl: type, value: msg });
  // return myRegistry.decodeTxBody(msg);
  // switch (type) {
  //   default:
  //     //const block = JSON.parse(await blocksDb.get("139184"));
  //     //const tx = block.block.data.txs[0];
  //     //const decodedTx = decodeTxRaw(fromBase64(tx));
  //     //const msgs = decodedTx.body.messages;
  //     //const msgFromBlock = msgs[0].value;
  //     //const result1 = MsgSend.decode(msgFromBlock);
  //     //const intarr = bufferToUint8Array(msg);
  //     //console.log(msgFromBlock, result1, msg);
  //     const result = MsgSend.decode(msg);
  //     //console.log(result);
  //     return result;
  // }
  return null;
}
