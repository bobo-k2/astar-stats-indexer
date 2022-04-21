import {SubstrateBlock} from "@subql/types";
import { TransactionsPerBlock } from "../types";
import { getBlockTimestampInUnix, getUsdPrice } from "./utils";

const extrinsicsToCount = ['ethCall.call', 'evm.call', 'ehtereum.transact'];

export async function handleBlock(block: SubstrateBlock): Promise<void> {
    const transactions = await handleDayStartEnd(block);
    let transactionsInBlock = 0;

    block.block.extrinsics.forEach((ex, index) => {
      const { isSigned, method: { method, section } } = ex;
      const extrinsic = `${section}.${method}`;

      // Filter extrinsics that we are going to count as transaction.
      // Our transactions count will be different than Subscan transfer count since Subscan counts only extrinsics that contains Balances.Transfer event.
      if (extrinsicsToCount.includes(extrinsic) || extrinsic.startsWith('dappsStaking.') || extrinsic.startsWith('balances.')) {
        transactionsInBlock ++;
      }
    });

    transactions.numberOfTransactions += transactionsInBlock;
    await transactions.save();
}

async function handleDayStartEnd(block: SubstrateBlock): Promise<TransactionsPerBlock> {
  const date = formatDate(block.timestamp);

  let transactions = await TransactionsPerBlock.get(date);
  if (!transactions) {
    transactions = new TransactionsPerBlock(date);
    transactions.firstBlock = block.block.header.number.toNumber();
    transactions.numberOfTransactions = 0;
    transactions.timestamp = BigInt(0);
    await transactions.save();

    const prevDate = new Date(block.timestamp);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevTransactions = await TransactionsPerBlock.get(formatDate(prevDate));
    if (prevTransactions) {
      prevTransactions.lastBlock = transactions.firstBlock - 1;
      const blocksCount = prevTransactions.lastBlock.valueOf() - prevTransactions.firstBlock;
      const avgNumberOfTransactions = prevTransactions.numberOfTransactions / blocksCount;
      prevTransactions.avgNumberOfTransactions = avgNumberOfTransactions;
      prevTransactions.timestamp = getBlockTimestampInUnix(block);
      await prevTransactions.save();
    }
  }

  return transactions;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0,10).replace(/-/g, '');
}