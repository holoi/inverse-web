import { Image, Stack, Text } from '@chakra-ui/react'
import { MENUS } from '@app/variables/menus'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'

const SOCIALS = MENUS.socials;

const LINK_GROUPS = MENUS.footerGroups;

export const Footer = () => (
  <Stack w="full" direction={{ base: 'column', lg: 'row' }} spacing={8} p={8} justify="space-around" color="#fff">
    <Stack width={{ base: 'full', lg: 72 }} spacing={4}>
      <Stack direction="row" align="center">
        <Logo boxSize={7} />
        <Text fontWeight="bold">{process.env.NEXT_PUBLIC_TITLE}</Text>
      </Stack>
      <Text fontSize="13px">
        {process.env.NEXT_PUBLIC_SHORTNAME} is building a suite of DeFi tools. Everything we do is a community effort, which means you too can
        participate in the decision-making process. Join us!
      </Text>
      <Stack direction="row" spacing={5} align="center">
        {SOCIALS.map(({ href, image }, i) => (
          <Link key={i} href={href}>
            <Image src={image} />
          </Link>
        ))}
      </Stack>
    </Stack>
    <Stack
      justify={{ base: 'flex-start', lg: 'space-around' }}
      spacing={{ base: 0, lg: 16 }}
      direction="row"
      wrap="wrap"
      shouldWrapChildren
    >
      {LINK_GROUPS.map(({ groupLabel, items }) => (
        <Stack key={groupLabel} w={32} mb={4}>
          <Text fontWeight="bold">{groupLabel}</Text>
          {items.map(({ label, href }, i) => (
            <Link key={i} href={href} fontSize="13px">
              {label}
            </Link>
          ))}
        </Stack>
      ))}
    </Stack>
  </Stack>
)

export default Footer
