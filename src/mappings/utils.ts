import { SubstrateBlock } from '@subql/types';
import { Balance } from '@polkadot/types/interfaces';
import BN from 'bn.js';
const https = require('https');

export function reduceBalanceToDenom(balance: Balance, decimal: number): bigint {
  const decPoint = new BN(10).pow(new BN(decimal));
  const reduced = balance.div(decPoint);
  return BigInt(reduced.toString());
};

export function getBlockTimestampInUnix(block: SubstrateBlock): bigint {
  return BigInt(block.timestamp.getTime());
}

/**
 * Uses coin gecko API to a token price in USD
 * @param token Token name
 * @returns Token price
 */
export async function getUsdPrice(token: string): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`;
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        res.setEncoding('utf8');
        let body = '';
        
        res.on('data', data=> {
            body += data;
        });
    
        res.on('end', ()=> {
            const json = JSON.parse(body);
            return resolve(Number(json[token].usd));
        });

        res.on('error', error => {
          return reject(error);

        });
      });
    });
};
