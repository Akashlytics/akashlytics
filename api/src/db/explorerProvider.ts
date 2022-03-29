import { Block, Transaction, Message, Op } from "./schema";
import { decodeTxRaw, fromBase64 } from "@src/shared/utils/types";

import { sha256 } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";

export async function getBlock(height: number) {
  const block = await Block.findOne({
    where: {
      height: height
    },
    include: [
      {
        model: Transaction
      }
    ]
  });

  if (!block) return null;

  return {
    height: block.height,
    datetime: block.datetime,
    hash: block.hash,
    gasUsed: block.transactions.map((tx) => tx.gasUsed).reduce((a, b) => a + b, 0),
    gasWanted: block.transactions.map((tx) => tx.gasWanted).reduce((a, b) => a + b, 0),
    transactions: block.transactions.map((tx) => ({
      hash: tx.hash,
      isSuccess: !tx.hasProcessingError,
      error: tx.hasProcessingError ? tx.log : null,
      fee: tx.fee
    }))
  };
}

export async function getTransaction(hash) {
  const tx = await Transaction.findOne({
    where: {
      hash: hash
    },
    include: [
      {
        model: Block,
        required: true
      },
      {
        model: Message
      }
    ]
  });

  if (!tx) return null;

  const messages = tx.messages.map((msg) => ({
    type: msg.type
  }));

  return {
    height: tx.block.height,
    datetime: tx.block.datetime,
    hash: tx.hash,
    isSuccess: !tx.hasProcessingError,
    error: tx.hasProcessingError ? tx.log : null,
    gasUsed: tx.gasUsed,
    gasWanted: tx.gasWanted,
    fee: tx.fee,
    memo: tx.memo,
    messages: messages
    //data: decodedTx
  };
}
