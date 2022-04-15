import { SubstrateBlock } from '@subql/types';
import { Balance } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import https from 'https';

export function reduceBalanceToDenom(balance: Balance, decimal: number): bigint {
  if (balance.eq(new BN('0')))
  {
    return BigInt(0);
  }

  const decPoint = new BN(10).pow(new BN(decimal));
  const reduced = new BN(balance.toString()).div(decPoint);
  return BigInt(reduced.toString());
};

export function getBlockTimestampInUnix(block: SubstrateBlock): bigint {
  return BigInt(block.timestamp.getTime());
}

/**
 * Uses coin gecko API to a token price in USD
 * @param token Token name
 * @param date Price date
 * @returns Token price
 */
export async function getUsdPrice(token: string, date: Date): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/coins/${token}/history?date=${formatDate(date)}`;
    logger.info(url);
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        res.setEncoding('utf8');
        let body = '';
        
        res.on('data', data=> {
            body += data;
        });
    
        res.on('end', ()=> {
            const json = JSON.parse(body);
            return resolve(Number(json.market_data.current_price.usd));
        });

        res.on('error', error => {
          return reject(error);
        });
      });
    });
};

function formatDate(date: Date) {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}
