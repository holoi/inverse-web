import { Flex, Stack, Text } from '@chakra-ui/react'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { useExchangeRates } from '@app/hooks/useExchangeRates'
import { useAnchorPrices } from '@app/hooks/usePrices'
import { Market, AnchorOperations, BigNumberList } from '@app/types'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { getBnToNumber, getBorrowInfosAfterSupplyChange, getBorrowLimitLabel, shortenNumber } from '@app/util/markets';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { commify } from '@ethersproject/units';
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import { usePrices } from '@app/hooks/usePrices';

type Stat = {
  label: string
  value: React.ReactNode
  color?: string
  tooltipMsg?: string
}

type StatBlockProps = {
  label: string
  stats: Stat[]
}

type AnchorStatBlockProps = {
  asset: Market
  amount?: number
  isCollateralModal?: boolean
}

type AnchorStatsProps = {
  asset: Market
  amount: string
  operation: AnchorOperations
  isCollateralModal?: boolean
}

const StatBlock = ({ label, stats }: StatBlockProps) => (
  <Stack w="full" pt={2} spacing={1}>
    <Text fontSize="xs" fontWeight="semibold" color="purple.300" textTransform="uppercase">
      {label}
    </Text>
    {stats.map(({ label, value, color, tooltipMsg }) => (
      <Flex key={label} justify="space-between" fontSize="sm" fontWeight="medium" pl={2}>
        <Text color={color}>
          {label}
          {tooltipMsg && <AnimatedInfoTooltip iconProps={{ ml: '2', fontSize: '12px' }} message={tooltipMsg} />}
        </Text>
        <Text color={color} textAlign="end">{value}</Text>
      </Flex>
    ))}
  </Stack>
)

const getCollateralFactor = (market: Market): Stat => {
  return {
    label: 'Collateral Factor',
    value: `${market.collateralFactor * 100}%`,
    tooltipMsg: "Defines the max worth in USD you can borrow against your supplied collateral USD worth, if this max amount is reached then liquidation can be triggered. The Max Borrowable Limit Amount in USD = Collateral Factor X Collateral Worth in USD, this fluctuates with the assets prices."
  }
}

const getBorrowLimitUsed = (perc: number, before: string, after: string): Stat => {
  return {
    label: 'Borrow Limit Used',
    value: `${before}% -> ${after}%`,
    color: (perc > 75 ? 'red.500' : perc <= 75 && perc > 50 ? 'orange.500' : 'white'),
    tooltipMsg: "Reminder: if the Borrow Limit % reaches 100% you may get liquidated or won't receive the loan to avoid liquidation"
  }
}

