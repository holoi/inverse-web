import { Flex, Stack } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import Container from '@app/components/common/Container'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { Delegate } from '@app/types'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import Head from 'next/head'
import { useNamedAddress } from '@app/hooks/useNamedAddress'

const DelegatesTable = () => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { delegates, isLoading } = useTopDelegates()
  const router = useRouter()

  const totalVotes = delegates.reduce((totalVotes: number, { votingPower }: Delegate) => (totalVotes += votingPower), 0)

  const columns = [
    {
      field: 'rank',
      label: 'Rank',
      header: ({ ...props }) => <Flex minWidth={64} {...props} />,
      value: ({ address, ensName, rank }: Delegate, i: number) => {
        const { addressName } = useNamedAddress(address, chainId, ensName);
        return (
          (
            <Stack direction="row" align="center" spacing={4} minWidth={64}>
              <Flex w={4} justify="center">
                {rank}
              </Flex>
              <Stack direction="row" align="center">
                <Avatar address={address} sizePx={24} />
                <Flex>{addressName}</Flex>
              </Stack>
            </Stack>
          )
        )
      },
    },
    {
      field: 'delegators',
      label: 'Delegators',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ delegators }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${delegators.length}`}</Flex>,
    },
    {
      field: 'votes',
      label: 'Proposals Voted',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votes }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votes.length}`}</Flex>,
    },
    {
      field: 'votingPower',
      label: 'Votes',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votingPower }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votingPower.toFixed(2)}`}</Flex>,
    },
    {
      field: 'votingPower',
      label: 'Vote weight',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votingPower }: Delegate) => (
        <Flex justify="flex-end" minWidth={32}>{`${((votingPower / totalVotes) * 100).toFixed(2)}%`}</Flex>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Container label="Delegate Top 100" description="Top delegates by voting weight">
        <SkeletonBlob skeletonHeight={6} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container label="Delegate Top 100" description="Top delegates by voting weight">
      <Table
        columns={columns}
        items={delegates.slice(0, 100)}
        keyName={'address'}
        onClick={({ address }: Delegate) => router.push(`/governance/delegates/${address}`)}
      />
    </Container>
  )
}

export const Stake = () => (
  <Layout>
    <Head>
      <title>{process.env.NEXT_PUBLIC_TITLE} - Delegates</title>
    </Head>
    <AppNav active="Governance" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Delegates', href: '#' },
      ]}
    />
    <Flex w="full" align="center" direction="column">
      <Flex w={{ base: 'full', xl: '7xl' }} align="center">
        <DelegatesTable />
      </Flex>
    </Flex>
  </Layout>
)

export default Stake
