import { Block, Transaction, Message, Op, Deployment, Lease, Provider, ProviderAttribute } from "./schema";
import { msgToJSON } from "@src/shared/utils/protobuf";
import { getAktMarketData } from "@src/providers/marketDataProvider";
import { averageBlockCountInAMonth } from "@src/shared/constants";
import { round } from "@src/shared/utils/math";

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
    type: msg.type,
    data: msgToJSON(msg.type, msg.data)
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
  };
}

export async function getDeployment(owner: string, dseq: string) {
  const deployment = await Deployment.findOne({
    where: {
      owner: owner,
      dseq: dseq
    },
    include: [
      {
        model: Lease,
        include: [
          {
            model: Provider,
            include: [{ model: ProviderAttribute }]
          }
        ]
      }
    ]
  });

  const relatedMessages = await Message.findAll({
    where: {
      relatedDeploymentId: deployment.id
    },
    include: [
      {
        model: Transaction,
        required: true
      },
      {
        model: Block,
        required: true
      }
    ],
    order: [
      ["height", "DESC"],
      ["indexInBlock", "DESC"]
    ]
  });

  const aktPrice = getAktMarketData()?.price;
  const latestBlockHeight = (await Block.max("height")) as number;

  const leases = deployment.leases.map((lease) => {
    const monthlyUAKT = Math.round(lease.price * averageBlockCountInAMonth);
    const spentUAKT = ((lease.closedHeight || latestBlockHeight) - lease.createdHeight) * lease.price;

    return {
      oseq: lease.oseq,
      gseq: lease.gseq,
      provider: {
        address: lease.provider.owner,
        isDeleted: !!lease.provider.deletedHeight,
        attributes: lease.provider.providerAttributes.map((attr) => ({
          key: attr.key,
          value: attr.value
        }))
      },
      status: lease.closedHeight ? "closed" : "active",
      costAKT: round(monthlyUAKT / 1_000_000, 2),
      costUSD: aktPrice ? round((monthlyUAKT / 1_000_000) * aktPrice, 2) : null,
      spentAKT: round(spentUAKT / 1_000_000, 2),
      spentUSD: aktPrice ? round((spentUAKT / 1_000_000) * aktPrice, 2) : null,
      cpuUnits: lease.cpuUnits,
      memoryQuantity: lease.memoryQuantity,
      storageQuantity: lease.storageQuantity
    };
  });

  return {
    owner: deployment.owner,
    dseq: deployment.dseq,
    totalCostAKT: leases.map((x) => x.costAKT).reduce((a, b) => a + b, 0),
    totalCostUSD: leases.map((x) => x.costUSD).reduce((a, b) => a + b, 0),
    leases: leases,
    events: relatedMessages.map((msg) => ({
      txHash: msg.transaction.hash,
      date: msg.block.datetime,
      type: msg.type
    }))
  };
}
