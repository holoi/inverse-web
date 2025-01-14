import { Stack, Flex, useDisclosure } from '@chakra-ui/react'
import { BalanceInput } from '@app/components/common/Input'
import { useState, useEffect } from 'react'
import { FromAssetDropdown } from '@app/components/common/Assets/FromAssetDropdown'
import { BigNumberList, Token, TokenList } from '@app/types';
import { getParsedBalance } from '@app/util/markets';
import { commify } from 'ethers/lib/utils';

const getMaxBalance = (balances: BigNumberList, token: Token) => {
    return getParsedBalance(balances, token.address, token.decimals);
}

export const AssetInput = ({
    amount,
    balances,
    token,
    tokens,
    assetOptions,
    onAssetChange,
    onAmountChange,
    showBalance,
}: {
    amount: string,
    balances: BigNumberList,
    token: Token,
    tokens: TokenList,
    assetOptions: string[],
    onAssetChange: (newToken: Token) => void,
    onAmountChange: (newAmount: string) => void,
    showBalance?: boolean,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [justClosed, setJustClosed] = useState(isOpen)

    useEffect(() => {
        if (!isOpen) { setJustClosed(true) }
        setTimeout(() => setJustClosed(false), 200)
    }, [isOpen])

    const setAmountToMax = () => {
        onAmountChange((Math.floor(getMaxBalance(balances, token) * 1e8) / 1e8).toString())
    }

    return (
        <BalanceInput
            value={amount}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => onAmountChange(e.currentTarget.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
            onMaxClick={setAmountToMax}
            inputProps={{
                fontSize: { base: '12px', sm: '20px' },
                minW: { base: 'full', sm: '280px' },
            }}
            showBalance={showBalance}
            balance={commify(getMaxBalance(balances, token).toFixed(2))}
            label={
                <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                    <Flex w={0.5} h={8}>
                        <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
                    </Flex>
                    <FromAssetDropdown
                        tokens={tokens}
                        balances={balances}
                        isOpen={isOpen}
                        onClose={onClose}
                        onOpen={() => {
                            if (!isOpen && !justClosed) { onOpen() }
                        }}
                        asset={token}
                        options={assetOptions}
                        handleChange={(selected: string) => {
                            onClose()
                            onAssetChange(tokens[selected])
                        }}
                    />
                </Stack>
            }
        />
    )
}