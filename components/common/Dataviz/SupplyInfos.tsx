import { Flex, Image, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { InfoMessage } from '@app/components/common/Messages'
import { Token, NetworkIds } from '@app/types';
import { getNetwork } from '@app/util/networks';

const Img = ({ src }: { src: string }) =>
    <Image mx="1" display="inline-block" src={src} ignoreFallback={true} w='15px' h='15px' />

export const SuppplyInfos = ({
    title,
    supplies,
    token,
}: {
    title?: React.ReactNode,
    supplies: { supply: number, chainId: NetworkIds, name?: string }[],
    token?: Token,
}) => {
    const totalSupply = supplies.reduce((prev, curr) => prev + curr.supply, 0);
    return (
        <InfoMessage
            title={
                token ? <Flex alignItems="center">
                    <Image mr="2" display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' />
                    {token.symbol} Total Supplies : 
                </Flex>
                : title
            }
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                <>
                    {
                        supplies.map(({ supply, chainId, name, projectImage }, i) => {
                            const network = getNetwork(chainId);
                            return (
                                <Flex key={i} position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                                    <Flex alignItems="center">
                                        <Text>-</Text>
                                        <Img src={projectImage ? `/assets/projects/${projectImage}` : network.image!} />
                                        <Text lineHeight="15px">On {name || network.name}:</Text>
                                    </Flex>
                                    <Text>{shortenNumber(supply)} ({shortenNumber(totalSupply ? supply / totalSupply * 100 : 0)}%)</Text>
                                </Flex>
                            )
                        })
                    }
                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- Total Cross-Chain:</Text>
                        <Text>{shortenNumber(totalSupply)}</Text>
                    </Flex>
                </>
            }
        />
    )
}