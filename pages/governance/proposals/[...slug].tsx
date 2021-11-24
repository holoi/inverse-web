import { Flex, Text } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import {
  AgainstVotes,
  ForVotes,
  ProposalActions,
  ProposalDetails,
  VoteButton,
  VotingWallet,
} from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { useRouter } from 'next/dist/client/router'
import { Proposal } from '@inverse/types';
import { useProposals } from '@inverse/hooks/useProposals';

// TODO: use SSG
// urls can be /governance/proposals/<numProposal> or /governance/proposals/<era>/<proposalId>
export const Governance = () => {
  const { asPath } = useRouter();
  const slug = asPath.replace('/governance/proposals/', '').split('/');
  const { proposals, isLoading } = useProposals();

  const proposal = proposals?.find((p: Proposal) => {
    return slug.length === 1 ? p.proposalNum.toString() === slug[0] : p.era === slug[0] && p.id.toString() === slug[1]
  }) || {} as Proposal;

  const { id = '', era = '' } = proposal;

  const notFound = !isLoading && !id;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Proposals', href: '/governance/proposals' },
          { label: `Proposal ${proposalBreadLabel}`, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        {
          notFound ? <Flex w="full" justifyContent="center" pt="50">
            <Text fontSize="xl">Proposal not found, please check the url</Text>
          </Flex>
            :
            <>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalDetails proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalActions proposal={proposal} />
                </Flex>
              </Flex>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VoteButton proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VotingWallet />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <ForVotes proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <AgainstVotes proposal={proposal} />
                </Flex>
              </Flex>
            </>
        }
      </Flex>
    </Layout>
  )
}

export default Governance