import { BigNumber, Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { CTOKEN_ABI, ERC20_ABI, FED_ABI, MULTISIG_ABI, XCHAIN_FED_ABI } from '@inverse/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis'
import { NetworkIds, xChainFed } from '@inverse/types';
import { namedAddress } from '@inverse/util'
import { getBnToNumber } from '@inverse/util/markets'

export default async function handler(req, res) {

  const { DOLA, INV, DAI, INVDOLASLP, ANCHOR_TOKENS, UNDERLYING, USDC, WETH, FEDS, XCHAIN_FEDS, TREASURY, MULTISIGS, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
  const cacheKey = `dao-cache-v1.1.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 300);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, ERC20_ABI, provider);
    const invContract = new Contract(INV, ERC20_ABI, provider);

    let invFtmTotalSupply = BigNumber.from('0');
    let dolaFtmTotalSupply = BigNumber.from('0');

    // public rpc for fantom, less reliable
    try {
      const ftmProvider = getProvider(NetworkIds.ftm);
      const dolaFtmContract = new Contract(ftmConfig?.DOLA, ERC20_ABI, ftmProvider);
      const invFtmContract = new Contract(ftmConfig?.INV, ERC20_ABI, ftmProvider);
      dolaFtmTotalSupply = await dolaFtmContract.totalSupply();
      invFtmTotalSupply = await invFtmContract.totalSupply();
    } catch (e) {

    }

    const [
      dolaTotalSupply,
      invTotalSupply,
      ...fedSupplies
    ] = await Promise.all([
      dolaContract.totalSupply(),
      invContract.totalSupply(),
      ...FEDS.map((fedAddress: string) => {
        const fedContract = new Contract(fedAddress, FED_ABI, provider);
        return fedContract.supply();
      }),
    ])

    const treasuryFundsToCheck = [DOLA, INV, DAI, USDC, INVDOLASLP];
    const treasuryBalances = await Promise.all([
      ...treasuryFundsToCheck.map((ad: string) => {
        const contract = new Contract(ad, ERC20_ABI, provider);
        return contract.balanceOf(TREASURY);
      }),
    ])

    const anchorReserves = await Promise.all([
      ...ANCHOR_TOKENS.map((ad: string) => {
        const contract = new Contract(ad, CTOKEN_ABI, provider);
        return contract.totalReserves();
      }),
    ]);

    const xChainFedsResults = await Promise.allSettled([
      ...XCHAIN_FEDS.map((xChainFed: xChainFed) => {
        const xChainProvider = getProvider(xChainFed.chainId);
        const xChainFedContract = new Contract(xChainFed.address, XCHAIN_FED_ABI, xChainProvider);
        return xChainFedContract.dstSupply();
      })
    ]);

    const xChainFedsSupplies = xChainFedsResults.map(r => r.status === 'fulfilled' ? r.value : BigNumber.from('0'))

    // Multisigs
    const multisigsOwners = await Promise.all([
      ...Object.entries(MULTISIGS).map(([address, name]) => {
        const contract = new Contract(address, MULTISIG_ABI, provider);
        return contract.getOwners();
      })
    ])

    const multisigsThresholds = await Promise.all([
      ...Object.entries(MULTISIGS).map(([address, name]) => {
        const contract = new Contract(address, MULTISIG_ABI, provider);
        return contract.getThreshold();
      })
    ])

    const fundsToCheck = [INV, DOLA, DAI, WETH];
    const multisigsBalanceValues: BigNumber[][] = await Promise.all([
      ...Object.entries(MULTISIGS).map(([multisigAd, name]) => {
        return Promise.all(
          fundsToCheck.map(tokenAddress => {
            const contract = new Contract(tokenAddress, ERC20_ABI, provider);
            return contract.balanceOf(multisigAd);
          })
            .concat([
              provider.getBalance(multisigAd),
            ])
        )
      })
    ])

    const multisigsAllowanceValues: BigNumber[][] = await Promise.all([
      ...Object.entries(MULTISIGS).map(([multisigAd, name]) => {
        return Promise.all(
          fundsToCheck.map(tokenAddress => {
            const contract = new Contract(tokenAddress, ERC20_ABI, provider);
            return contract.allowance(TREASURY, multisigAd);
          })
        )
      })
    ])

    const multisigsFunds = multisigsBalanceValues.map((bns, i) => {
      return bns.map((bn, j) => {
        const token = TOKENS[fundsToCheck[j]] || TOKENS['ETH'];
        const allowance = multisigsAllowanceValues[i][j]
        return {
          token,
          balance: getBnToNumber(bn, token.decimals),
          allowance: allowance !== undefined ? getBnToNumber(allowance, token.decimals) : null,
        }
      })
    })

    const resultData = {
      dolaTotalSupply: parseFloat(formatEther(dolaTotalSupply)),
      invTotalSupply: parseFloat(formatEther(invTotalSupply)),
      anchorReserves: anchorReserves.map((bn, i) => {
        const token = UNDERLYING[ANCHOR_TOKENS[i]];
        return { token, balance: getBnToNumber(bn, token.decimals) }
      }),
      treasury: treasuryBalances.map((bn, i) => {
        const token = TOKENS[treasuryFundsToCheck[i]];
        return { token, balance: getBnToNumber(bn, token.decimals) }
      }),
      fantom: {
        dolaTotalSupply: parseFloat(formatEther(dolaFtmTotalSupply)),
        invTotalSupply: parseFloat(formatEther(invFtmTotalSupply)),
      },
      multisigs: Object.entries(MULTISIGS).map(([address, name], i) => ({
        address, name, owners: multisigsOwners[i], funds: multisigsFunds[i], threshold: parseInt(multisigsThresholds[i].toString()),
      })),
      fedSupplies: FEDS.map((fedAd, i) => ({
        address: fedAd,
        chainId: NetworkIds.mainnet,
        name: namedAddress(fedAd),
        supply: parseFloat(formatEther(fedSupplies[i])),
      })).concat(
        XCHAIN_FEDS.map((xChainFed, i) => {
          return {
            ...xChainFed,
            supply: parseFloat(formatEther(xChainFedsSupplies[i])),
          }
        })
      )
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error(e);
    }
  }
}