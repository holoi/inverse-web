import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import Container from '@app/components/common/Container'
import { AgainstVotesModal, ForVotesModal } from '@app/components/Governance/GovernanceModals'
import { SkeletonList } from '@app/components/common/Skeleton'
import { QUORUM_VOTES } from '@app/config/constants'
import { ProposalStatus, ProposalVote, Proposal } from '@app/types'
import { namedAddress } from '@app/util'
import NextLink from 'next/link'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

const MAX_PREVIEW = 5

type VotesProps = {
  votes: number
  status: ProposalStatus
  voters: ProposalVote[]
  onViewAll: () => void
}

const Votes = ({ votes, status, voters, onViewAll }: VotesProps) => {
  const { chainId } = useWeb3React<Web3Provider>()

  return (
    <Stack w="full">
      <Flex justify="space-between" p={2}>
        <Text fontSize="sm" fontWeight="medium">{`${voters.length} voters`}</Text>
        <Text fontSize="sm" fontWeight="medium">
          {status === ProposalStatus.active
            ? `${votes.toFixed(0)} / ${QUORUM_VOTES.toFixed(0)} votes`
            : `${votes >= 1000 ? `${(votes / 1000).toFixed(2)}k` : votes.toFixed(0)} votes`}
        </Text>
      </Flex>
      {voters.slice(0, MAX_PREVIEW).map(({ voter, votes }: ProposalVote) => (
        <NextLink key={voter} href={`/governance/delegates/${voter}`} passHref>
          <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.850' }}>
            <Stack direction="row" align="center">
              <Avatar address={voter} sizePx={28} />
              <Text fontSize="sm" fontWeight="semibold">
                {namedAddress(voter, chainId)}
              </Text>
            </Stack>
            <Text fontSize="sm" fontWeight="semibold">
              {votes >= 1000 ? `${(votes / 1000).toFixed(2)}k` : votes.toFixed(2)}
            </Text>
          </Flex>
        </NextLink>
      ))}
      {voters.length > MAX_PREVIEW && (
        <Flex
          cursor="pointer"
          w="full"
          p={2}
          justify="center"
          fontSize="xs"
          fontWeight="semibold"
          borderRadius={8}
          textTransform="uppercase"
          color="purple.100"
          onClick={onViewAll}
          _hover={{ bgColor: 'purple.850' }}
        >
          View All
        </Flex>
      )}
    </Stack>
  )
}

export const ForVotes = ({ proposal }: { proposal: Proposal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposal?.id) {
    return (
      <Container label="For Votes">
        <SkeletonList />
      </Container>
    )
  }

  const { forVotes, status, voters } = proposal

  const forVoters = voters
    .filter(({ support }: ProposalVote) => support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="For Votes">
      <Votes votes={forVotes} voters={forVoters} status={status} onViewAll={onOpen} />
      <ForVotesModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Container>
  )
}

export const AgainstVotes = ({ proposal }: { proposal: Proposal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposal?.id) {
    return (
      <Container label="Against Votes">
        <SkeletonList />
      </Container>
    )
  }

  const { againstVotes, status, voters } = proposal

  const againstVoters = voters
    .filter(({ support }: ProposalVote) => !support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="Against Votes">
      <Votes votes={againstVotes} voters={againstVoters} status={status} onViewAll={onOpen} />
      <AgainstVotesModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Container>
  )
}
