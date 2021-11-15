import { Flex } from '@chakra-ui/react'
import {
  AnchorBorrow,
  AnchorBorrowed,
  AnchorOverview,
  AnchorSupplied,
  AnchorSupply,
  AnchorHeader,
} from '@inverse/components/Anchor'
import { NavButtons } from '@inverse/components/common/Button'
import Container from '@inverse/components/common/Container'
import { ErrorBoundary } from '@inverse/components/common/ErrorBoundary'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { useState } from 'react'

export const Anchor = () => {
  const [active, setActive] = useState('Supply')

  const supplyDisplay = { base: active === 'Supply' ? 'flex' : 'none', lg: 'flex' }
  const borrowDisplay = { base: active === 'Borrow' ? 'flex' : 'none', lg: 'flex' }

  return (
    <Layout>
      <AppNav active="Anchor" />
      <ErrorBoundary>
        <Flex w={{ base: 'full', xl: '84rem' }} justify="flex-start">
          <ErrorBoundary><AnchorHeader /></ErrorBoundary>
        </Flex>
        <Flex w={{ base: 'full', xl: '84rem' }} justify="center">
          <ErrorBoundary>
            <AnchorOverview />
          </ErrorBoundary>
        </Flex>
        <Flex w="full" direction="column" justify="center">
          <Flex w="full" justify="center" display={{ base: 'flex', lg: 'none' }}>
            <Container noPadding>
              <NavButtons options={['Supply', 'Borrow']} active={active} onClick={setActive} />
            </Container>
          </Flex>
          <Flex w="full" justify="center">
            <Flex w={{ base: 'full', xl: '2xl' }} justify="flex-end" display={supplyDisplay}>
              <ErrorBoundary description="Failed to load supplied assets"><AnchorSupplied /></ErrorBoundary>
            </Flex>
            <Flex w={{ base: 'full', xl: '2xl' }} display={borrowDisplay}>
              <ErrorBoundary description="Failed to load borrowed assets"><AnchorBorrowed /></ErrorBoundary>
            </Flex>
          </Flex>
          <Flex w="full" justify="center">
            <Flex w={{ base: 'full', xl: '2xl' }} justify="flex-end" display={supplyDisplay}>
              <ErrorBoundary description="Failed to load suppliable assets"><AnchorSupply /></ErrorBoundary>
            </Flex>
            <Flex w={{ base: 'full', xl: '2xl' }} display={borrowDisplay}>
              <ErrorBoundary description="failed to load borrowable assets"><AnchorBorrow /></ErrorBoundary>
            </Flex>
          </Flex>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default Anchor
