import {SubstrateEvent} from "@subql/types";
import { Option, Struct } from '@polkadot/types-codec';
import { Balance } from '@polkadot/types/interfaces';
import { u32 } from '@polkadot/types';
import BN from 'bn.js';
import { Tvl } from "../types";

export async function handleNewStakingEraEvent(event: SubstrateEvent): Promise<void> {
    // const [era, isIndividualClaim] = await Promise.all([
    //     api.query.dappsStaking.currentEra(),
    //     checkIsEnableIndividualClaim()
    // ]);
    // // const result = isEnableIndividualClaim
    // //     ? await api.query.dappsStaking.generalEraInfo(era)
    // //     : await api.query.dappsStaking.eraRewardsAndStakes(era);
    
    // let tvl: Balance;
    // if (isIndividualClaim) {

    // } else {
    //     const result = await api.query.dappsStaking.eraRewardsAndStakes<Option<EraRewardAndStake>>(era)
    //     tvl = result.unwrap().staked;
    // }
    // const tvlDefaultUnit = Number(ethers.utils.formatUnits(tvl.toString(), 18));
    // const tvl = isEnableIndividualClaim
    //     ? result.unwrap().locked
    //     : result.unwrap().staked.valueOf();

    const decimals = api.registry.chainDecimals[0];
    const era = await api.query.dappsStaking.currentEra<u32>();
    const [tvl, priceUsd] = await Promise.all([
        getTvl(era),
        getUsdPrice('astar')
    ])

    const record = new Tvl(era.toString());
    record.timestamp = BigInt(event.block.timestamp.getTime());
    record.tvl =  reduceBalanceToDenom(tvl, decimals);
    record.tvlUsd = record.tvl * BigInt(priceUsd);
    await record.save(); 

    //logger.info(`timestamp ${event.block.timestamp.getTime()}, era ${era.toHuman()}, result ${tvl}`)
}

async function checkIsEnableIndividualClaim(): Promise<boolean> {
    try {
      const version = await api.query.dappsStaking.storageVersion();
      if (!version) {
        throw Error('invalid version');
      }
      const isEnableIndividualClaim = version.toHuman() !== 'V2_0_0';
      return isEnableIndividualClaim;
    } catch (error) {
      // Memo: there is no `storageVersion` query in Astar network
      return false;
    }
};

async function getTvl(era: u32): Promise<Balance> {
    const isIndividualClaim = await checkIsEnableIndividualClaim();
    
    let tvl: Balance;
    if (isIndividualClaim) {
        const result = await api.query.dappsStaking.generalEraInfo<Option<StakingEraInfo>>(era);
        tvl = result.unwrap().locked;
    } else {
        const result = await api.query.dappsStaking.eraRewardsAndStakes<Option<EraRewardAndStake>>(era)
        tvl = result.unwrap().staked;
    }

    return tvl;
}

function reduceBalanceToDenom(balance: Balance, decimal: number): bigint {
    const decPoint = new BN(10).pow(new BN(decimal));
    const reduced = balance.div(decPoint);
    return BigInt(reduced.toString());
};

async function getUsdPrice(currency: string): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`;
    // Memo. Using superagent library since axios is giving me the error 'TypeError: adapter is not a function' 
    //const result = await (await fetch(url)).json() //await axios.get(url);
    const result = await superagent.get(url);
    const price = result[currency].usd;
  
    return Number(price);
};

interface EraRewardAndStake extends Struct {
    rewards: Balance,
    staked: Balance,
}

interface StakingEraInfo extends Struct {
    rewards: {
        stakers: Balance;
        dapps: Balance;
    }
    staked: Balance;
    locked: Balance;
}


