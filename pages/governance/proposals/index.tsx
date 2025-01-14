import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, Proposals, VotingWallet } from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

export const Governance = () => (
  <Layout>
    <Head>
      <title>{process.env.NEXT_PUBLIC_TITLE} - Proposals</title>
    </Head>
    <AppNav active="Governance" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Proposals', href: '#' },
      ]}
    />
    <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <Proposals />
        </Flex>
      </Flex>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <VotingWallet />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Flex w="full" m={6} mb={0} mt="14">
            <GovernanceInfos />
          </Flex>
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Breakdown />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <DelegatesPreview />
        </Flex>
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
