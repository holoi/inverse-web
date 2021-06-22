import { Flex } from '@chakra-ui/react'
import { ActiveProposals, RecentProposals, DelegatesPreview, VotingPower } from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'

export const Governance = () => (
  <Layout>
    <AppNav active="Governance" />
    <Flex w="full" justify="center">
      <Flex direction="column">
        <ActiveProposals />
        <RecentProposals />
      </Flex>
      <Flex direction="column">
        <VotingPower />
        <DelegatesPreview />
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