const SupplyDetails = ({ asset }: AnchorStatBlockProps) => {
  const { balances: supplyBalances } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()

  const supplyBalance =
    supplyBalances && exchangeRates
      ? parseFloat(formatUnits(supplyBalances[asset.token], asset.underlying.decimals)) *
      parseFloat(formatUnits(exchangeRates[asset.token]))
      : 0

  return (
    <StatBlock
      label="Supply Stats"
      stats={[
        {
          label: 'Supply APY',
          value: `${asset.supplyApy.toFixed(2)}%`,
        },
        {
          label: 'Supply Balance',
          value: `${shortenNumber(Math.floor(supplyBalance * 1e8) / 1e8)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const WithdrawDetails = ({ asset }: AnchorStatBlockProps) => {
  return (
    <StatBlock
      label="Withdrawal Stats"
      stats={[
        {
          label: 'Available Liquidity',
          value: `${shortenNumber(asset.liquidity, 2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const formatUsdTotal = (value: number, prices: BigNumberList, asset: Market) => {
  return prices && value
    ? `${shortenNumber(
      (
        value *
        parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
      ), 2, true
    )}`
    : '-'
}

const MarketDetails = ({ asset, isCollateralModal }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()
  const { prices: cgPrices } = usePrices()
  const totalBorrowsUsd = formatUsdTotal(asset.totalBorrows, prices, asset);
  const totalReservesUsd = formatUsdTotal(asset.totalReserves, prices, asset);
  const totalSuppliedUsd = formatUsdTotal(asset.supplied, prices, asset);
  const reserveFactor = asset.reserveFactor ? `${asset.reserveFactor * 100}%` : '-'

  const oraclePrice = asset.oraclePrice;
  const cgPrice = cgPrices && cgPrices[asset.underlying.coingeckoId] ? cgPrices[asset.underlying.coingeckoId]?.usd : null;
  const rtokenPrice = cgPrices ? cgPrices[RTOKEN_CG_ID]?.usd||0 : 0;
  
  const stats = [
    {
      label: `Price (Oracle): ${oraclePrice === null ? '-' : shortenNumber(oraclePrice, 2, true, true)}`,
      value: `Price (Coingecko): ${cgPrice === null ? '-' : shortenNumber(cgPrice, 2, true, true)}`,
      tooltipMsg: <>
      The price used in smart contracts is the <b>Oracle price</b>, it means that the borrowing limits and liquidations are calculated with this price.
      <Text mt="2">The Oracle price can be different than the live coingecko price as it's not updated that frequently, oracle update takes time to kick in when price goes up to prevent manipulation.</Text>
      </>,
    },
    getCollateralFactor(asset),
  ];

  if (!isCollateralModal) {
    Array.prototype.push.apply(stats, [
      {
        label: 'Reserve Factor',
        value: reserveFactor,
      },
      {
        label: 'Total Supplied',
        value: totalSuppliedUsd,
      },
      {
        label: 'Total Borrows',
        value: totalBorrowsUsd,
      },
      {
        label: 'Total Reserves',
        value: totalReservesUsd,
      },
      {
        label: `${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} Monthly Rewards`,
        value: asset.rewardsPerMonth > 0 ?
          `${commify(Math.round(asset.rewardsPerMonth * 100) / 100)} (${shortenNumber(asset.rewardsPerMonth * rtokenPrice, 2, true)})`
          : 0,
      },
    ]);
  }

  return (
    <StatBlock
      label="Market Stats"
      stats={stats}
    />
  )
}

const BorrowDetails = ({ asset }: AnchorStatBlockProps) => {
  const { balances: borrowBalances } = useBorrowBalances()

  const borrowBalance =
    borrowBalances && borrowBalances[asset.token]
      ? parseFloat(formatUnits(borrowBalances[asset.token], asset.underlying.decimals))
      : 0

  return (
    <StatBlock
      label="Borrow Stats"
      stats={[
        {
          label: 'Borrow APR',
          value: `${asset.borrowApy.toFixed(2)}%`,
        },
        {
          label: 'Borrow Balance',
          value: `${borrowBalance.toFixed(2)} ${asset.underlying.symbol}`,
        },
        {
          label: 'Available Liquidity',
          value: `${shortenNumber(asset.liquidity, 2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const BorrowLimit = ({ asset, amount }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()

  const { borrowable, newBorrowable, newBorrowLimitLabel, newPerc } = getBorrowInfosAfterSupplyChange({ market: asset, prices, usdBorrow, usdBorrowable, amount })

  const before = (borrowable !== 0 ? (usdBorrow / borrowable) * 100 : 0).toFixed(2)

  const stats = [
    getCollateralFactor(asset),
    {
      label: 'Borrow Limit',
      value: `${shortenNumber(borrowable, 2, true)} -> ${shortenNumber(newBorrowable, 2, true)}`,
    },
    getBorrowLimitUsed(newPerc, before, newBorrowLimitLabel),
  ]

  if (newPerc > 75) {
    stats.push({ label: 'Reminder:', value: 'Risk of liquidation if Borrow Limit reaches 100%', color: 'red.500' })
  }

  return (
    <StatBlock
      label="Borrow Limit Stats"
      stats={stats}
    />
  )
}

const BorrowLimitRemaining = ({ asset, amount }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()

  const { usdBorrow, usdBorrowable } = useAccountLiquidity()
  const change =
    prices && amount
      ? amount * parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
      : 0
  const borrow = usdBorrow
  const newBorrow = borrow - (change > 0 ? change : 0)
  const borrowable = usdBorrow + usdBorrowable
  const newBorrowable = borrowable + (change < 0 ? change : 0)

  const newBorrowLimit = (newBorrowable !== 0
    ? (newBorrow / newBorrowable) * 100
    : 0
  )
  const newBorrowLimitLabel = getBorrowLimitLabel(newBorrowLimit, (amount || 0) > 0)
  const cleanPerc = Number(newBorrowLimitLabel.replace(/'+'/, ''))
  const before = (borrowable !== 0 ? (borrow / borrowable) * 100 : 0).toFixed(2)

  const stats = [
    getCollateralFactor(asset),
    {
      label: 'Borrow Limit Remaining',
      value: `${shortenNumber(usdBorrowable, 2, true)} -> ${shortenNumber(usdBorrowable + change, 2, true)}`,
    },
    getBorrowLimitUsed(cleanPerc, before, newBorrowLimitLabel),
  ]

  if (cleanPerc > 75) {
    stats.push({ label: 'Reminder:', value: 'Risk of liquidation if Borrow Limit reaches 100%', color: 'red.500' })
  }

  return (
    <StatBlock
      label="Borrow Limit Stats"
      stats={stats}
    />
  )
}

export const AnchorStats = ({ operation, asset, amount, isCollateralModal = false }: AnchorStatsProps) => {
  const parsedAmount = amount && !isNaN(amount as any) ? parseFloat(amount) : 0
  switch (operation) {
    case AnchorOperations.supply:
      return (
        <>
          <SupplyDetails asset={asset} isCollateralModal={isCollateralModal} />
          <BorrowLimit asset={asset} amount={parsedAmount} isCollateralModal={isCollateralModal} />
          <MarketDetails asset={asset} isCollateralModal={isCollateralModal} />
        </>
      )
    case AnchorOperations.withdraw:
      return (
        <>
          {asset.underlying.symbol !== 'INV' && !isCollateralModal && <WithdrawDetails asset={asset} />}
          <SupplyDetails asset={asset} isCollateralModal={isCollateralModal} />
          <BorrowLimit asset={asset} amount={-1 * parsedAmount} isCollateralModal={isCollateralModal} />
          <MarketDetails asset={asset} isCollateralModal={isCollateralModal} />
        </>
      )
    case AnchorOperations.borrow:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={-1 * parsedAmount} />
        </>
      )
    case AnchorOperations.repay:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={parsedAmount} />
        </>
      )
  }

  return <></>
}
