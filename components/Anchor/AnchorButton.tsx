import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, SimpleGrid, Stack } from '@chakra-ui/react'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@app/components/common/Button'
import { useApprovals } from '@app/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { useEscrow } from '@app/hooks/useEscrow'
import { Market, AnchorOperations } from '@app/types'
import { getAnchorContract, getCEtherContract, getERC20Contract, getEscrowContract, getEthRepayAllContract } from '@app/util/contracts'
import { timeUntil } from '@app/util/time'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants } from 'ethers'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import moment from 'moment'
import { getNetworkConfigConstants } from '@app/util/networks';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { handleTx } from '@app/util/transactions';
import { hasAllowance } from '@app/util/web3';
import { getMonthlyRate, getParsedBalance } from '@app/util/markets';
import { removeScientificFormat, roundFloorString } from '@app/util/misc';

type AnchorButtonProps = {
  operation: AnchorOperations
  asset: Market
  amount: BigNumber
  isDisabled: boolean
  needWithdrawWarning?: boolean
}

const XINVEscrowAlert = ({ showDescription, duration }: any) => (
  <Alert borderRadius={8} flexDirection="column" color="purple.600" bgColor="purple.200" p={3}>
    <Flex w="full" align="center">
      <AlertIcon color="purple.600" />
      <AlertTitle ml={-1} fontSize="sm">
        x{process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} withdrawals are subject to a {duration}-day escrow
      </AlertTitle>
    </Flex>
    {showDescription && (
      <AlertDescription fontWeight="medium" fontSize="sm">
        During this duration, the withdrawn amount will not earn {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards and cannot be used as collateral. New
        withdrawals will reset the current escrow period.
      </AlertDescription>
    )}
  </Alert>
)

const ClaimFromEscrowBtn = ({
  escrowAddress,
  withdrawalTime,
  withdrawalAmount,
  signer,
}:
  {
    escrowAddress: string,
    withdrawalTime: Date | undefined,
    withdrawalAmount: BigNumber,
    signer: JsonRpcSigner,
  }) => {
  return <SubmitButton
    onClick={() => getEscrowContract(escrowAddress, signer).withdraw()}
    isDisabled={moment(withdrawalTime).isAfter(moment())}
  >
    {moment(withdrawalTime).isAfter(moment())
      ? `${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} unlocks ${timeUntil(withdrawalTime)}`
      : `Claim ${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}`}
  </SubmitButton>
}

const ApproveButton = ({
  asset,
  signer,
  isDisabled,
  onSuccess = () => { },
}: {
  asset: Market,
  signer?: JsonRpcSigner,
  isDisabled: boolean,
  onSuccess?: () => void,
}) => {
  return (
    <SubmitButton
      onClick={async () =>
        handleTx(
          await getERC20Contract(asset.underlying.address, signer).approve(asset.token, constants.MaxUint256),
          { onSuccess },
        )
      }
      isDisabled={isDisabled}
      rightIcon={<AnimatedInfoTooltip ml="1" message='Approving is the first step, it will allow us to use your tokens for the next final step. You only need to do the approve step once per token type and contract' />}
    >
      Approve
    </SubmitButton>
  )
}

export const AnchorButton = ({ operation, asset, amount, isDisabled, needWithdrawWarning }: AnchorButtonProps) => {
  const { library, chainId, account } = useWeb3React<Web3Provider>()
  const { ANCHOR_CHAIN_COIN, XINV, XINV_V1, ESCROW, ESCROW_OLD, AN_CHAIN_COIN_REPAY_ALL } = getNetworkConfigConstants(chainId);
  const isEthMarket = asset.token === ANCHOR_CHAIN_COIN;
  const { approvals } = useApprovals()
  const [isApproved, setIsApproved] = useState(isEthMarket || hasAllowance(approvals, asset?.token));
  const [freshApprovals, setFreshApprovals] = useState<{ [key: string]: boolean }>({})
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()

  useEffect(() => {
    setIsApproved(isEthMarket || freshApprovals[asset?.token] || hasAllowance(approvals, asset?.token))
  }, [approvals, asset, freshApprovals])

  const handleApproveSuccess = () => {
    setFreshApprovals({ ...freshApprovals, [asset?.token]: true });
  }

  const handleRepayAll = () => {
    return isEthMarket ? handleEthRepayAll() : handleStandardRepayAll()
  }

  const handleEthRepayAll = () => {
    const repayAllContract = getEthRepayAllContract(AN_CHAIN_COIN_REPAY_ALL, library?.getSigner())

    const parsedBal = getParsedBalance(borrowBalances, asset.token, asset.underlying.decimals)
    const dailyInterests = removeScientificFormat(getMonthlyRate(parsedBal, asset.borrowApy) / 30);

    const marginForOneDayInterests = roundFloorString(dailyInterests, 18)

    const value = borrowBalances[asset.token].add(parseEther(marginForOneDayInterests))

    return repayAllContract.repayAll({ value })
  }

  const handleStandardRepayAll = () => {
    const repayAllContract = getAnchorContract(asset.token, library?.getSigner())
    return repayAllContract.repayBorrow(constants.MaxUint256)
  }

  const { withdrawalTime: withdrawalTime_v1, withdrawalAmount: withdrawalAmount_v1 } = useEscrow(ESCROW_OLD)
  const { withdrawalTime, withdrawalAmount } = useEscrow(ESCROW)

  const contract =
    isEthMarket
      ? getCEtherContract(asset.token, library?.getSigner())
      : getAnchorContract(asset.token, library?.getSigner())

  switch (operation) {
    case AnchorOperations.supply:
      return (
        <Stack w="full" spacing={4}>
          {asset.token === XINV && asset.escrowDuration && asset.escrowDuration > 0 && <XINVEscrowAlert duration={asset.escrowDuration} />}
          {!isApproved ? (
            <ApproveButton asset={asset} signer={library?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
          ) : (
            <SubmitButton
              onClick={() => contract.mint(isEthMarket ? { value: amount } : amount)}
              refreshOnSuccess={true}
              isDisabled={isDisabled}
            >
              Supply
            </SubmitButton>
          )}
        </Stack>
      )

    case AnchorOperations.withdraw:
      return (
        <Stack w="full" spacing={4}>
          {asset.escrowDuration && asset.escrowDuration > 0 && <XINVEscrowAlert showDescription duration={asset.escrowDuration} />}
          {asset.token === XINV && withdrawalAmount?.gt(0) && library?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW}
              withdrawalTime={withdrawalTime}
              withdrawalAmount={withdrawalAmount}
              signer={library?.getSigner()}
            />
          )}
          {asset.token === XINV_V1 && withdrawalAmount_v1?.gt(0) && library?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW_OLD}
              withdrawalTime={withdrawalTime_v1}
              withdrawalAmount={withdrawalAmount_v1}
              signer={library?.getSigner()}
            />
          )}
          <SimpleGrid columns={2} spacingX="3" spacingY="1">
            <SubmitButton
              onClick={() => contract.redeemUnderlying(amount)}
              refreshOnSuccess={true}
              isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
            >
              Withdraw
            </SubmitButton>
            <SubmitButton
              onClick={async () => {
                const bn = await contract.balanceOf(account);
                return contract.redeem(bn);
              }}
              refreshOnSuccess={true}
              isDisabled={!supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
              rightIcon={<AnimatedInfoTooltip ml="1" message='Withdraw all and avoid "dust" being left behind. May fail if you have the asset enabled as collateral and have outstanding debt.' />}
            >
              Withdraw ALL
            </SubmitButton>
          </SimpleGrid>
        </Stack>
      )

    case AnchorOperations.borrow:
      return (
        <SubmitButton onClick={() => contract.borrow(amount)} refreshOnSuccess={true} isDisabled={isDisabled}>
          Borrow
        </SubmitButton>
      )

    case AnchorOperations.repay:
      return !isApproved ? (
        <ApproveButton asset={asset} signer={library?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
      ) : (
        <SimpleGrid columns={2} spacingX="3" spacingY="1">
          <SubmitButton
            isDisabled={isDisabled || !borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={() => contract.repayBorrow(isEthMarket ? { value: amount } : amount)}
            refreshOnSuccess={true}
          >
            Repay
          </SubmitButton>

          <SubmitButton
            isDisabled={!borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={handleRepayAll}
            refreshOnSuccess={true}
            rightIcon={<AnimatedInfoTooltip ml="1" message='Repay all the debt for this market and avoid "debt dust" being left behind.' />}
          >
            Repay ALL
          </SubmitButton>
        </SimpleGrid>
      )
  }

  return <></>
}
