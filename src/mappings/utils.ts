import { SubstrateBlock } from '@subql/types';
import { Balance } from '@polkadot/types/interfaces';
import BN from 'bn.js';

export function reduceBalanceToDenom(balance: Balance, decimal: number): bigint {
  const decPoint = new BN(10).pow(new BN(decimal));
  const reduced = balance.div(decPoint);
  return BigInt(reduced.toString());
};

export function getBlockTimestampInUnix(block: SubstrateBlock): bigint {
  return BigInt(block.timestamp.getTime());
}
