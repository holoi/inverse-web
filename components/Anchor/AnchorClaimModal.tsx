import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Checkbox, CheckboxGroup, Stack, Text, Box } from '@chakra-ui/react';
import { SubmitButton } from '@inverse/components/common/Button';
import { useMarkets } from '@inverse/hooks/useMarkets';
import { useSupplyBalances } from '@inverse/hooks/useBalances';
import { getParsedBalance } from '@inverse/util/markets';
import { claimInvRewards } from '@inverse/util/contracts';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@inverse/components/common/Messages';

type Props = {
    rewardAmount: number,
    isOpen: boolean
    onClose: () => void
}

export const AnchorClaimModal = ({
    rewardAmount,
    isOpen,
    onClose,
}: Props) => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { markets, isLoading: marketsLoading } = useMarkets()
    const { balances: supplyBalances, isLoading: balancesLoading } = useSupplyBalances()
    const [checkedMarkets, setCheckedMarkets] = useState<string[]>([]);

    const close = () => {
        onClose()
        setCheckedMarkets([])
    }

    const handleClaim = () => {
        return claimInvRewards(library?.getSigner()!, checkedMarkets, { onSuccess: () => close() })
    }

    const handleCheck = (marketAddresses: string[]) => {
        setCheckedMarkets(marketAddresses)
    }

    const checkboxesWithBalance = markets
        .filter(market => market.rewardApy > 0 && getParsedBalance(supplyBalances, market.token, market.underlying.decimals) > 0)
        .map(market => <Checkbox w='200px' key={market.token} value={market.token}>
            {market.underlying.symbol}
        </Checkbox>)

    const checkboxesWithoutBalance = markets
        .filter(market => market.rewardApy > 0 && getParsedBalance(supplyBalances, market.token, market.underlying.decimals) === 0)
        .map(market => <Checkbox w='200px' key={market.token} value={market.token}>
            {market.underlying.symbol}
        </Checkbox>)

    const isDisabled = !checkedMarkets.length || marketsLoading || balancesLoading || !account;

    return (
        <Modal
            onClose={close}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Claim up to {rewardAmount.toFixed(4)} INV rewards</Text>
                </Stack>
            }
            footer={
                <SubmitButton disabled={isDisabled} onClick={handleClaim} refreshOnSuccess={true}>
                    Claim
                </SubmitButton>
            }
        >
            <CheckboxGroup colorScheme='green' defaultValue={[]} value={checkedMarkets} onChange={handleCheck}>
                <Box p="5" textAlign="left" justifyContent="left" w="full">
                    <Text mb="4" fontSize="14px">
                        Pools giving INV rewards where you have <b>supplied tokens</b> :
                    </Text>
                    { checkboxesWithBalance }
                    { !checkboxesWithBalance.length ? 'None' : '' }
                    {
                        checkboxesWithoutBalance?.length > 0 &&
                        <>
                            <Text my="4" fontSize="14px">
                                Other pools giving INV rewards :
                            </Text>
                            {checkboxesWithoutBalance}
                        </>
                    }
                    <InfoMessage alertProps={{ fontSize: '12px', mt: '9' }}
                        description="You may have INV rewards in a pool where you no longer have supplied tokens. The gas cost varies according to the number of pools to claim."
                    />
                </Box>
            </CheckboxGroup>
        </Modal>
    )
}