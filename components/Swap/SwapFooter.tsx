
import { useEffect, useState } from 'react'
import { Text, TextProps, VStack, Flex } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { Swappers, Token } from '@app/types';
import { SubmitButton } from '@app/components/common/Button'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { InfoMessage } from '@app/components/common/Messages'
import { SwapSlippage } from './SwapSlippage'
import { ethereumReady } from '@app/util/web3';
import { SwapRoute } from './SwapRoute';

const SwapInfoMessage = ({ description, height }: { description: string, height?: string }) => {
    return <InfoMessage alertProps={{ w: 'full', fontSize: '12px', height }} description={description} />
}

const SwapText = ({ children, ...props }: { children: React.ReactNode } & Partial<TextProps>) => {
    return <Text color={'whiteAlpha.800'} textAlign="center" w="full" fontSize="12px" {...props}>
        {children}
    </Text>
}

export const SwapFooter = ({
    bestRoute,
    onRouteChange,
    routes,
    chosenRoute,
    canUseStabilizer,
    noStabilizerLiquidity,
    notEnoughTokens,
    exRates,
    fromToken,
    toToken,
    isDisabled,
    handleSubmit,
    toAmount,
    isApproved,
    maxSlippage,
    onMaxSlippageChange,
}: {
    bestRoute: Swappers | '',
    onRouteChange: (v: Swappers) => void,
    routes: any[],
    chosenRoute: Swappers,
    canUseStabilizer: boolean,
    noStabilizerLiquidity: boolean,
    notEnoughTokens: boolean,
    isDisabled: boolean,
    isApproved: boolean,
    exRates: any,
    fromToken: Token,
    toToken: Token,
    handleSubmit: () => void,
    toAmount: string,
    fromAmount: string,
    maxSlippage: number,
    onMaxSlippageChange: (v: number) => void
}) => {
    const { active } = useWeb3React<Web3Provider>()
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const init = async () => {
            await ethereumReady(10000);
            setIsReady(true);
        }
        init()
    }, [])

    const routeRadioOptions = routes.map((route) => {
        return {
            value: route.value,
            label: <SwapRoute label={route.label} isBestRoute={bestRoute === route.value} />
        }
    })

    const isStabilizer = chosenRoute === Swappers.stabilizer;

    const slippageZone = isStabilizer ?
        <Flex alignItems="center">
            <SwapInfoMessage description="There is no slippage when using the Stabilizer" />
        </Flex>
        :
        <SwapSlippage onChange={(v: string) => onMaxSlippageChange(parseFloat(v))} toToken={toToken} toAmount={toAmount} maxSlippage={maxSlippage} />

    const exRate = exRates && exRates[chosenRoute] ? exRates[chosenRoute][fromToken.symbol + toToken.symbol]?.toFixed(4) || '' : '';

    return (
        <>
            <Flex flexDirection={{ base: 'column', sm: 'row' }} w='full' justifyContent="space-between">
                <VStack textAlign="left">
                    <RadioCardGroup
                        wrapperProps={{ w: 'full', alignItems: 'center', justify: { base: 'center', sm: 'left' } }}
                        group={{
                            name: 'swapper',
                            value: chosenRoute,
                            onChange: onRouteChange,
                        }}
                        radioCardProps={{ p: 0, mr: '4' }}
                        options={routeRadioOptions}
                    />
                    <SwapText textAlign={{ base: 'center', sm: 'left' }}>
                        {
                            !active ? <>&nbsp;</> :
                                !exRate ?
                                    isStabilizer ? '' : 'Fetching rates...'
                                    :
                                    `Exchange Rate : 1 ${fromToken.symbol} = ${exRate} ${toToken.symbol}`
                        }
                    </SwapText>
                </VStack>
                <VStack spacing={2} height={{ base: 'auto', sm: '60px' }}>
                    {slippageZone}
                </VStack>
            </Flex>

            {
                chosenRoute === Swappers.stabilizer && !canUseStabilizer ?
                    <SwapInfoMessage description="The Stabilizer can only be used for the DAI-DOLA pair" />
                    :
                    chosenRoute === Swappers.stabilizer && noStabilizerLiquidity && !notEnoughTokens ?
                        <SwapInfoMessage description="There is not enough DAI liquidity in the Stabilizer right now for this swap" />
                        :
                        <>
                            <SubmitButton isDisabled={isDisabled} onClick={handleSubmit}>
                                {
                                    notEnoughTokens ? 'Not enough tokens' : isApproved ? 'Swap' : 'Approve'
                                }
                                {
                                    !isApproved ?
                                        <AnimatedInfoTooltip iconProps={{ ml: '2' }} message="Approvals are required once per Token and Protocol" /> : null
                                }
                            </SubmitButton>
                        </>
            }
        </>
    )
}