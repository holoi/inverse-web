import { ChakraProvider } from '@chakra-ui/react'
import './polyfill.css'
import '@fontsource/inter/100.css'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import '@app/pages/markdown.css'
import theme from '@app/theme'
import { fetcher, getLibrary } from '@app/util/web3'
import { Web3ReactProvider } from '@web3-react/core'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import { useEffect } from 'react';
import { useRouter } from 'next/dist/client/router'
import { gaPageview } from '@app/util/analytics'

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gaPageview(url)
    }
    //When the component is mounted, subscribe to router changes
    //and log those page views
    router.events.on('routeChangeComplete', handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Head>
          <title>{process.env.NEXT_PUBLIC_TITLE}</title>
          <link rel="icon" type="image/png" href="/assets/favicon.png"></link>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
              page_path: window.location.pathname,
            });
          `,
            }}
          />
        </Head>
        <SWRConfig
          value={{
            fetcher,
            refreshInterval: 300000,
          }}
        >
          <svg style={{ height: 0 }}>
            <defs>
              <linearGradient id="primary-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#332d69" />
                <stop offset="1" stopColor="#8881c900" />
              </linearGradient>
            </defs>
          </svg>
          <Component {...pageProps} />
        </SWRConfig>
      </Web3ReactProvider>
    </ChakraProvider>
  )
}

export default App
