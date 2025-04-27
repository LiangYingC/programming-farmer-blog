import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@components/Header/index';
import Footer from '@components/Footer/index';
import { LOCALES } from '@constants/locales';
import { Locale } from '@myTypes/locale';
import { Content } from '@components/Layout/indexStyle';

const DOMAIN = 'https://www.programfarmer.com';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageDesc: string;
  pageURL: string;
  pageType: string;
}

const Layout = ({
  children,
  pageTitle,
  pageDesc,
  pageURL,
  pageType,
}: LayoutProps) => {
  const isHomePage = pageURL === 'https://www.programfarmer.com';
  const router = useRouter();
  const { asPath } = router;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link
          rel="shortcut icon"
          href="https://www.programfarmer.com/assets/icons/favicon-32x32.png"
        />
        <link rel="canonical" href={pageURL} />
        {LOCALES.map((loc: Locale) => (
          <link
            key={loc}
            rel="alternate"
            hrefLang={loc}
            href={`${DOMAIN}/${loc}${asPath}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${DOMAIN}/zh-TW${asPath}`}
        />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} key="desc" />
        <meta property="og:type" content={pageType} key="ogType" />
        <meta property="og:title" content={pageTitle} key="ogTitle" />
        <meta property="og:description" content={pageDesc} key="ogDesc" />
        <meta property="og:url" content={pageURL} key="ogUrl" />
        <meta
          property="og:image"
          content="https://www.programfarmer.com/assets/icons/icon-384x384.png"
          key="ogImage"
        />
        <meta property="og:site_name" content="城市碼農" key="ogSiteName" />
        <meta name="twitter:title" content={pageTitle} key="twitterTitle" />
        <meta name="twitter:description" content={pageDesc} key="twitterDesc" />
        <meta name="twitter:url" content={pageURL} key="twitterPageUrl" />
        <meta
          name="twitter:image"
          content="https://www.programfarmer.com/assets/icons/icon-384x384.png"
          key="twitterImage"
        />
        <meta
          name="twitter:creator"
          content="@LiangCh95173853"
          key="twitterCreator"
        />
        {isHomePage && (
          <meta
            name="google-site-verification"
            content="_56OsPYwyzuO5DhzeVWWNACHMlX2yABiQCw7FpDZcqI"
            key="googleSearchConsole"
          />
        )}
      </Head>
      <Header />
      <Content>{children}</Content>
      <Footer />
    </>
  );
};

export default Layout;
